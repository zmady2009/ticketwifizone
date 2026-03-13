import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createAdminClient()

  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Token manquant' },
        { status: 400 }
      )
    }

    // Vérifier que le token existe et est actif
    const { data: webhookToken, error } = await supabase
      .from('sms_webhook_tokens')
      .select('id, owner_id, last_used_at')
      .eq('token', token)
      .eq('is_active', true)
      .single()

    if (error || !webhookToken) {
      return NextResponse.json(
        { error: 'Token invalide ou inactif' },
        { status: 401 }
      )
    }

    // Mettre à jour last_used_at
    await supabase
      .from('sms_webhook_tokens')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', webhookToken.id)

    // Récupérer les infos du propriétaire
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, business_name')
      .eq('id', webhookToken.owner_id)
      .single()

    // Récupérer les zones du propriétaire
    const { data: zones } = await supabase
      .from('zones')
      .select('id, name, is_active')
      .eq('owner_id', webhookToken.owner_id)

    return NextResponse.json({
      success: true,
      message: 'Connexion réussie !',
      profile: {
        email: profile?.email,
        businessName: profile?.business_name,
      },
      zones: zones || [],
      lastUsed: webhookToken.last_used_at,
    })
  } catch (error) {
    console.error('Erreur test webhook:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
