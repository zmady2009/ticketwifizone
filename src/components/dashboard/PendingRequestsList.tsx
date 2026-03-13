'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, User, Wifi, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { RealtimeChannel } from '@supabase/supabase-js';

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
  zone?: { id: string; name: string };
  tarif?: { id: string; label: string; duration_minutes: number };
};

interface PendingRequestsListProps {
  initialRequests: PendingRequest[];
  zoneIds: string[];
}

export function PendingRequestsList({ initialRequests, zoneIds }: PendingRequestsListProps) {
  const [requests, setRequests] = useState<PendingRequest[]>(initialRequests);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const supabase = createClient();

  const fetchPendingRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
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

      if (!error && data) {
        setRequests(data);
      }
    } catch (err) {
      console.error('Error fetching pending requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchPendingRequests, 30000);
    return () => clearInterval(interval);
  }, [zoneIds]);

  // Realtime subscription
  useEffect(() => {
    const channel: RealtimeChannel = supabase
      .channel('pending_requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pending_requests',
          filter: `zone_id=in.(${zoneIds.join(',')})`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRequest = payload.new as PendingRequest;
            if (newRequest.status === 'waiting_payment' && zoneIds.includes(newRequest.zone_id)) {
              setRequests((prev) => {
                const exists = prev.find((r) => r.id === newRequest.id);
                if (!exists) {
                  return [newRequest, ...prev];
                }
                return prev;
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as PendingRequest;
            setRequests((prev) =>
              prev.filter((r) => r.id !== updated.id || updated.status === 'waiting_payment')
            );
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as PendingRequest;
            setRequests((prev) => prev.filter((r) => r.id !== deleted.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [zoneIds, supabase]);

  const handleAction = async (requestId: string, action: 'approve' | 'reject') => {
    setActionLoading(requestId);
    try {
      const response = await fetch('/api/manual-validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });

      const result = await response.json();

      if (response.ok) {
        // Remove from list immediately
        setRequests((prev) => prev.filter((r) => r.id !== requestId));
      } else {
        alert(result.error || 'Erreur lors de l\'action');
      }
    } catch (err) {
      console.error('Error action:', err);
      alert('Erreur de connexion');
    } finally {
      setActionLoading(null);
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return { text: 'Expiré', isUrgent: true };

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    if (minutes < 2) return { text: `${minutes}m ${seconds}s`, isUrgent: true };
    if (minutes < 5) return { text: `${minutes} min`, isUrgent: false };
    return { text: `${minutes} min`, isUrgent: false };
  };

  const formatPhone = (phone: string) => {
    if (phone.length === 8) {
      return `${phone.slice(0, 2)} ${phone.slice(2, 4)} ${phone.slice(4, 6)} ${phone.slice(6)}`;
    }
    return phone;
  };

  const getOperatorColor = (operator: string) => {
    switch (operator.toLowerCase()) {
      case 'orange': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'moov': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'telecel': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'wave': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (requests.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-gray-900">
            Validations manuelles en attente
          </h2>
          <span className="px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700 rounded-full">
            {requests.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchPendingRequests}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      <div className="space-y-3">
        {requests.map((request) => {
          const timeRemaining = getTimeRemaining(request.expires_at);
          return (
            <Card key={request.id} className="border-amber-200 bg-amber-50/30">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  {/* Info section */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {formatPhone(request.client_phone)}
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getOperatorColor(request.operator)}`}>
                            {request.operator}
                          </span>
                          {timeRemaining.isUrgent && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {timeRemaining.text}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Wifi className="w-3.5 h-3.5" />
                            {request.zone?.name || 'Zone inconnue'}
                          </span>
                          <span className="font-semibold text-gray-900">
                            {request.tarif?.label || 'Tarif inconnu'}
                          </span>
                          <span className="font-bold text-[#123B8B]">
                            {request.amount_fcfa.toLocaleString('fr-FR')} F
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions section */}
                  <div className="flex items-center gap-2 sm:flex-shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleAction(request.id, 'reject')}
                      disabled={actionLoading === request.id}
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      <span className="hidden sm:inline">Rejeter</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAction(request.id, 'approve')}
                      disabled={actionLoading === request.id}
                      className="bg-[#81B545] hover:bg-[#6da337] text-white gap-1.5"
                    >
                      {actionLoading === request.id ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Traitement...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Valider
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-gray-500">
        💡 Ces demandes n&apos;ont pas pu être validées automatiquement. Vérifiez que vous avez bien reçu le paiement Mobile Money avant de valider.
      </p>
    </div>
  );
}
