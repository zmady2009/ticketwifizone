import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { createZoneSchema } from '@/lib/schemas';

/**
 * GET /api/zones/[id] - Recuperer une zone specifique
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const { data: zone, error } = await supabase
      .from('zones')
      .select('*')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single();

    if (error || !zone) {
      return NextResponse.json({ error: 'Zone non trouvee' }, { status: 404 });
    }

    const { data: tarifs } = await supabase
      .from('tarifs')
      .select('*')
      .eq('zone_id', id)
      .eq('is_active', true)
      .order('sort_order');

    const { data: paymentMethods } = await supabase
      .from('zone_payment_methods')
      .select('*')
      .eq('zone_id', id)
      .eq('is_active', true);

    const admin = createAdminClient();
    const { data: ticketCounts } = await admin.rpc('get_ticket_counts', {
      p_zone_id: id,
    });

    const today = new Date().toISOString().split('T')[0];
    const { data: todayTransactions } = await admin
      .from('transactions')
      .select('*')
      .eq('zone_id', id)
      .gte('created_at', today);

    const todaySales = todayTransactions?.length || 0;
    const todayRevenue = todayTransactions?.reduce((sum: number, t: any) => sum + t.amount_fcfa, 0) || 0;

    return NextResponse.json({
      zone: {
        ...zone,
        tarifs: tarifs || [],
        paymentMethods: paymentMethods || [],
        ticketCounts: ticketCounts || [],
        stats: {
          todaySales,
          todayRevenue,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/zones/[id] - Mettre a jour une zone
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const { data: existingZone, error: checkError } = await supabase
      .from('zones')
      .select('*')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single();

    if (checkError || !existingZone) {
      return NextResponse.json({ error: 'Zone non trouvee' }, { status: 404 });
    }

    const body = await request.json();

    const validatedData = createZoneSchema.partial().parse(body);

    const { data: zone, error: updateError } = await supabase
      .from('zones')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ zone });
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
 * PATCH /api/zones/[id] - Activer/Desactiver une zone
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const { data: existingZone, error: checkError } = await supabase
      .from('zones')
      .select('*')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single();

    if (checkError || !existingZone) {
      return NextResponse.json({ error: 'Zone non trouvee' }, { status: 404 });
    }

    const body = await request.json();
    const { is_active } = body;

    if (typeof is_active !== 'boolean') {
      return NextResponse.json(
        { error: 'is_active doit etre un booleen' },
        { status: 400 }
      );
    }

    const { data: zone, error: updateError } = await supabase
      .from('zones')
      .update({
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ zone });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/zones/[id] - Supprimer une zone
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const admin = createAdminClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const { data: existingZone, error: checkError } = await supabase
      .from('zones')
      .select('*')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single();

    if (checkError || !existingZone) {
      return NextResponse.json({ error: 'Zone non trouvee' }, { status: 404 });
    }

    const { error: deleteError } = await admin
      .from('zones')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
