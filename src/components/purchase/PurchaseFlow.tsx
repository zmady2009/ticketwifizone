'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import {
  Wifi,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Copy,
  RefreshCw,
  ExternalLink,
  Clock,
  Smartphone,
  HelpCircle,
} from 'lucide-react';
import {
  OPERATOR_CONFIGS,
  buildTelURI,
  buildUSSDCode,
  supportsUSSD,
  type Operator,
} from '@/lib/ussd';
import { formatCFA, formatDuration } from '@/lib/utils';

interface Tarif {
  id: string;
  label: string;
  duration_minutes: number;
  data_limit_mb: number | null;
  price_fcfa: number;
}

interface PaymentMethod {
  operator: string;
  phone_number: string;
  is_active: boolean;
}

interface ZoneData {
  id: string;
  name: string;
  address?: string;
  city?: string;
}

type Screen = 'tarif' | 'operator' | 'waiting' | 'success' | 'expired';

interface PurchaseFlowProps {
  zone: ZoneData;
  tarifs: Tarif[];
  paymentMethods: PaymentMethod[];
}

export function PurchaseFlow({ zone, tarifs, paymentMethods }: PurchaseFlowProps) {
  // État de l'écran
  const [screen, setScreen] = useState<Screen>('tarif');

  // Sélections
  const [selectedTarif, setSelectedTarif] = useState<Tarif | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [clientPhone, setClientPhone] = useState('');

  // État de la demande
  const [requestId, setRequestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // État du ticket (succès)
  const [ticket, setTicket] = useState<{ username: string; password: string } | null>(null);

  // Timer pour l'expiration
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Opérateurs actifs pour cette zone
  const activeOperators = paymentMethods
    .filter((pm) => pm.is_active)
    .map((pm) => pm.operator as Operator);

  // polling
  const [pollAttempts, setPollAttempts] = useState(0);
  const MAX_POLL_ATTEMPTS = 120; // 10 minutes à 5 secondes

  // Initier l'achat
  const initiatePurchase = async () => {
    if (!selectedTarif || !selectedOperator || !clientPhone) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    // Validation numéro de téléphone
    const cleanPhone = clientPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 8) {
      setError('Numéro de téléphone invalide (8 chiffres requis)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/purchase/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zoneId: zone.id,
          tarifId: selectedTarif.id,
          customerPhone: cleanPhone,
          operator: selectedOperator,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création de la demande');
      }

      setRequestId(data.requestId);

      // Passer à l'écran d'attente et commencer le polling
      setScreen('waiting');
      startPolling(data.requestId);
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  // Démarrer le polling
  const startPolling = useCallback((id: string) => {
    setPollAttempts(0);
    checkStatus(id);
  }, []);

  // Vérifier le statut (polling)
  const checkStatus = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/purchase/check?requestId=${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur de vérification');
      }

      if (data.status === 'completed' && data.ticket) {
        setTicket(data.ticket);
        setScreen('success');
        return;
      }

      if (data.status === 'expired') {
        setScreen('expired');
        return;
      }

      // Mettre à jour le temps restant (remainingSeconds ou timeRemaining pour compatibilité)
      if (data.remainingSeconds !== undefined) {
        setTimeRemaining(data.remainingSeconds);
      } else if (data.timeRemaining !== undefined) {
        setTimeRemaining(data.timeRemaining);
      }

      // Continuer le polling si status est "pending"
      if (data.status === 'pending') {
        setPollAttempts((prev) => {
          const nextAttempt = prev + 1;
          if (nextAttempt < MAX_POLL_ATTEMPTS) {
            setTimeout(() => checkStatus(id), 5000); // 5 secondes
          } else {
            setScreen('expired');
          }
          return nextAttempt;
        });
        return;
      }

      // Statut inconnu ou autre - continuer le polling
      setPollAttempts((prev) => {
        const nextAttempt = prev + 1;
        if (nextAttempt < MAX_POLL_ATTEMPTS) {
          setTimeout(() => checkStatus(id), 5000);
        } else {
          setScreen('expired');
        }
        return nextAttempt;
      });
    } catch (err: any) {
      console.error('Erreur checkStatus:', err);
      // Continuer le polling en cas d'erreur réseau
      setPollAttempts((prev) => {
        const nextAttempt = prev + 1;
        if (nextAttempt < MAX_POLL_ATTEMPTS) {
          setTimeout(() => checkStatus(id), 5000);
        } else {
          setScreen('expired');
        }
        return nextAttempt;
      });
    }
  }, []);

  // Copier le code WiFi
  const copyTicket = () => {
    if (ticket) {
      const text = `WiFi ${zone.name}\nUtilisateur: ${ticket.username}\nMot de passe: ${ticket.password}`;
      navigator.clipboard.writeText(text);
    }
  };

  // Réessayer
  const retry = () => {
    setScreen('tarif');
    setSelectedTarif(null);
    setSelectedOperator(null);
    setRequestId(null);
    setTicket(null);
    setError(null);
    setPollAttempts(0);
  };

  // Formater le temps restant
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Rendu Écran 1: Sélection du tarif
  if (screen === 'tarif') {
    return (
      <div className="space-y-4">
        {/* Badge 0% commission */}
        <div className="flex justify-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-bold">
            0% de commission
          </span>
        </div>

        {/* Header zone */}
        <div className="text-center pb-4 border-b border-gray-200">
          <div className="w-12 h-12 mx-auto rounded-xl bg-brand-100 flex items-center justify-center text-brand-700 mb-2">
            <Wifi className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">{zone.name}</h1>
          {zone.address && (
            <p className="text-sm text-gray-500 mt-1">{zone.address}</p>
          )}
          <p className="text-sm text-gray-600 mt-2">
            Choisissez votre ticket
          </p>
        </div>

        {/* Liste des tarifs */}
        {tarifs.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucun tarif disponible</p>
          </div>
        ) : (
          <div className="space-y-3 pb-24">
            {tarifs.map((tarif) => (
              <button
                key={tarif.id}
                onClick={() => setSelectedTarif(tarif)}
                className={`w-full p-4 rounded-2xl text-left border-2 transition-all ${
                  selectedTarif?.id === tarif.id
                    ? 'border-brand-500 bg-brand-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 active:scale-[0.98]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-base">{tarif.label}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDuration(tarif.duration_minutes)}
                      {tarif.data_limit_mb && ` · ${tarif.data_limit_mb} MB`}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-brand-600">
                      {formatCFA(tarif.price_fcfa)}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Lien "Ticket perdu ?" */}
        <div className="text-center pb-4">
          <Link
            href={`/zone/${zone.id}/recover`}
            className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700"
          >
            <HelpCircle className="w-4 h-4" />
            Ticket perdu ?
          </Link>
        </div>

        {/* Bouton Continuer (sticky) */}
        {selectedTarif && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
            <Button
              onClick={() => setScreen('operator')}
              className="w-full h-14 text-base font-bold"
              disabled={loading}
            >
              Continuer avec {selectedTarif.label}
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Rendu Écran 2: Sélection opérateur + paiement
  if (screen === 'operator') {
    const selectedConfig = selectedOperator
      ? OPERATOR_CONFIGS[selectedOperator]
      : null;

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="pb-4 border-b border-gray-200">
          <button
            onClick={() => setScreen('tarif')}
            className="text-sm text-gray-500 mb-2 flex items-center gap-1"
          >
            ← Retour
          </button>
          <h1 className="text-xl font-bold text-gray-900">Choisissez votre opérateur</h1>
          <p className="text-sm text-gray-600 mt-1">
            Paiement de {formatCFA(selectedTarif?.price_fcfa || 0)}
          </p>
        </div>

        {/* Liste des opérateurs */}
        <div className="grid grid-cols-2 gap-3">
          {activeOperators.map((operator) => {
            const config = OPERATOR_CONFIGS[operator];
            const isSelected = selectedOperator === operator;
            return (
              <button
                key={operator}
                onClick={() => setSelectedOperator(operator)}
                className={`p-4 rounded-2xl text-center transition-all ${
                  isSelected
                    ? 'ring-4 ring-offset-2 ring-brand-600'
                    : 'opacity-90 hover:opacity-100 active:scale-[0.95]'
                }`}
                style={{
                  background: isSelected ? config.colorClass : '#f3f4f6',
                }}
              >
                <div className={isSelected ? 'text-white' : 'text-gray-900'}>
                  <p className="text-xs font-medium opacity-80">Payer via</p>
                  <p className="font-bold text-base mt-1">{config.displayName}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Gros bouton USSD ONE-CLICK - Affiché immédiatement */}
        {selectedConfig && selectedOperator && supportsUSSD(selectedOperator) && paymentMethods.find(
              (pm) => pm.operator === selectedOperator
            ) && (
              <div className="space-y-4">
                <a
                  href={buildTelURI(
                    selectedConfig.format,
                    paymentMethods.find((pm) => pm.operator === selectedOperator)!.phone_number,
                    selectedTarif!.price_fcfa
                  )}
                  className="block w-full text-center"
                  onClick={(e) => {
                    // Marquer que l'utilisateur a initié le paiement
                    e.currentTarget.dataset.paymentInitiated = "true";
                  }}
                >
                  <div
                    className="p-4 rounded-2xl text-white shadow-lg active:scale-[0.98] transition-transform"
                    style={{ background: selectedConfig.colorClass }}
                  >
                    <p className="font-bold text-lg">
                      💳 Payer {formatCFA(selectedTarif!.price_fcfa)} via {selectedConfig.displayName}
                    </p>
                    <p className="text-sm opacity-90 mt-2 font-mono text-white">
                      {buildUSSDCode(
                        selectedConfig.format,
                        paymentMethods.find((pm) => pm.operator === selectedOperator)!.phone_number,
                        selectedTarif!.price_fcfa
                      )}
                    </p>
                    <p className="text-xs opacity-75 mt-2 text-white">
                      Cliquez pour ouvrir le dialer et payer
                    </p>
                  </div>
                </a>

                <p className="text-xs text-gray-500 text-center">
                  Après le paiement, entrez votre numéro ci-dessous pour recevoir votre code
                </p>
              </div>
            )}

        {/* Numéro de téléphone - Maintenant APRÈS le bouton USSD */}
        {selectedOperator && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📱 Votre numéro de téléphone
              </label>
              <Input
                type="tel"
                placeholder="70 12 34 56"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="h-14 text-lg text-center"
                maxLength={10}
              />
              <p className="text-xs text-gray-500 text-center mt-2">
                Pour recevoir votre code WiFi par SMS
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Note explicative - seulement pour USSD */}
            {selectedOperator && supportsUSSD(selectedOperator) && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                <p className="text-xs text-blue-800">
                  <span className="font-semibold">📲 Comment ça marche :</span> Cliquez sur le bouton ci-dessus,
                  le dialer s'ouvrira avec le code déjà pré-rempli. Entrez juste votre PIN et validez !
                </p>
              </div>
            )}


            {/* Wave - instructions spéciales */}
            {selectedOperator === 'wave' && (
              <div className="p-4 rounded-xl bg-cyan-50 border border-cyan-200">
                <p className="text-sm text-cyan-800 font-medium mb-2">
                  Pour payer via Wave :
                </p>
                <ol className="text-sm text-cyan-700 space-y-1 list-decimal list-inside">
                  <li>Ouvrez l&apos;application Wave</li>
                  <li>Entrez le numéro affiché ci-dessous</li>
                  <li>Envoyez {formatCFA(selectedTarif!.price_fcfa)}</li>
                </ol>
                <p className="text-lg font-bold text-cyan-900 text-center mt-3">
                  {paymentMethods.find((pm) => pm.operator === 'wave')?.phone_number || 'N/A'}
                </p>
              </div>
            )}

            {/* Bouton "J'ai payé" */}
            <Button
              onClick={initiatePurchase}
              disabled={loading}
              className="w-full h-14 text-base font-bold bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Vérification...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  J&apos;ai payé — Recevoir mon code
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Rendu Écran 3: Attente de confirmation
  if (screen === 'waiting') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        {/* Spinner animé */}
        <div className="relative">
          <div className="w-20 h-20 border-4 border-brand-200 rounded-full" />
          <Loader2 className="w-20 h-20 text-brand-600 absolute top-0 left-0 animate-spin" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-gray-900">Paiement en cours de vérification</h2>
          <p className="text-gray-600">
            Nous attendons la confirmation de votre paiement...
          </p>
        </div>

        {/* Timer */}
        {timeRemaining > 0 && (
          <div className="flex items-center gap-2 text-brand-600">
            <Clock className="w-5 h-5" />
            <span className="text-lg font-mono font-bold">
              {formatTime(timeRemaining)}
            </span>
          </div>
        )}

        {/* Info */}
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 max-w-sm">
          <p className="text-sm text-blue-800">
            Le code WiFi apparaîtra automatiquement ici une fois le paiement confirmé.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => setScreen('tarif')}
          className="text-sm"
        >
          Annuler
        </Button>
      </div>
    );
  }

  // Rendu Écran 4: Succès - Code WiFi
  if (screen === 'success' && ticket) {
    return (
      <div className="space-y-6">
        {/* Animation succès */}
        <div className="text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-green-700">Paiement confirmé !</h2>
          <p className="text-gray-600 mt-1">Voici votre code WiFi</p>
        </div>

        {/* Code WiFi en gros */}
        <div className="bg-white rounded-2xl border-2 border-green-200 p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-500">Utilisateur</label>
            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
              <span className="text-xl font-mono font-bold text-gray-900">{ticket.username}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyTicket}
                className="text-brand-600"
              >
                <Copy className="w-4 h-4 mr-1" />
                Copier
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-500">Mot de passe</label>
            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
              <span className="text-xl font-mono font-bold text-gray-900">{ticket.password}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyTicket}
                className="text-brand-600"
              >
                <Copy className="w-4 h-4 mr-1" />
                Copier
              </Button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="p-4 rounded-xl bg-brand-50 border border-brand-200">
          <h3 className="font-semibold text-gray-900 mb-2">Comment vous connecter ?</h3>
          <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
            <li>Connectez-vous au réseau WiFi</li>
            <li>Entrez le nom d&apos;utilisateur et le mot de passe ci-dessus</li>
            <li>Profitez d&apos;Internet !</li>
          </ol>
          {selectedTarif && (
            <p className="text-sm text-gray-600 mt-3 pt-3 border-t border-brand-200">
              Durée : <strong>{formatDuration(selectedTarif.duration_minutes)}</strong>
            </p>
          )}
        </div>

        {/* Boutons d'action */}
        <div className="space-y-3">
          <Button
            onClick={copyTicket}
            className="w-full h-14 text-base font-bold"
          >
            <Copy className="w-5 h-5 mr-2" />
            Copier le code
          </Button>
          <Button
            variant="outline"
            onClick={retry}
            className="w-full h-14"
          >
            Acheter un autre ticket
          </Button>
        </div>
      </div>
    );
  }

  // Rendu Écran 5: Expiré
  if (screen === 'expired') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
          <Clock className="w-10 h-10 text-red-600" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-red-700">Délai dépassé</h2>
          <p className="text-gray-600">
            Le délai de 10 minutes pour effectuer le paiement est expiré.
          </p>
        </div>

        <div className="space-y-3 w-full max-w-xs">
          <Button
            onClick={retry}
            className="w-full h-14 text-base font-bold"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Réessayer
          </Button>
          <Button
            variant="outline"
            asChild
            className="w-full h-14"
          >
            <a href={`https://wa.me/?text=${encodeURIComponent(`Bonjour, j'ai payé pour un ticket WiFi mais je n'ai pas reçu mon code. Zone: ${zone.name}`)}`}>
              <Smartphone className="w-5 h-5 mr-2" />
              Contacter le support
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
