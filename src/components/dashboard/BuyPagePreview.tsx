'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, Smartphone, Maximize2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { OPERATOR_CONFIGS, type Operator } from '@/lib/ussd';
import { formatCFA, formatDuration } from '@/lib/utils';

interface Tarif {
  id: string;
  label: string;
  duration_minutes: number;
  price_fcfa: number;
}

interface PaymentMethod {
  operator: string;
  is_active: boolean;
}

interface BuyPagePreviewProps {
  zoneId: string;
  zoneName: string;
  initialTarifs?: Tarif[];
  initialPaymentMethods?: PaymentMethod[];
}

export function BuyPagePreview({
  zoneId,
  zoneName,
  initialTarifs = [],
  initialPaymentMethods = [],
}: BuyPagePreviewProps) {
  const [tarifs, setTarifs] = useState<Tarif[]>(initialTarifs);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(initialPaymentMethods);
  const [selectedTarif, setSelectedTarif] = useState<Tarif | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [showFullPreview, setShowFullPreview] = useState(false);

  const buyPageUrl = `https://ticketswifizone.com/zone/${zoneId}/buy`;

  const activeOperators = paymentMethods
    .filter((pm) => pm.is_active)
    .map((pm) => pm.operator as Operator);

  // Simuler l'expérience client
  const handleSimulatePurchase = () => {
    if (tarifs.length > 0 && !selectedTarif) {
      setSelectedTarif(tarifs[0]);
    }
    if (activeOperators.length > 0 && !selectedOperator) {
      setSelectedOperator(activeOperators[0] as Operator);
    }
  };

  useEffect(() => {
    handleSimulatePurchase();
  }, [tarifs, activeOperators]);

  const getUSSDCode = (operator: Operator, phone: string, amount: number) => {
    const format = OPERATOR_CONFIGS[operator].format;
    return format.replace('{phone}', phone).replace('{amount}', String(amount));
  };

  return (
    <div className="space-y-4">
      {/* Header de la preview */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Aperçu page client</h3>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={`/zone/${zoneId}/buy`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-1" />
              Ouvrir
            </a>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowFullPreview(!showFullPreview)}>
            <Maximize2 className="w-4 h-4 mr-1" />
              {showFullPreview ? 'Réduire' : 'Agrandir'}
          </Button>
        </div>
      </div>

      {/* Phone mockup */}
      <div
        className={`bg-gray-900 rounded-[2.5rem] p-3 mx-auto transition-all duration-300 ${
          showFullPreview ? 'w-full max-w-md' : 'w-64'
        }`}
      >
        {/* Screen */}
        <div className="bg-white rounded-[2rem] overflow-hidden">
          {/* Status bar */}
          <div className="bg-gray-100 px-6 py-2 flex items-center justify-between text-xs text-gray-600">
            <span>9:41</span>
            <div className="flex gap-1">
              <div className="w-4 h-2 bg-gray-400 rounded-sm" />
              <div className="w-4 h-2 bg-gray-400 rounded-sm" />
              <div className="w-4 h-2 bg-gray-800 rounded-sm" />
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Zone info */}
            <div className="text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-brand-100 flex items-center justify-center text-brand-700 mb-2">
                <span className="text-lg">📶</span>
              </div>
              <h4 className="font-bold text-gray-900 text-sm">{zoneName}</h4>
              <p className="text-xs text-gray-500">Achetez votre ticket WiFi</p>
            </div>

            {/* Tarifs */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-700">Choisissez un tarif :</p>
              {tarifs.slice(0, showFullPreview ? undefined : 2).map((tarif) => (
                <button
                  key={tarif.id}
                  onClick={() => setSelectedTarif(tarif)}
                  className={`w-full p-3 rounded-xl text-left border-2 transition-all ${
                    selectedTarif?.id === tarif.id
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{tarif.label}</span>
                    <span className="font-bold text-brand-600 text-sm">
                      {formatCFA(tarif.price_fcfa)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDuration(tarif.duration_minutes)}
                  </p>
                </button>
              ))}
              {!showFullPreview && tarifs.length > 2 && (
                <p className="text-xs text-gray-400 text-center">
                  +{tarifs.length - 2} autre(s) tarif(s)
                </p>
              )}
            </div>

            {/* Opérateurs */}
            {selectedTarif && activeOperators.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-700">Moyen de paiement :</p>
                <div className="grid grid-cols-2 gap-2">
                  {activeOperators.slice(0, showFullPreview ? undefined : 2).map((operator) => {
                    const config = OPERATOR_CONFIGS[operator as Operator];
                    const ussdCode = getUSSDCode(
                      operator as Operator,
                      '70123456',
                      selectedTarif.price_fcfa
                    );

                    return (
                      <button
                        key={operator}
                        onClick={() => setSelectedOperator(operator as Operator)}
                        className={`p-2 rounded-xl text-center transition-all ${
                          selectedOperator === operator
                            ? 'ring-2 ring-offset-2 ring-brand-500'
                            : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{
                          background: config.colorClass,
                        }}
                      >
                        <p className="text-xs font-bold text-white">{config.displayName}</p>
                      </button>
                    );
                  })}
                  {!showFullPreview && activeOperators.length > 2 && (
                    <div className="col-span-2 text-xs text-gray-400 text-center p-2">
                      +{activeOperators.length - 2} opérateur(s)
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bouton USSD preview */}
            {selectedTarif && selectedOperator && (
              <div className="pt-2">
                <p className="text-xs font-medium text-gray-700 mb-2">Bouton de paiement :</p>
                <a
                  href={`tel:${getUSSDCode(selectedOperator, '70123456', selectedTarif.price_fcfa).replace(
                    '#',
                    '%23'
                  )}`}
                  className={`block text-center py-3 rounded-xl text-white font-bold text-sm ${
                    OPERATOR_CONFIGS[selectedOperator].colorClass
                  }`}
                >
                  <span className="text-xs opacity-80">tel:</span>
                  {getUSSDCode(selectedOperator, '70123456', selectedTarif.price_fcfa)}
                </a>
              </div>
            )}
          </div>

          {/* Home indicator */}
          <div className="bg-gray-100 py-2 flex justify-center">
            <div className="w-32 h-1 bg-gray-400 rounded-full" />
          </div>
        </div>
      </div>

      {/* Legend */}
      <p className="text-xs text-gray-500 text-center">
        C'est exactement ce que vos clients verront quand ils scanneront le QR code
      </p>
    </div>
  );
}
