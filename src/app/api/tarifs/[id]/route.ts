import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { createTarifSchema } from '@/lib/schemas';

/**
 * GET /api/tarifs/[id] - Récupérer un tarif
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
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const { data: tarif } = await supabase
      .from('tarifs')
      .select('*')
      .eq('id', id)
      .single();

    if (!tarif) {
      return NextResponse.json({ error: 'Tarif non trouvé' }, { status: 404 });
    }

    // Vérifier que la zone appartient à l'utilisateur
    const { data: zone } = await supabase
      .from('zones')
      .select('owner_id')
      .eq('id', tarif.zone_id)
      .single();

    if (!zone || zone.owner_id !== user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    return NextResponse.json({ tarif });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/tarifs/[id] - Mettre a jour un tarif
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
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const { data: existingTarif } = await supabase
      .from('tarifs')
      .select('*, zones!inner(owner_id)')
      .eq('id', id)
      .single();

    if (!existingTarif) {
      return NextResponse.json({ error: 'Tarif non trouve' }, { status: 404 });
    }

    if (existingTarif.zones.owner_id !== user.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
    }

    const body = await request.json();

    const validatedData = createTarifSchema.partial().parse(body);

    const { data: tarif, error: updateError } = await supabase
      .from('tarifs')
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

    return NextResponse.json({ tarif });
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
 * DELETE /api/tarifs/[id] - Supprimer un tarif
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
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const { data: existingTarif } = await supabase
      .from('tarifs')
      .select('*, zones!inner(owner_id)')
      .eq('id', id)
      .single();

    if (!existingTarif) {
      return NextResponse.json({ error: 'Tarif non trouve' }, { status: 404 });
    }

    if (existingTarif.zones.owner_id !== user.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
    }

    const { error: deleteError } = await admin
      .from('tarifs')
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

/**
 * PATCH /api/tarifs/[id]/toggle - Activer/Desactiver un tarif
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
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'is_active doit etre un booleen' },
        { status: 400 }
      );
    }

    const { data: existingTarif } = await supabase
      .from('tarifs')
      .select('*, zones!inner(owner_id)')
      .eq('id', id)
      .single();

    if (!existingTarif) {
      return NextResponse.json({ error: 'Tarif non trouve' }, { status: 404 });
    }

    if (existingTarif.zones.owner_id !== user.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
    }

    const { data: tarif, error: updateError } = await supabase
      .from('tarifs')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ tarif });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
