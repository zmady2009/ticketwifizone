import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Wifi, MapPin, Eye, Edit, Trash2, Ticket } from 'lucide-react';
import Link from 'next/link';
import { formatCFA } from '@/lib/utils';

export default async function ZonesPage() {
  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // La redirection sera gérée par le layout, mais on retourne un composant vide
    return null;
  }

  const { data: zones } = await supabase
    .from('zones')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  // Récupérer les stats pour chaque zone
  const zonesWithStats = await Promise.all(
    (zones || []).map(async (zone) => {
      // Tickets disponibles par tarif
      const { data: ticketCounts } = await admin.rpc('get_ticket_counts', {
        p_zone_id: zone.id,
      });

      const totalAvailable = ticketCounts?.reduce((sum: number, tc: any) => {
        return sum + (tc.available_count || 0);
      }, 0) || 0;

      const totalSold = ticketCounts?.reduce((sum: number, tc: any) => {
        return sum + (tc.sold_count || 0);
      }, 0) || 0;

      // Ventes du jour
      const today = new Date().toISOString().split('T')[0];
      const { data: todayTransactions } = await admin
        .from('transactions')
        .select('*')
        .eq('zone_id', zone.id)
        .gte('created_at', today);

      const todaySales = todayTransactions?.length || 0;
      const todayRevenue = todayTransactions?.reduce((sum: number, t: any) => sum + t.amount_fcfa, 0) || 0;

      return {
        ...zone,
        stats: {
          totalAvailable,
          totalSold,
          todaySales,
          todayRevenue,
        },
      };
    })
  );

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Mes zones WiFi
          </h1>
          <p className="text-gray-500 mt-1">
            Gérez vos points d&apos;accès WiFi
          </p>
        </div>
        <Button asChild className="gap-2 whitespace-nowrap">
          <Link href="/dashboard/zones/new">
            <Plus className="w-4 h-4" />
            Nouvelle zone
          </Link>
        </Button>
      </div>

      {/* Zones grid */}
      {zonesWithStats.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {zonesWithStats.map((zone) => {
            const stockStatus = zone.stats.totalAvailable === 0
              ? 'empty'
              : zone.stats.totalAvailable < 10
              ? 'low'
              : 'ok';

            return (
              <Card
                key={zone.id}
                className={`hover:shadow-lg transition-all ${
                  !zone.is_active ? 'opacity-60' : ''
                }`}
              >
                <CardContent className="p-6">
                  {/* Header card */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center text-brand-700">
                      <Wifi className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          zone.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {zone.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Nom et adresse */}
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {zone.name}
                  </h3>

                  {zone.address && (
                    <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="line-clamp-1">{zone.address}</span>
                    </div>
                  )}

                  <p className="text-sm text-gray-500 mb-4">{zone.city}</p>

                  {/* Stats tickets */}
                  <div className="grid grid-cols-3 gap-2 mb-4 p-3 rounded-xl bg-gray-50">
                    <div className="text-center">
                      <p
                        className={`text-lg font-bold ${
                          stockStatus === 'empty'
                            ? 'text-red-600'
                            : stockStatus === 'low'
                            ? 'text-yellow-600'
                            : 'text-green-600'
                        }`}
                      >
                        {zone.stats.totalAvailable}
                      </p>
                      <p className="text-xs text-gray-500">Disponibles</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">
                        {zone.stats.todaySales}
                      </p>
                      <p className="text-xs text-gray-500">Auj.</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-brand-600">
                        {formatCFA(zone.stats.todayRevenue)}
                      </p>
                      <p className="text-xs text-gray-500">Aujourd'hui</p>
                    </div>
                  </div>

                  {/* Alertes stock bas */}
                  {stockStatus !== 'ok' && (
                    <div
                      className={`mb-4 p-2 rounded-lg text-xs font-medium ${
                        stockStatus === 'empty'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-yellow-50 text-yellow-700'
                      }`}
                    >
                      {stockStatus === 'empty'
                        ? '⚠️ Stock épuisé - Uploadez des tickets'
                        : '⚠️ Stock bas - Moins de 10 tickets'}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <Link href={`/dashboard/zones/${zone.id}`}>
                        <Eye className="w-4 h-4 mr-1" />
                        Voir
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <Link
                        href={`/dashboard/zones/${zone.id}/tickets`}
                        className={stockStatus === 'ok' ? '' : 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50'}
                      >
                        <Ticket className="w-4 h-4 mr-1" />
                        Tickets
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Empty state */
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Wifi className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Aucune zone WiFi configurée
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Créez votre première zone pour commencer à vendre des tickets WiFi
              automatiquement.
            </p>
            <Button asChild className="gap-2">
              <Link href="/dashboard/zones/new">
                <Plus className="w-4 h-4" />
                Créer ma première zone
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
