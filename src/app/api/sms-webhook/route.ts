/**
 * POST /api/sms-webhook
 *
 * Webhook pour recevoir les SMS forwardés depuis l'app Android SMS Forwarder.
 * Utilisé pour valider automatiquement les paiements Mobile Money.
 *
 * FLOW:
 * 1. Le client paie via Mobile Money (USSD)
 * 2. Le propriétaire reçoit un SMS de confirmation
 * 3. L'app SMS Forwarder forward le SMS à ce webhook
 * 4. Le serveur parse le SMS et match avec une pending_request
 * 5. Le ticket est distribué au client par SMS
 *
 * SÉCURITÉ:
 * - Authentification via Bearer token (sms_webhook_tokens table)
 * - CORS permissif pour l'app Android
 * - Log tous les événements pour debug
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { parseMobileMoneysSMS } from '@/lib/sms/parser';
import { sendWiFiCodeSMS } from '@/lib/sms/sender';
import { formatDuration } from '@/lib/utils';

/**
 * Schéma de validation pour le webhook SMS
 */
const smsWebhookSchema = z.object({
  /** Expéditeur du SMS (ex: "OrangeMoney", "SMS Forwarder") */
  from: z.string().min(1),
  /** Contenu du SMS de confirmation Mobile Money */
  message: z.string().min(10),
  /** Timestamp de réception du SMS (ISO 8601) */
  receivedAt: z.string().optional().default(() => new Date().toISOString()),
  /** Slot SIM (optionnel, pour multi-SIM) */
  simSlot: z.number().optional(),
});

/**
 * Résultat de matching
 */
interface MatchResult {
  matched: boolean;
  requestId?: string;
  zoneId?: string;
  zoneName?: string;
  ticketUsername?: string;
  error?: string;
}

/**
 * Logger structuré pour le webhook SMS
 */
function logWebhook(level: 'info' | 'warn' | 'error', message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    context: 'sms-webhook',
    message,
    ...data,
  };

  if (level === 'error') {
    console.error(JSON.stringify(logEntry));
  } else if (level === 'warn') {
    console.warn(JSON.stringify(logEntry));
  } else {
    console.log(JSON.stringify(logEntry));
  }
}

/**
 * POST /api/sms-webhook
 *
 * Headers:
 *   Authorization: Bearer {token}
 *
 * Body:
 *   {
 *     "from": "OrangeMoney",
 *     "message": "Vous avez recu 200 FCFA de 70 12 34 56...",
 *     "receivedAt": "2026-02-25T10:30:00Z",
 *     "simSlot": 0
 *   }
 *
 * Response:
 *   - 200 + { matched: true } : SMS traité et matché
 *   - 200 + { matched: false } : SMS reçu mais pas de match
 *   - 401 : Token invalide
 *   - 400 : Corps de requête invalide
 *   - 500 : Erreur serveur
 */
