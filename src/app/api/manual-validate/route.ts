import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendWiFiCodeSMS } from '@/lib/sms/sender';
import { formatDuration } from '@/lib/utils';

/**
 * Schéma de validation pour la validation manuelle
 */
const manualValidateSchema = z.object({
  requestId: z.string().uuid('ID de demande invalide'),
  action: z.enum(['approve', 'reject'], {
    errorMap: () => ({ message: 'Action must be approve or reject' }),
  }),
});

/**
 * POST /api/manual-validate
 *
 * Permet au propriétaire d'une zone de valider ou rejeter manuellement
 * une demande d'achat en attente.
 *
 * Cas d'utilisation :
 * - Le SMS forwarding ne fonctionne pas
 * - Le propriétaire veut valider un paiement reçu autrement
 * - Le propriétaire veut rejeter une demande suspecte
 *
 * Body : { requestId: string, action: 'approve' | 'reject' }
 *
 * Retourne : {
 *   success: boolean,
 *   message: string,
 *   ticket?: { username: string, password: string }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = manualValidateSchema.parse(body);
    const { requestId, action } = validatedData;

    // Récupérer la pending_request avec les infos de la zone
    const { data: pendingRequest, error: requestError } = await admin
      .from('pending_requests')
      .select(`
        *,
        zone:zones(id, name, owner_id),
        tarif:tarifs(id, label, duration_minutes)
      `)
      .eq('id', requestId)
      .single();

    if (requestError || !pendingRequest) {
      return NextResponse.json({ error: 'Demande non trouvée' }, { status: 404 });
    }

    // Vérifier que l'utilisateur est le propriétaire de la zone
    if (pendingRequest.zone?.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas autorisé à valider cette demande' },
        { status: 403 }
      );
    }

    // Vérifier que la demande est toujours en attente
    if (pendingRequest.status !== 'waiting_payment') {
      return NextResponse.json(
        {
          error: 'Cette demande n\'est plus en attente',
          currentStatus: pendingRequest.status,
        },
        { status: 400 }
      );
    }

    // Vérifier que la demande n'est pas expirée
    if (pendingRequest.expires_at < new Date().toISOString()) {
      return NextResponse.json(
        { error: 'Cette demande a expiré' },
        { status: 400 }
      );
    }

    // === REJET ===
    if (action === 'reject') {
      const { error: updateError } = await admin
        .from('pending_requests')
        .update({ status: 'expired' })
        .eq('id', requestId);

      if (updateError) {
        console.error('Erreur rejet pending_request:', updateError);
        return NextResponse.json(
          { error: 'Erreur lors du rejet' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Demande rejetée avec succès',
      });
    }

    // === APPROBATION ===
    const zoneId = pendingRequest.zone_id;
    const tarifId = pendingRequest.tarif_id;
    const clientPhone = pendingRequest.client_phone;

    // Récupérer un ticket disponible
    const { data: ticket, error: ticketError } = await admin
      .from('tickets')
      .select('*')
      .eq('zone_id', zoneId)
      .eq('tarif_id', tarifId)
      .eq('status', 'available')
      .limit(1)
      .maybeSingle();

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: 'Aucun ticket disponible pour ce tarif' },
        { status: 400 }
      );
    }

    // Marquer le ticket comme vendu
    const { error: ticketUpdateError } = await admin
      .from('tickets')
      .update({
        status: 'sold',
        buyer_phone: clientPhone,
        sold_at: new Date().toISOString(),
      })
      .eq('id', ticket.id);

    if (ticketUpdateError) {
      console.error('Erreur update ticket:', ticketUpdateError);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du ticket' },
        { status: 500 }
      );
    }

    // Marquer la pending_request comme complétée
    const { error: pendingUpdateError } = await admin
      .from('pending_requests')
      .update({
        status: 'completed',
        ticket_id: ticket.id,
        completed_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (pendingUpdateError) {
      console.error('Erreur update pending_request:', pendingUpdateError);
    }

    // Créer la transaction
    const { error: transactionError } = await admin
      .from('transactions')
      .insert({
        zone_id: zoneId,
        tarif_id: tarifId,
        ticket_id: ticket.id,
        pending_request_id: requestId,
        amount_fcfa: pendingRequest.amount_fcfa,
        buyer_phone: clientPhone,
        operator: pendingRequest.operator,
        validation_method: 'manual',
      });

    if (transactionError) {
      console.error('Erreur création transaction:', transactionError);
    }

    // Envoyer le SMS au client
    const zoneName = pendingRequest.zone?.name || 'WiFi Zone';
    const durationLabel = pendingRequest.tarif
      ? formatDuration(pendingRequest.tarif.duration_minutes)
      : 'N/A';

    // Envoyer SMS de manière non-bloquante
    sendWiFiCodeSMS(
      clientPhone,
      zoneName,
      ticket.username,
      ticket.password,
      durationLabel
    ).catch((err) => {
      console.error('[SMS] Erreur envoi code WiFi:', err);
    });

    return NextResponse.json({
      success: true,
      message: 'Ticket validé et envoyé au client',
      ticket: {
        username: ticket.username,
        password: ticket.password,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erreur manual-validate:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
