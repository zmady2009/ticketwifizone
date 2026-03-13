import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/zones/[id]/payment-methods - Lister les methodes de paiement d'une zone
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

    const { data: zone } = await supabase
      .from('zones')
      .select('owner_id')
      .eq('id', id)
      .single();

    if (!zone || zone.owner_id !== user.id) {
      return NextResponse.json({ error: 'Zone non trouvee' }, { status: 404 });
    }

    const { data: paymentMethods } = await supabase
      .from('zone_payment_methods')
      .select('*')
      .eq('zone_id', id)
      .order('operator');

    return NextResponse.json({ paymentMethods });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/zones/[id]/payment-methods - Mettre a jour les methodes de paiement d'une zone
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

    const { data: zone } = await supabase
      .from('zones')
      .select('owner_id')
      .eq('id', id)
      .single();

    if (!zone || zone.owner_id !== user.id) {
      return NextResponse.json({ error: 'Zone non trouvee' }, { status: 404 });
    }

    const body = await request.json();
    const { operator, phoneNumber, isActive } = body;

    if (!operator || !['orange', 'moov', 'telecel', 'wave'].includes(operator)) {
      return NextResponse.json({ error: 'Operateur invalide' }, { status: 400 });
    }

    if (isActive && phoneNumber) {
      const cleanPhone = phoneNumber.replace(/\s/g, '');
      if (!/^\d{8}$/.test(cleanPhone)) {
        return NextResponse.json(
          { error: 'Numero invalide (8 chiffres requis)' },
          { status: 400 }
        );
      }
    }

    const ussdFormats: Record<string, string> = {
      orange: '*144*2*1*{phone}*{amount}#',
      moov: '*155*1*1*{phone}*{amount}#',
      telecel: '*100*1*1*{phone}*{amount}#',
      wave: '',
    };

    const { data: existingMethod } = await supabase
      .from('zone_payment_methods')
      .select('*')
      .eq('zone_id', id)
      .eq('operator', operator)
      .single();

    if (existingMethod) {
      const updateData: Record<string, unknown> = {
        ussd_format: ussdFormats[operator] || '',
      };

      if (isActive !== undefined) {
        updateData.is_active = isActive;
      }

      if (phoneNumber) {
        updateData.phone_number = phoneNumber.replace(/\s/g, '');
      }

      if (isActive === false || (isActive === undefined && !phoneNumber)) {
        updateData.is_active = false;
      } else if (isActive === true || phoneNumber) {
        updateData.is_active = true;
      }

      const { data: updatedMethod, error } = await supabase
        .from('zone_payment_methods')
        .update(updateData)
        .eq('id', existingMethod.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ paymentMethod: updatedMethod });
    } else {
      if (!phoneNumber) {
        return NextResponse.json(
          { error: 'Numero de telephone requis pour l\'activation' },
          { status: 400 }
        );
      }

      const { data: newMethod, error } = await supabase
        .from('zone_payment_methods')
        .insert({
          zone_id: id,
          operator,
          phone_number: phoneNumber.replace(/\s/g, ''),
          ussd_format: ussdFormats[operator] || '',
          is_active: isActive !== undefined ? isActive : true,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ paymentMethod: newMethod });
    }
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