export async function POST(request: NextRequest) {
  const admin = createAdminClient();

  try {
    // 1. Extraire et vérifier le token Bearer
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logWebhook('warn', 'Missing or invalid Authorization header');
      return NextResponse.json({ error: 'Authorization requise' }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // 2. Vérifier le token dans la table sms_webhook_tokens
    const { data: tokenData, error: tokenError } = await admin
      .from('sms_webhook_tokens')
      .select('id, owner_id, is_active')
      .eq('token', token)
      .eq('is_active', true)
      .maybeSingle();

    if (tokenError || !tokenData) {
      logWebhook('warn', 'Invalid or inactive webhook token', { token: token.slice(0, 8) + '...' });
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    const ownerId = tokenData.owner_id;

    // 3. Parser et valider le corps de la requête
    const rawBody = await request.json();
    const validationResult = smsWebhookSchema.safeParse(rawBody);

    if (!validationResult.success) {
      logWebhook('warn', 'Invalid webhook body', {
        errors: validationResult.error.errors,
        body: rawBody,
      });
      return NextResponse.json(
        { error: 'Corps de requête invalide', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { from, message, receivedAt } = validationResult.data;

    logWebhook('info', 'SMS received', {
      from,
      messageLength: message.length,
      receivedAt,
      ownerId,
    });

    // 4. Parser le SMS avec parseMobileMoneysSMS()
    const parsedSMS = parseMobileMoneysSMS(message);

    if (!parsedSMS) {
      // Le SMS n'est pas reconnu comme un paiement Mobile Money
      // On log pour analyse future mais on retourne 200 pour ne pas bloquer le forwarder
      logWebhook('info', 'SMS not recognized as Mobile Money payment', {
        message: message.slice(0, 100),
        from,
      });
      return NextResponse.json({
        matched: false,
        reason: 'not_payment_sms',
      });
    }

    logWebhook('info', 'SMS parsed successfully', {
      operator: parsedSMS.operator,
      amount: parsedSMS.amount,
      senderPhone: parsedSMS.senderPhone,
      reference: parsedSMS.reference,
    });

    // 5. Récupérer toutes les zones du propriétaire
    const { data: zones, error: zonesError } = await admin
      .from('zones')
      .select('id, name, is_active')
      .eq('owner_id', ownerId)
      .eq('is_active', true);

    if (zonesError || !zones || zones.length === 0) {
      logWebhook('warn', 'No active zones found for owner', { ownerId });
      return NextResponse.json({
        matched: false,
        reason: 'no_active_zones',
      });
    }

    const zoneIds = zones.map((z) => z.id);

    // 6. Chercher une pending_request qui matche
    // Critères de matching:
    // - zone_id dans les zones du propriétaire
    // - amount_fcfa == montant du SMS
    // - client_phone == numéro expéditeur du SMS (normalisé)
    // - status == 'waiting_payment'
    // - expires_at > now

    const { data: matchingRequests, error: matchError } = await admin
      .from('pending_requests')
      .select(`
        id,
        zone_id,
        tarif_id,
        client_phone,
        amount_fcfa,
        operator,
        expires_at,
        tarif:tarifs(
          id,
          label,
          duration_minutes
        ),
        zone:zones(
          id,
          name
        )
      `)
      .in('zone_id', zoneIds)
      .eq('amount_fcfa', parsedSMS.amount)
      .eq('client_phone', parsedSMS.senderPhone)
      .eq('status', 'waiting_payment')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false }) // Prendre le plus récent si plusieurs
      .limit(1);

    if (matchError) {
      logWebhook('error', 'Error searching for matching pending_request', {
        error: matchError.message,
        amount: parsedSMS.amount,
        senderPhone: parsedSMS.senderPhone,
      });
      return NextResponse.json(
        { error: 'Erreur lors de la recherche de demande correspondante' },
        { status: 500 }
      );
    }

    if (!matchingRequests || matchingRequests.length === 0) {
      logWebhook('info', 'No matching pending_request found', {
        amount: parsedSMS.amount,
        senderPhone: parsedSMS.senderPhone,
        operator: parsedSMS.operator,
        zoneIds,
      });
      return NextResponse.json({
        matched: false,
        reason: 'no_matching_request',
        searchCriteria: {
          amount: parsedSMS.amount,
          senderPhone: parsedSMS.senderPhone,
          zoneIds,
        },
      });
    }

    const pendingRequest = matchingRequests[0];
    const requestData = Array.isArray(pendingRequest) ? pendingRequest[0] : pendingRequest;
    const tarifData = Array.isArray(requestData.tarif) ? requestData.tarif[0] : requestData.tarif;
    const zoneData = Array.isArray(requestData.zone) ? requestData.zone[0] : requestData.zone;

    logWebhook('info', 'Matching pending_request found', {
      requestId: requestData.id,
      zoneName: zoneData?.name,
      tarifLabel: tarifData?.label,
    });

    // 7. Récupérer un ticket disponible pour ce tarif
    const { data: availableTicket, error: ticketError } = await admin
      .from('tickets')
      .select('id, username, password')
      .eq('zone_id', requestData.zone_id)
      .eq('tarif_id', requestData.tarif_id)
      .eq('status', 'available')
      .limit(1)
      .maybeSingle();

    if (ticketError) {
      logWebhook('error', 'Error fetching available ticket', {
        error: ticketError.message,
        requestId: requestData.id,
      });
      return NextResponse.json(
        { error: 'Erreur lors de la récupération du ticket' },
        { status: 500 }
      );
    }

    if (!availableTicket) {
      // Plus de tickets disponibles → marquer la request comme failed
      await admin
        .from('pending_requests')
        .update({
          status: 'manual_review',
          sms_ref: parsedSMS.reference || null,
        })
        .eq('id', requestData.id);

      logWebhook('warn', 'No tickets available - marked for manual review', {
        requestId: requestData.id,
        zoneId: requestData.zone_id,
        tarifId: requestData.tarif_id,
      });
      return NextResponse.json({
        matched: false,
        reason: 'no_tickets_available',
        requestId: requestData.id,
      });
    }

    // 8. Mettre à jour le ticket → sold
    const { error: updateTicketError } = await admin
      .from('tickets')
      .update({
        status: 'sold',
        buyer_phone: parsedSMS.senderPhone,
        sold_at: new Date().toISOString(),
      })
      .eq('id', availableTicket.id);

    if (updateTicketError) {
      logWebhook('error', 'Error updating ticket status', {
        error: updateTicketError.message,
        ticketId: availableTicket.id,
      });
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du ticket' },
        { status: 500 }
      );
    }

    // 9. Mettre à jour la pending_request → completed
    const { error: updateRequestError } = await admin
      .from('pending_requests')
      .update({
        status: 'completed',
        ticket_id: availableTicket.id,
        sms_ref: parsedSMS.reference || null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', requestData.id);

    if (updateRequestError) {
      logWebhook('error', 'Error updating pending_request status', {
        error: updateRequestError.message,
        requestId: requestData.id,
      });
      // Pas d'erreur 500 ici car le ticket est déjà marqué sold
    }

    // 10. Créer une transaction dans la table transactions
    const { error: transactionError } = await admin
      .from('transactions')
      .insert({
        zone_id: requestData.zone_id,
        tarif_id: requestData.tarif_id,
        ticket_id: availableTicket.id,
        pending_request_id: requestData.id,
        amount_fcfa: parsedSMS.amount,
        buyer_phone: parsedSMS.senderPhone,
        operator: parsedSMS.operator,
        sms_ref: parsedSMS.reference || null,
        validation_method: 'sms_forward',
      });

    if (transactionError) {
      logWebhook('error', 'Error creating transaction', {
        error: transactionError.message,
        requestId: requestData.id,
      });
      // Pas fatal, on continue
    }

    // 11. Envoyer le SMS au client avec le code WiFi
    const duration = tarifData ? formatDuration(tarifData.duration_minutes) : 'inconnue';
    const smsResult = await sendWiFiCodeSMS(
      parsedSMS.senderPhone,
      zoneData?.name || 'WiFi Zone',
      availableTicket.username,
      availableTicket.password,
      duration
    );

    if (!smsResult.success) {
      logWebhook('error', 'Failed to send WiFi code SMS to client', {
        error: smsResult.error,
        phone: parsedSMS.senderPhone,
        requestId: requestData.id,
      });
      // Le ticket est déjà distribué, on retourne success même si le SMS échoue
      // Le client peut récupérer son code via la page d'achat
    }

    // 12. Mettre à jour last_used_at du token
    await admin
      .from('sms_webhook_tokens')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', tokenData.id);

    logWebhook('info', 'Payment validated and ticket distributed', {
      requestId: requestData.id,
      zoneName: zoneData?.name,
      ticketUsername: availableTicket.username,
      buyerPhone: parsedSMS.senderPhone,
      amount: parsedSMS.amount,
      smsSent: smsResult.success,
    });

    return NextResponse.json({
      matched: true,
      requestId: requestData.id,
      zoneId: requestData.zone_id,
      zoneName: zoneData?.name,
      ticket: {
        username: availableTicket.username,
      },
      smsSent: smsResult.success,
    });

  } catch (error: any) {
    logWebhook('error', 'Unexpected error in sms-webhook', {
      error: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler pour CORS (support depuis Android app)
 * L'app SMS Forwarder n'a pas d'origin web, on permet tout
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
