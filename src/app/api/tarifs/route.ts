import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { createTarifSchema } from '@/lib/schemas';

/**
 * POST /api/tarifs - Créer un nouveau tarif
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();

    // Validation avec Zod
    const validatedData = createTarifSchema.parse(body);

    // Vérifier que la zone appartient à l'utilisateur
    const { data: zone } = await supabase
      .from('zones')
      .select('owner_id')
      .eq('id', validatedData.zoneId)
      .single();

    if (!zone || zone.owner_id !== user.id) {
      return NextResponse.json({ error: 'Zone non trouvée' }, { status: 404 });
    }

    // Créer le tarif
    const { data: tarif, error } = await supabase
      .from('tarifs')
      .insert({
        zone_id: validatedData.zoneId,
        label: validatedData.label,
        duration_minutes: validatedData.durationMinutes,
        data_limit_mb: validatedData.dataLimitMb,
        price_fcfa: validatedData.priceFcfa,
        sort_order: validatedData.sortOrder ?? 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ tarif }, { status: 201 });
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
