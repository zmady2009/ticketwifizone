import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { ticketUploadSchema } from '@/lib/schemas';

/**
 * POST /api/tickets - Upload bulk de tickets (CSV)
 *
 * Body:
 * {
 *   zoneId: string,
 *   tarifId: string,
 *   tickets: Array<{ username: string, password: string }>
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
    const validatedData = ticketUploadSchema.parse(body);

    // Vérifier que la zone appartient à l'utilisateur
    const { data: zone } = await supabase
      .from('zones')
      .select('owner_id')
      .eq('id', validatedData.zoneId)
      .single();

    if (!zone || zone.owner_id !== user.id) {
      return NextResponse.json({ error: 'Zone non trouvée' }, { status: 404 });
    }

    // Vérifier que le tarif appartient à la zone
    const { data: tarif } = await supabase
      .from('tarifs')
      .select('id')
      .eq('id', validatedData.tarifId)
      .eq('zone_id', validatedData.zoneId)
      .single();

    if (!tarif) {
      return NextResponse.json({ error: 'Tarif non trouvé pour cette zone' }, { status: 400 });
    }

    // Insérer les tickets en lot
    const ticketsToInsert = validatedData.tickets.map((ticket) => ({
      zone_id: validatedData.zoneId,
      tarif_id: validatedData.tarifId,
      username: ticket.username,
      password: ticket.password,
      status: 'available',
    }));

    const { data: insertedTickets, error: insertError } = await admin
      .from('tickets')
      .insert(ticketsToInsert)
      .select();

    if (insertError) {
      // Gérer les doublons (contrainte unique zone_id, username)
      if (insertError.message.includes('duplicate')) {
        // Réessayer en ignorant les doublons
        const { data: retries, error: retryError } = await admin.rpc('upsert_tickets', {
          p_tickets: ticketsToInsert,
        });

        if (retryError) {
          return NextResponse.json(
            {
              error: 'Erreur lors de l\'insertion',
              details: retryError.message,
            },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          imported: retries?.length || 0,
          total: ticketsToInsert.length,
          duplicates: ticketsToInsert.length - (retries?.length || 0),
        });
      }

      return NextResponse.json(
        { error: 'Erreur lors de l\'insertion', details: insertError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      imported: insertedTickets?.length || 0,
      total: ticketsToInsert.length,
      tickets: insertedTickets,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tickets - Lister les tickets d'une zone
 *
 * Query params:
 * - zoneId: string (requis)
 * - tarifId?: string (filtre par tarif)
 * - status?: 'available' | 'sold' | 'expired' (filtre par statut)
 * - limit?: number (défaut 50)
 * - offset?: number (pagination)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const zoneId = searchParams.get('zoneId');
    const tarifId = searchParams.get('tarifId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!zoneId) {
      return NextResponse.json({ error: 'zoneId requis' }, { status: 400 });
    }

    // Vérifier que la zone appartient à l'utilisateur
    const { data: zone } = await supabase
      .from('zones')
      .select('owner_id')
      .eq('id', zoneId)
      .single();

    if (!zone || zone.owner_id !== user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Construire la requête
    let query = supabase
      .from('tickets')
      .select('*')
      .eq('zone_id', zoneId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (tarifId) {
      query = query.eq('tarif_id', tarifId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: tickets, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Compter le total
    const { count } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('zone_id', zoneId)
      .eq(tarifId ? 'tarif_id' : '', tarifId || '')
      .eq(status ? 'status' : '', status || '');

    return NextResponse.json({
      tickets,
      count,
      limit,
      offset,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
