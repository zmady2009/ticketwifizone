import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Download, FileText, Upload, CheckCircle2, Smartphone, Globe } from 'lucide-react';

interface PageProps {
  params: Promise<{
    zoneId: string;
  }>;
}

// Fonction pour générer le HTML du portail captif avec l'URL de la zone
function generateCaptivePortalHTML(zoneBuyUrl: string): string {
  const fs = require('fs');
  const path = require('path');
  const templatePath = path.join(process.cwd(), 'public', 'captive-portal', 'login.html');
  const template = fs.readFileSync(templatePath, 'utf-8');

  return template.replace(
    /var ZONE_BUY_URL = "[^"]*"/,
    `var ZONE_BUY_URL = "${zoneBuyUrl}"`
  );
}

export default async function CaptivePortalPage({ params }: PageProps) {
  const { zoneId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Récupérer la zone
  const { data: zone } = await supabase
    .from('zones')
    .select('*')
    .eq('id', zoneId)
    .eq('owner_id', user.id)
    .single();

  if (!zone) {
    notFound();
  }

  // URL de la page d'achat
  const buyPageUrl = `https://ticketswifizone.com/zone/${zoneId}/buy`;

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/dashboard/zones/${zoneId}`}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la zone
        </Link>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
          Portail Captif MikroTik
        </h1>
        <p className="text-gray-500 mt-1">
          Personnalisez et téléchargez le portail captif pour votre routeur
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Aperçu du portail
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
              <iframe
                src="/captive-portal/login.html"
                className="w-full h-[500px]"
                title="Aperçu du portail captif"
              />
            </div>
            <p className="text-sm text-gray-500 mt-3 text-center">
              Ceci est un aperçu. Le QR code réel pointera vers votre page d&apos;achat.
            </p>
          </CardContent>
        </Card>

        {/* Download & Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Télécharger & Installer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Download Section */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">1. Télécharger le fichier</h3>
              <p className="text-sm text-gray-600 mb-4">
                Téléchargez le fichier login.html personnalisé pour votre zone.
              </p>

              <form action={`/api/dashboard/zones/${zoneId}/captive-portal/download`} method="get">
                <Button type="submit" className="w-full" size="lg">
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger login.html
                </Button>
              </form>

              <div className="mt-4 p-3 rounded-xl bg-yellow-50 border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>Important :</strong> Avant de télécharger, l&apos;URL de votre zone (
                  <code className="text-xs bg-yellow-100 px-1 rounded">{zoneId.slice(0, 8)}...</code>)
                  sera automatiquement insérée dans le fichier.
                </p>
              </div>
            </div>

            {/* Installation Instructions */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">2. Installer sur MikroTik</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Ouvrir Winbox</h4>
                    <p className="text-sm text-gray-600">
                      Connectez-vous à votre routeur MikroTik avec Winbox.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Aller dans Files</h4>
                    <p className="text-sm text-gray-600">
                      Ouvrez le menu Files (left) → Nouveau dossier <code>hotspot</code> s&apos;il n&apos;existe pas.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Uploadez le fichier</h4>
                    <p className="text-sm text-gray-600">
                      Glissez le fichier <code className="bg-gray-100 px-1 rounded">login.html</code> dans le dossier hotspot.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-bold">
                    4
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Configurer le Walled Garden</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Ajoutez notre domaine au Walled Garden pour permettre l&apos;accès à la page d&apos;achat :
                    </p>
                    <div className="p-3 bg-gray-900 text-gray-100 rounded-lg text-sm font-mono">
                      <div className="text-green-400">IP → Hotspot → Walled Garden</div>
                      <div className="mt-2">New → Dst. Host =</div>
                      <div className="ml-4 text-blue-300">*ticketswifizone.com*</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-sm font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-medium text-green-900">C'est prêt !</h4>
                    <p className="text-sm text-gray-600">
                      Les clients verront votre page personnalisée quand ils se connecteront au WiFi.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
              <div className="flex items-start gap-2">
                <Globe className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">À propos du portail captif</h4>
                  <p className="text-sm text-blue-800">
                    Ce portail permet aux clients d&apos;acheter un ticket directement depuis leur téléphone,
                    sans avoir besoin de la connexion Internet. Le paiement se fait via USSD (hors ligne).
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
