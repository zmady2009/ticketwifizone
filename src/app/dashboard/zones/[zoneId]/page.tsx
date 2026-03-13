import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CopyButton } from '@/components/dashboard/CopyButton';
import { BuyPagePreview } from '@/components/dashboard/BuyPagePreview';
import { PrintButton } from '@/components/dashboard/PrintButton';
import {
  ArrowLeft,
  Wifi,
  MapPin,
  QrCode,
  Settings,
  Ticket,
  CreditCard,
  ExternalLink,
  Download,
  Printer,
  Share2,
  CheckCircle2,
  Smartphone,
  Info,
} from 'lucide-react';
import { generateQRCodeDataURL } from '@/lib/qr';
import { formatCFA, formatDuration } from '@/lib/utils';

export default async function ZoneDetailPage({
  params,
}: {
  params: Promise<{ zoneId: string }>;
}) {
  const { zoneId } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();

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

  // Récupérer les tarifs
  const { data: tarifs } = await supabase
    .from('tarifs')
    .select('*')
    .eq('zone_id', zoneId)
    .eq('is_active', true)
    .order('sort_order');

  // Récupérer les tickets disponibles par tarif
  const { data: ticketCounts } = await admin.rpc('get_ticket_counts', {
    p_zone_id: zoneId,
  });

  // Récupérer les méthodes de paiement
  const { data: paymentMethods } = await supabase
    .from('zone_payment_methods')
    .select('*')
    .eq('zone_id', zoneId)
    .eq('is_active', true);

  // Générer le QR code
  const qrCodeDataUrl = await generateQRCodeDataURL(zoneId, { width: 300 });
  const buyPageUrl = `https://ticketswifizone.com/zone/${zoneId}/buy`;

  // Stats jour
  const today = new Date().toISOString().split('T')[0];
  const { data: todayTransactions } = await admin
    .from('transactions')
    .select('*')
    .eq('zone_id', zoneId)
    .gte('created_at', today);

  const todaySales = todayTransactions?.length || 0;
  const todayRevenue = todayTransactions?.reduce((sum, t) => sum + t.amount_fcfa, 0) || 0;

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/zones"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux zones
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center text-brand-700">
                <Wifi className="w-5 h-5" />
              </div>
              {zone.name}
            </h1>
            {zone.address && (
              <div className="flex items-center gap-1 text-gray-500 mt-2">
                <MapPin className="w-4 h-4" />
                {zone.address}, {zone.city}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/zones/${zoneId}/payments`}>
                <CreditCard className="w-4 h-4 mr-2" />
                Paiement
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/zones/${zoneId}/tarifs`}>
                <Ticket className="w-4 h-4 mr-2" />
                Tarifs
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/zones/${zoneId}/tickets`}>
                <QrCode className="w-4 h-4 mr-2" />
                Tickets
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche : Stats + Tarifs + Méthodes de paiement */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats du jour */}
          <Card>
            <CardHeader>
              <CardTitle>Aujourd'hui</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-xl bg-gray-50">
                  <p className="text-2xl font-bold text-gray-900">{todaySales}</p>
                  <p className="text-sm text-gray-500">Ventes</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-brand-50">
                  <p className="text-2xl font-bold text-brand-700">
                    {todayRevenue.toLocaleString('fr-FR')}
                  </p>
                  <p className="text-sm text-gray-500">FCFA</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-green-50">
                  <p className="text-2xl font-bold text-green-700">0%</p>
                  <p className="text-sm text-gray-500">Commission</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section QR Code Proéminente */}
          <Card className="border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-brand-600" />
                  <CardTitle className="text-brand-900">QR Code d'accès WiFi</CardTitle>
                </div>
                <span className="px-2 py-1 bg-brand-100 text-brand-700 text-xs font-medium rounded-full">
                  Pour vos clients
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6 items-center">
                {/* QR Code Large */}
                <div className="flex-shrink-0">
                  <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-brand-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrCodeDataUrl}
                      alt="QR Code d'accès WiFi"
                      className="w-56 h-56"
                    />
                  </div>
                </div>

                {/* Actions et infos */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Vos clients scannent ce QR code pour acheter un ticket
                    </h4>
                    <p className="text-sm text-gray-600">
                      Une fois scanné, ils arrivent sur une page simplifiée pour choisir leur tarif
                      et payer via Mobile Money (Orange, Moov, Telecel, Wave).
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button className="flex-1 min-w-[140px]" asChild>
                      <a
                        href={qrCodeDataUrl}
                        download={`ticketwifi-${zone.name.toLowerCase().replace(/\s+/g, '-')}-qr.png`}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Télécharger PNG
                      </a>
                    </Button>
                    <PrintButton className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors" />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      value={buyPageUrl}
                      readOnly
                      className="flex-1 min-w-[200px] px-3 py-2 text-sm rounded-xl border-2 border-gray-300 bg-gray-50"
                    />
                    <CopyButton text={buyPageUrl} />
                  </div>

                  <Button variant="outline" className="w-full" asChild>
                    <a href={`/zone/${zoneId}/buy`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Voir la page d'achat (aperçu)
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section Comment installer */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                <CardTitle>Comment installer votre QR Code</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Étape 1 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Téléchargez le QR Code</h4>
                    <p className="text-sm text-gray-600">
                      Cliquez sur le bouton "Télécharger PNG" ci-dessus pour obtenir l'image du QR code
                      en haute qualité.
                    </p>
                  </div>
                </div>

                {/* Étape 2 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Imprimez-le en grand format</h4>
                    <p className="text-sm text-gray-600">
                      Imprimez le QR code sur une affiche A4 ou A5. Assurez-vous que le QR code reste
                      clair et lisible.
                    </p>
                  </div>
                </div>

                {/* Étape 3 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Placez-le dans votre WiFi Zone</h4>
                    <p className="text-sm text-gray-600">
                      Affichez l'affiche à un endroit visible : entrée, comptoir, mur principal. Vos
                      clients pourront scanner et acheter leur ticket 24h/24.
                    </p>
                  </div>
                </div>

                {/* Texte suggéré pour l'affiche */}
                <div className="mt-6 p-4 rounded-xl bg-gray-50 border-2 border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Share2 className="w-4 h-4 text-gray-600" />
                    <h5 className="font-medium text-gray-900">Texte suggéré pour votre affiche</h5>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-gray-200">
                    <p className="text-center font-semibold text-gray-900 mb-2">
                      📶 Scannez ici pour acheter votre ticket WiFi
                    </p>
                    <p className="text-center text-sm text-gray-600 mb-3">
                      Paiement Mobile Money instantané
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 text-xs">
                      <span className="px-2 py-1 rounded-full bg-[#FF6600]/10 text-[#FF6600] font-medium">
                        Orange Money
                      </span>
                      <span className="px-2 py-1 rounded-full bg-[#0066CC]/10 text-[#0066CC] font-medium">
                        Moov Money
                      </span>
                      <span className="px-2 py-1 rounded-full bg-[#00AAFF]/10 text-[#00AAFF] font-medium">
                        Telecel Money
                      </span>
                      <span className="px-2 py-1 rounded-full bg-[#1DC3C3]/10 text-[#1DC3C3] font-medium">
                        Wave
                      </span>
                    </div>
                  </div>
                </div>

                {/* Checklist de bon déploiement */}
                <div className="mt-4 p-4 rounded-xl bg-green-50 border-2 border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <h5 className="font-medium text-green-900">Checklist avant de publier</h5>
                  </div>
                  <ul className="space-y-2 text-sm text-green-800">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>Vous avez configuré au moins un opérateur de paiement</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>Vous avez créé des tarifs et uploadé des tickets</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>Vous avez testé la page d'achat en scannant le QR code</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tarifs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tarifs disponibles</CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/zones/${zoneId}/tarifs`}>Gérer</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {tarifs && tarifs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {tarifs.map((tarif) => {
                    const count = ticketCounts?.find((tc: any) => tc.tarif_id === tarif.id);
                    const available = count?.available_count || 0;

                    return (
                      <div
                        key={tarif.id}
                        className={`p-4 rounded-xl border-2 ${
                          available === 0
                            ? 'border-red-200 bg-red-50'
                            : available < 10
                            ? 'border-yellow-200 bg-yellow-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-gray-900">{tarif.label}</span>
                          <span className="text-lg font-bold text-brand-600">
                            {formatCFA(tarif.price_fcfa)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDuration(tarif.duration_minutes)} · {available} tickets dispo
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">Aucun tarif configuré</p>
                  <Button asChild>
                    <Link href={`/dashboard/zones/${zoneId}/tarifs`}>
                      Créer un tarif
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Méthodes de paiement */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Moyens de paiement</CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/zones/${zoneId}/payments`}>Configurer</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {paymentMethods && paymentMethods.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {paymentMethods.map((pm) => (
                    <span
                      key={pm.id}
                      className="px-3 py-2 rounded-xl bg-gray-100 text-gray-700 font-medium"
                    >
                      {pm.operator === 'orange' && '🟠 Orange Money'}
                      {pm.operator === 'moov' && '🔵 Moov Money'}
                      {pm.operator === 'telecel' && '🟢 Telecel Money'}
                      {pm.operator === 'wave' && '🌊 Wave'}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Aucun moyen de paiement configuré
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Colonne droite : Preview + Actions rapides */}
        <div className="space-y-6">
          {/* Preview de la page d'achat */}
          <Card className="border-2 border-purple-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-purple-600" />
                <CardTitle>Aperçu page client</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <BuyPagePreview
                zoneId={zoneId}
                zoneName={zone.name}
                initialTarifs={tarifs || []}
                initialPaymentMethods={paymentMethods || []}
              />
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/dashboard/zones/${zoneId}/tickets`}>
                  <QrCode className="w-4 h-4 mr-2" />
                  Uploader des tickets
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/dashboard/zones/${zoneId}/tarifs`}>
                  <Ticket className="w-4 h-4 mr-2" />
                  Modifier les tarifs
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/dashboard/zones/${zoneId}/payments`}>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Configurer les paiements
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
