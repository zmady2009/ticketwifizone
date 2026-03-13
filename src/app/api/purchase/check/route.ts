import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Schéma de validation pour la vérification de statut
 */
const checkStatusSchema = z.object({
  requestId: z.string().uuid('ID de demande invalide'),
});

/**
 * GET /api/purchase/check?requestId=xxx
 *
 * Vérifie le statut d'une demande d'achat.
 * Utilisé pour le polling depuis la page d'achat client.
 *
 * Retourne :
 * - Si "pending" → { status: "pending", remainingSeconds }
 * - Si "completed" → { status: "completed", ticket: { username, password, duration } }
 * - Si "expired" → { status: "expired" }
 * - Si "failed" → { status: "failed", reason }
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const requestId = searchParams.get('requestId');

    if (!requestId) {
      return NextResponse.json({ error: 'requestId requis' }, { status: 400 });
    }

    const validatedData = checkStatusSchema.parse({ requestId });

    const admin = createAdminClient();

    // Récupérer la pending_request avec les données associées
    const { data: pendingRequest, error: requestError } = await admin
      .from('pending_requests')
      .select(`
        id,
        status,
        client_phone,
        amount_fcfa,
        operator,
        created_at,
        expires_at,
        completed_at,
        ticket_id,
        tarif:tarifs(
          id,
          label,
          duration_minutes,
          data_limit_mb,
          price_fcfa
        ),
        zone:zones(
          id,
          name
        ),
        ticket:tickets(
          id,
          username,
          password
        )
      `)
      .eq('id', validatedData.requestId)
      .single();

    if (requestError || !pendingRequest) {
      return NextResponse.json({ error: 'Demande non trouvée' }, { status: 404 });
    }

    // Vérifier si la demande a expiré
    const now = new Date();
    const expiresAt = new Date(pendingRequest.expires_at);
    const isExpired = now > expiresAt;

    if (isExpired && pendingRequest.status === 'waiting_payment') {
      // Marquer comme expirée
      await admin
        .from('pending_requests')
        .update({ status: 'expired' })
        .eq('id', pendingRequest.id);

      return NextResponse.json({
        status: 'expired',
        message: 'Le délai de paiement est expiré',
      });
    }

    // Statut: waiting_payment (alias "pending" pour le client)
    if (pendingRequest.status === 'waiting_payment') {
      const timeRemaining = Math.max(0, expiresAt.getTime() - now.getTime());

      return NextResponse.json({
        status: 'pending',
        message: 'Paiement en cours de vérification...',
        remainingSeconds: Math.floor(timeRemaining / 1000),
      });
    }

    // Statut: completed - retourner le ticket
    if (pendingRequest.status === 'completed' && pendingRequest.ticket) {
      const ticketData = Array.isArray(pendingRequest.ticket)
        ? pendingRequest.ticket[0]
        : pendingRequest.ticket;

      const tarifData = Array.isArray(pendingRequest.tarif)
        ? pendingRequest.tarif[0]
        : pendingRequest.tarif;

      return NextResponse.json({
        status: 'completed',
        message: 'Paiement confirmé !',
        ticket: {
          username: ticketData.username,
          password: ticketData.password,
          duration: tarifData?.duration_minutes || 0,
        },
        tarif: tarifData,
        zone: pendingRequest.zone,
        completedAt: pendingRequest.completed_at,
      });
    }

    // Statut: manual_review
    if (pendingRequest.status === 'manual_review') {
      return NextResponse.json({
        status: 'pending',
        message: 'Votre paiement est en cours de vérification manuelle',
      });
    }

    // Statut: expired
    if (pendingRequest.status === 'expired') {
      return NextResponse.json({
        status: 'expired',
        message: 'Le délai de paiement est expiré',
      });
    }

    // Statut par défaut
    return NextResponse.json({
      status: 'pending',
      message: 'En cours de traitement',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erreur purchase/check:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
