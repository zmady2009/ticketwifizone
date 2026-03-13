import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Receipt, Clock, TrendingUp, Calendar } from 'lucide-react';
import Link from 'next/link';
import { PendingRequestsList } from '@/components/dashboard/PendingRequestsList';

type Transaction = {
  id: string;
  zone_id: string;
  tarif_id: string;
  amount_fcfa: number;
  buyer_phone: string;
  operator: string;
  created_at: string;
};

type PendingRequest = {
  id: string;
  zone_id: string;
  tarif_id: string;
  client_phone: string;
  operator: string;
  amount_fcfa: number;
  status: string;
  expires_at: string;
  created_at: string;
};

type Tarif = {
  id: string;
  label: string;
};

type Zone = {
  id: string;
  name: string;
};

export default async function TransactionsPage() {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Récupérer toutes les transactions du user
  const { data: zones } = await supabase
    .from('zones')
    .select('id, name')
    .eq('owner_id', user.id);

  const zoneIds = zones?.map((z) => z.id) || [];

  // Récupérer les pending_requests en attente
  const { data: pendingRequests } = await supabase
    .from('pending_requests')
    .select(`
      *,
      zone:zones(id, name),
      tarif:tarifs(id, label, duration_minutes)
    `)
    .in('zone_id', zoneIds)
    .eq('status', 'waiting_payment')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .in('zone_id', zoneIds)
    .order('created_at', { ascending: false })
    .limit(50);

  // Récupérer les tarifs pour les labels
  const tarifIds = transactions?.map((t) => t.tarif_id).filter(Boolean) || [];
  let tarifs: Tarif[] | null = null;
  if (tarifIds.length > 0) {
    const { data: tarifsData } = await supabase
      .from('tarifs')
      .select('id, label')
      .in('id', tarifIds);
    tarifs = tarifsData;
  }

  function getTarifLabel(tarifId: string) {
    return tarifs?.find((t) => t.id === tarifId)?.label || 'Inconnu';
  }

  function getZoneName(zoneId: string) {
    return zones?.find((z) => z.id === zoneId)?.name || 'Inconnu';
  }

  // Calculer les stats
  const today = new Date().toISOString().split('T')[0];
  const todayTransactions = transactions?.filter(
    (t) => t.created_at.startsWith(today)
  );

  const todayRevenue = todayTransactions?.reduce((sum, t) => sum + t.amount_fcfa, 0) || 0;
  const totalRevenue = transactions?.reduce((sum, t) => sum + t.amount_fcfa, 0) || 0;

  // Stats par mois
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);
  const last30DaysTransactions = transactions?.filter(
    (t) => new Date(t.created_at) >= last30Days
  );

  // Grouper par date
  const byDate: Record<string, { count: number; revenue: number }> = {};
  for (const tx of transactions || []) {
    const date = tx.created_at.split('T')[0];
    if (!byDate[date]) {
      byDate[date] = { count: 0, revenue: 0 };
    }
    byDate[date].count++;
    byDate[date].revenue += tx.amount_fcfa;
  }

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au dashboard
        </Link>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
          Ventes
        </h1>
        <p className="text-gray-500 mt-1">
          Historique complet de vos ventes de tickets WiFi
        </p>
      </div>

      {/* Pending Requests Section */}
      <PendingRequestsList
        initialRequests={pendingRequests || []}
        zoneIds={zoneIds}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Aujourd'hui
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">{todayTransactions?.length || 0}</p>
            <p className="text-sm text-gray-500">ventes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              30 derniers jours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">
              {last30DaysTransactions?.length || 0}
            </p>
            <p className="text-sm text-gray-500">ventes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Total revenus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-brand-600">
              {totalRevenue.toLocaleString('fr-FR')} F
            </p>
            <p className="text-sm text-gray-500">cumulés</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Dernières transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions && transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Zone</th>
                    <th className="pb-3">Tarif</th>
                    <th className="pb-3">Client</th>
                    <th className="pb-3">Opérateur</th>
                    <th className="pb-3 text-right">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 text-sm">
                        {new Date(tx.created_at).toLocaleDateString('fr-FR')} à{' '}
                        {new Date(tx.created_at).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 text-sm">{getZoneName(tx.zone_id)}</td>
                      <td className="py-3 text-sm">{getTarifLabel(tx.tarif_id)}</td>
                      <td className="py-3 text-sm font-mono">{tx.buyer_phone}</td>
                      <td className="py-3 text-sm capitalize">{tx.operator}</td>
                      <td className="py-3 text-right font-bold text-brand-600">
                        {tx.amount_fcfa.toLocaleString('fr-FR')} F
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Receipt className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">Aucune vente pour le moment</p>
              <p className="text-sm text-gray-400">
                Configurez vos tarifs et commencez à vendre !
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
