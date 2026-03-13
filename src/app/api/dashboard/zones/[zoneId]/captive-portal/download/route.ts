import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

/**
 * GET /api/dashboard/zones/[zoneId]/captive-portal/download
 * Telecharge le fichier login.html personnalisé avec l'URL de la zone
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ zoneId: string }> }
) {
  try {
    const { zoneId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const { data: zone } = await supabase
      .from('zones')
      .select('name')
      .eq('id', zoneId)
      .eq('owner_id', user.id)
      .single();

    if (!zone) {
      return NextResponse.json({ error: 'Zone non trouvee' }, { status: 404 });
    }

    const templatePath = join(process.cwd(), 'public', 'captive-portal', 'login.html');
    const template = await readFile(templatePath, 'utf-8');

    const buyPageUrl = `https://ticketswifizone.com/zone/${zoneId}/buy`;

    // Remplacer l'URL de la zone dans le template
    const customizedHTML = template.replace(
      /var ZONE_BUY_URL = "[^"]*"/,
      `var ZONE_BUY_URL = "${buyPageUrl}"`
    );

    const filename = `login-${zone.name.toLowerCase().replace(/\s+/g, '-')}.html`;

    return new NextResponse(customizedHTML, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
