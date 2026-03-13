
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { buildUSSDCode, buildTelURI, normalizePhone, OPERATOR_CONFIGS, type Operator } from '@/lib/ussd';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * Schéma de validation pour l'initiation d'achat
 */
const initiatePurchaseSchema = z.object({
  zoneId: z.string().uuid('ID de zone invalide'),
  tarifId: z.string().uuid('ID de tarif invalide'),
  operator: z.enum(['orange', 'moov', 'telecel', 'wave'], {
    errorMap: () => ({ message: 'Opérateur invalide' }),
  }),
  customerPhone: z.string().min(8, 'Numéro de téléphone requis'),
});

/**
 * POST /api/purchase/initiate
 *
 * Crée une demande d'achat en attente de paiement.
 * Le client paie via USSD, le SMS forwarder confirmera et distribuera le ticket.
 *
 * Body : { zoneId, tarifId, operator, customerPhone }
 *
 * Retourne : {
 *   requestId: string,
 *   ussdCode: string,
 *   ussdTelUri: string,
 *   amount: number,
 *   operator: string,
 *   expiresAt: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation
    const validatedData = initiatePurchaseSchema.parse(body);
    const { zoneId, tarifId, operator, customerPhone } = validatedData;

    // Normaliser le numéro de téléphone
    const normalizedPhone = normalizePhone(customerPhone);

    // Rate limiting : max 5 requêtes par numéro par heure (persistent via Supabase)
    const rateLimitResult = await checkRateLimit(normalizedPhone, 5);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Réessayez dans 1 heure.' },
        { status: 429 }
      );
    }

    
    const admin = createAdminClient();

    // Récupérer la zone et vérifier qu'elle est active
    const { data: zone, error: zoneError } = await admin
      .from('zones')
      .select('id, name, is_active')
      .eq('id', zoneId)
      .single();

    if (zoneError || !zone) {
      return NextResponse.json({ error: 'Zone non trouvée' }, { status: 404 });
    }

    if (!zone.is_active) {
      return NextResponse.json({ error: 'Zone désactivée' }, { status: 400 });
    }

    // Récupérer le tarif
    const { data: tarif, error: tarifError } = await admin
      .from('tarifs')
      .select('id, label, duration_minutes, data_limit_mb, price_fcfa, zone_id')
      .eq('id', tarifId)
      .eq('zone_id', zoneId)
      .eq('is_active', true)
      .single();

    if (tarifError || !tarif) {
      return NextResponse.json({ error: 'Tarif non disponible' }, { status: 404 });
    }

    // Récupérer le numéro de téléphone du propriétaire pour cet opérateur
    const { data: paymentMethod, error: paymentError } = await admin
      .from('zone_payment_methods')
      .select('phone_number, ussd_format')
      .eq('zone_id', zoneId)
      .eq('operator', operator)
      .eq('is_active', true)
      .maybeSingle();

    if (paymentError || !paymentMethod) {
      return NextResponse.json(
        { error: 'Moyen de paiement non configuré pour cet opérateur' },
        { status: 400 }
      );
    }

    // Vérifier qu'il y a des tickets disponibles
    const { data: availableTicket, error: ticketError } = await admin
      .from('tickets')
      .select('id')
      .eq('zone_id', zoneId)
      .eq('tarif_id', tarifId)
      .eq('status', 'available')
      .limit(1)
      .maybeSingle();

    if (ticketError || !availableTicket) {
      return NextResponse.json(
        { error: 'Désolé, plus de tickets disponibles pour ce tarif' },
        { status: 400 }
      );
    }

    // Vérifier si une demande en attente existe déjà pour ce téléphone/zone
    const { data: existingRequest } = await admin
      .from('pending_requests')
      .select('id, status, created_at, expires_at')
      .eq('zone_id', zoneId)
      .eq('client_phone', normalizedPhone)
      .eq('status', 'waiting_payment')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Générer les codes USSD
    const ussdFormat = paymentMethod.ussd_format || OPERATOR_CONFIGS[operator as Operator].format;
    const ussdCode = buildUSSDCode(ussdFormat, paymentMethod.phone_number, tarif.price_fcfa);
    const ussdTelUri = buildTelURI(ussdFormat, paymentMethod.phone_number, tarif.price_fcfa);

    // Si une demande existe et n'est pas expirée, la retourner
    if (existingRequest) {
      return NextResponse.json({
        requestId: existingRequest.id,
        ussdCode,
        ussdTelUri,
        amount: tarif.price_fcfa,
        operator,
        expiresAt: existingRequest.expires_at,
        isExisting: true,
      });
    }

    // Créer la pending_request
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const { data: pendingRequest, error: pendingError } = await admin
      .from('pending_requests')
      .insert({
        zone_id: zoneId,
        tarif_id: tarifId,
        client_phone: normalizedPhone,
        operator,
        amount_fcfa: tarif.price_fcfa,
        status: 'waiting_payment',
        expires_at: expiresAt.toISOString(),
      })
      .select('id')
      .single();

    if (pendingError || !pendingRequest) {
      console.error('Erreur création pending_request:', pendingError);
      return NextResponse.json(
        { error: 'Erreur lors de la création de la demande' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      requestId: pendingRequest.id,
      ussdCode,
      ussdTelUri,
      amount: tarif.price_fcfa,
      operator,
      expiresAt: expiresAt.toISOString(),
      message: 'Demande créée. Effectuez le paiement pour recevoir votre code.',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erreur purchase/initiate:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
