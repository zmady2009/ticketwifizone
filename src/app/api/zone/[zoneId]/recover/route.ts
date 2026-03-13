import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schéma de validation
const recoverSchema = z.object({
  phone: z.string().regex(/^\d{8}$/, 'Numéro à 8 chiffres requis'),
});

/**
 * POST /api/zone/[zoneId]/recover - Retrouver un ticket par numéro de téléphone
 *
 * Cette API est publique (pas d'authentification requise).
 * Elle permet aux clients de retrouver leur dernier ticket acheté.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ zoneId: string }> }
) {
  try {
    const { zoneId } = await params;
    const admin = createAdminClient();

    const body = await request.json();
    const validatedData = recoverSchema.parse(body);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const { data: ticket } = await admin
      .from('tickets')
      .select('username, password, sold_at')
      .eq('zone_id', zoneId)
      .eq('buyer_phone', validatedData.phone)
      .eq('status', 'sold')
      .gte('sold_at', thirtyDaysAgo.toISOString())
      .order('sold_at', { ascending: false })
      .limit(1)
      .single();

    if (!ticket) {
      return NextResponse.json(
        { message: 'Aucun ticket trouve pour ce numero' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ticket });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { message: 'Numero de telephone invalide' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
