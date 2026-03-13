import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wifi, TrendingUp, Ticket, AlertCircle, Calendar, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

function maskPhone(phone: string): string {
  if (!phone || phone.length < 8) return phone;
  return `${phone.slice(0, 2)} XX XX ${phone.slice(-2)}`;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: zones } = await supabase
    .from('zones')
    .select('*')
    .eq('owner_id', user.id)
    .eq('is_active', true);

  const zoneIds = zones?.map((z) => z.id) || [];

  const today = new Date().toISOString().split('T')[0];
  const { data: todayTransactions } = await admin
    .from('transactions')
    .select('*, zones!inner(name)')
    .gte('created_at', today)
    .in('zone_id', zoneIds);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const { data: monthTransactions } = await admin
    .from('transactions')
    .select('amount_fcfa')
    .gte('created_at', monthStart.toISOString())
    .in('zone_id', zoneIds);

  const last7Days: Array<{ date: string; sales: number; revenue: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayStart = new Date(d);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(d);
    dayEnd.setHours(23, 59, 59, 999);

    const { data: dayTransactions } = await admin
      .from('transactions')
      .select('amount_fcfa')
      .gte('created_at', dayStart.toISOString())
      .lte('created_at', dayEnd.toISOString())
      .in('zone_id', zoneIds);

    last7Days.push({
      date: dateStr,
      sales: dayTransactions?.length || 0,
      revenue: dayTransactions?.reduce((sum, t) => sum + t.amount_fcfa, 0) || 0,
    });
  }

  const maxSales = Math.max(...last7Days.map((d) => d.sales), 1);

  const { data: allTarifs } = await admin
    .from('tarifs')
    .select('id, label, zones!inner(id, name)')
    .in('zone_id', zoneIds);

  const { data: ticketsByTarif } = await admin
    .from('tickets')
    .select('tarif_id, status')
    .in('zone_id', zoneIds);

  const availableTickets = ticketsByTarif?.filter((t) => t.status === 'available').length || 0;

  const lowStockAlerts: Array<{ tarif: string; zone: string; count: number }> = [];
  if (allTarifs && ticketsByTarif) {
    for (const tarif of allTarifs) {
      const available = ticketsByTarif.filter(
        (t) => t.tarif_id === tarif.id && t.status === 'available'
      ).length;
      if (available < 10) {
        lowStockAlerts.push({
          tarif: tarif.label,
          zone: (tarif as any).zones?.name || 'Non definie',
          count: available,
        });
      }
    }
  }

  const { data: paymentMethods } = await supabase
    .from('zone_payment_methods')
    .select('zone_id')
    .in('zone_id', zoneIds)
    .eq('is_active', true);

  const zonesWithPayment = new Set(paymentMethods?.map((pm) => pm.zone_id) || []);
  const zonesWithoutPayment = zones?.filter((z) => !zonesWithPayment.has(z.id)) || [];

  const todaySales = todayTransactions?.length || 0;
  const todayRevenue = todayTransactions?.reduce((sum, t) => sum + t.amount_fcfa, 0) || 0;
  const monthRevenue = monthTransactions?.reduce((sum, t) => sum + t.amount_fcfa, 0) || 0;

  const formatDay = (dateStr: string) => {
    const d = new Date(dateStr);
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return days[d.getDay()];
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
          Bienvenue{profile?.business_name ? `, ${profile.business_name}` : ''} 👋
        </h1>
        <p className="text-gray-500 mt-1">Voici un apercu de vos activites</p>
      </div>

      {(lowStockAlerts.length > 0 || zonesWithoutPayment.length > 0) && (
        <Card className="mb-6 border-2 border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="w-5 h-5" />
              Attention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lowStockAlerts.map((alert, i) => (
              <p key={i} className="text-sm text-yellow-800">
                ⚠️ Il reste <strong>{alert.count}</strong> tickets pour <strong>{alert.tarif}</strong> sur{' '}
                {alert.zone}.{' '}
                <Link href="/dashboard/zones" className="underline font-medium">
                  Uploadez-en !
                </Link>
              </p>
            ))}
            {zonesWithoutPayment.map((zone) => (
              <p key={zone.id} className="text-sm text-yellow-800">
                ⚠️ Aucun operateur configure sur <strong>{zone.name}</strong>.{' '}
                <Link href={`/dashboard/zones/${zone.id}/payments`} className="underline font-medium">
                  Configurer
                </Link>
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      {lowStockAlerts.length === 0 && zonesWithoutPayment.length === 0 && zones && zones.length > 0 && (
        <Card className="mb-6 border-2 border-green-200 bg-green-50">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-800">Tout est operationnel ✨</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-2">
              <TrendingUp className="w-3 h-3" />
              Aujourd'hui
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-gray-900">{todaySales}</p>
            <p className="text-xs text-gray-500 mt-1">
              {todayRevenue.toLocaleString('fr-FR')} F
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-2">
              <Calendar className="w-3 h-3" />
              Ce mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-gray-900">
              {monthRevenue.toLocaleString('fr-FR')} F
            </p>
            <p className="text-xs text-gray-500 mt-1">Revenus</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-2">
              <Ticket className="w-3 h-3" />
              Tickets dispo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-gray-900">{availableTickets}</p>
            <p className="text-xs text-gray-500 mt-1">Prets a vendre</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-2">
              <Wifi className="w-3 h-3" />
              Zones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-gray-900">{zones?.length || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Actives</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-2">
              <TrendingUp className="w-3 h-3" />
              Commission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-green-600">0%</p>
            <p className="text-xs text-gray-500 mt-1">Zero commission ✨</p>
          </CardContent>
        </Card>
      </div>

      {zones && zones.length > 0 ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Ventes des 7 derniers jours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-2 h-40">
                {last7Days.map((day, i) => {
                  const heightPercent = (day.sales / maxSales) * 100;
                  const isToday = i === last7Days.length - 1;
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full relative h-28">
                        <div
                          className={cn(
                            'absolute bottom-0 w-full rounded-t-lg transition-all duration-300',
                            isToday ? 'bg-brand-600' : 'bg-brand-200'
                          )}
                          style={{ height: `${Math.max(heightPercent, 4)}%` }}
                        />
                        {day.sales > 0 && (
                          <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium text-gray-700">
                            {day.sales}
                          </span>
                        )}
                      </div>
                      <span className={cn('text-xs font-medium', isToday ? 'text-brand-700' : 'text-gray-500')}>
                        {formatDay(day.date)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Dernieres ventes</CardTitle>
                <Link href="/dashboard/transactions" className="text-xs text-brand-600 hover:text-brand-700">
                  Voir tout
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {todayTransactions && todayTransactions.length > 0 ? (
                <div className="space-y-3">
                  {todayTransactions.slice(0, 5).map((tx: any) => (
                    <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 text-sm truncate">{maskPhone(tx.buyer_phone)}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {(tx.zones as any)?.name || 'Zone inconnue'}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="font-bold text-brand-600 text-sm">
                          {tx.amount_fcfa.toLocaleString('fr-FR')} F
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(tx.created_at).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4 text-sm">Aucune vente aujourd'hui</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Mes zones WiFi</CardTitle>
              <Link href="/dashboard/zones/new" className="text-sm text-brand-600 hover:text-brand-700">
                + Ajouter
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {zones.map((zone) => (
                <Link
                  key={zone.id}
                  href={`/dashboard/zones/${zone.id}`}
                  className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-brand-300 hover:bg-brand-50/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center text-brand-700 flex-shrink-0">
                    <Wifi className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">{zone.name}</p>
                    <p className="text-sm text-gray-500 truncate">{zone.city}</p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
        </>
      ) : (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Wifi className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Commencez par creer votre premiere zone WiFi
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Une zone represente un point d'acces WiFi (ex: votre kiosque, cybercafe, etc.)
            </p>
            <Link
              href="/dashboard/zones/new"
              className={cn(
                'inline-flex items-center justify-center rounded-xl font-medium transition-colors',
                'bg-brand-600 text-white hover:bg-brand-700',
                'h-11 px-6 text-base',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2'
              )}
            >
              Creer ma premiere zone
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
