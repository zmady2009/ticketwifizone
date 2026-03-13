import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { createZoneSchema } from '@/lib/schemas';

/**
 * GET /api/zones - Liste des zones de l'utilisateur authentifié
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Récupérer les zones avec les stats de tickets
    const { data: zones, error } = await supabase
      .from('zones')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Récupérer les compteurs de tickets pour chaque zone
    const admin = createAdminClient();
    const zonesWithStats = await Promise.all(
      (zones || []).map(async (zone) => {
        const { data: ticketCounts } = await admin.rpc('get_ticket_counts', {
          p_zone_id: zone.id,
        });

        // Calculer le total des tickets disponibles
        const totalAvailable = ticketCounts?.reduce((sum: number, tc: any) => {
          return sum + (tc.available_count || 0);
        }, 0) || 0;

        // Récupérer les transactions du jour
        const today = new Date().toISOString().split('T')[0];
        const { data: todayTransactions } = await admin
          .from('transactions')
          .select('*')
          .eq('zone_id', zone.id)
          .gte('created_at', today);

        const todaySales = todayTransactions?.length || 0;

        return {
          ...zone,
          stats: {
            totalAvailable,
            todaySales,
          },
        };
      })
    );

    return NextResponse.json({ zones: zonesWithStats });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/zones - Créer une nouvelle zone
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();

    // Validation avec Zod
    const validatedData = createZoneSchema.parse(body);

    // Créer la zone
    const { data: zone, error } = await supabase
      .from('zones')
      .insert({
        owner_id: user.id,
        name: validatedData.name,
        address: validatedData.address || null,
        city: validatedData.city,
        latitude: validatedData.latitude || null,
        longitude: validatedData.longitude || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ zone }, { status: 201 });
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
