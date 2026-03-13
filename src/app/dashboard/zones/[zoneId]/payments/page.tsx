'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CreditCard, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { OPERATOR_CONFIGS, type Operator } from '@/lib/ussd';
import { cn } from '@/lib/utils';

interface PaymentMethod {
  id: string;
  operator: string;
  phone_number: string;
  ussd_format: string;
  is_active: boolean;
}

export default function PaymentsPage() {
  const router = useRouter();
  const params = useParams();
  const zoneId = params.zoneId as string;
  const supabase = createClient();

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [zoneName, setZoneName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state par opérateur
  const [phoneNumbers, setPhoneNumbers] = useState<Record<string, string>>({
    orange: '',
    moov: '',
    telecel: '',
    wave: '',
  });
  const [ussdFormats, setUssdFormats] = useState<Record<string, string>>({
    orange: OPERATOR_CONFIGS.orange.format,
    moov: OPERATOR_CONFIGS.moov.format,
    telecel: OPERATOR_CONFIGS.telecel.format,
    wave: '',
  });

  // Charger les méthodes de paiement
  const loadPaymentMethods = async () => {
    setLoading(true);

    const { data: zoneData } = await supabase
      .from('zones')
      .select('name')
      .eq('id', zoneId)
      .single();
    if (zoneData) {
      setZoneName(zoneData.name);
    }

    const { data: methodsData } = await supabase
      .from('zone_payment_methods')
      .select('*')
      .eq('zone_id', zoneId);

    if (methodsData) {
      setPaymentMethods(methodsData);
      const phones: Record<string, string> = { orange: '', moov: '', telecel: '', wave: '' };
      const formats: Record<string, string> = { orange: '', moov: '', telecel: '', wave: '' };

      for (const method of methodsData) {
        phones[method.operator] = method.phone_number;
        formats[method.operator] = method.ussd_format;
      }

      setPhoneNumbers(phones);
      setUssdFormats(formats);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const handleSave = async (operator: Operator) => {
    setSaving(true);
    const phoneNumber = phoneNumbers[operator].replace(/\s/g, '');
    const ussdFormat = ussdFormats[operator];

    if (!phoneNumber) {
      // Désactiver
      const existing = paymentMethods.find((pm) => pm.operator === operator);
      if (existing) {
        await supabase
          .from('zone_payment_methods')
          .update({ is_active: false })
          .eq('id', existing.id);
      }
      setSaving(false);
      await loadPaymentMethods();
      return;
    }

    // Valider format téléphone (8 chiffres)
    if (!/^\d{8}$/.test(phoneNumber)) {
      alert('Numéro invalide (8 chiffres requis, sans indicatif pays)');
      setSaving(false);
      return;
    }

    // Créer ou mettre à jour
    const existing = paymentMethods.find((pm) => pm.operator === operator);

    if (existing) {
      await supabase
        .from('zone_payment_methods')
        .update({
          phone_number: phoneNumber,
          ussd_format: ussdFormat,
          is_active: true,
        })
        .eq('id', existing.id);
    } else {
      await supabase.from('zone_payment_methods').insert({
        zone_id: zoneId,
        operator,
        phone_number: phoneNumber,
        ussd_format: ussdFormat,
        is_active: true,
      });
    }

    await loadPaymentMethods();
    setSaving(false);
  };

  const getUSSDPreview = (operator: Operator) => {
    const format = ussdFormats[operator];
    const phone = phoneNumbers[operator].replace(/\s/g, '') || '70123456';
    const amount = 200;

    return format
      .replace('{phone}', phone)
      .replace('{amount}', String(amount));
  };

  const isOperatorActive = (operator: Operator) => {
    return paymentMethods.some((pm) => pm.operator === operator && pm.is_active);
  };

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
          Paiements - {zoneName}
        </h1>
        <p className="text-gray-500 mt-1">
          Configurez vos numéros Mobile Money pour recevoir les paiements
        </p>
      </div>

      {/* Info */}
      <div className="p-4 rounded-xl bg-blue-50 border-2 border-blue-200 mb-8">
        <p className="text-sm text-blue-800">
          <strong>💡 Comment ça marche ?</strong> Les clients paient directement sur VOTRE numéro Mobile Money.
          Vous recevez le montant complet sans commission. Le SMS de confirmation est envoyé automatiquement
          via l'application SMS Forwarder pour distribuer les tickets.
        </p>
      </div>

      {/* Warning si aucun opérateur configuré */}
      {paymentMethods.length > 0 && paymentMethods.every((pm) => !pm.is_active) && (
        <div className="p-4 rounded-xl bg-red-50 border-2 border-red-200 mb-8">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-800">
                ⚠️ Aucun opérateur de paiement configuré
              </p>
              <p className="text-sm text-red-700 mt-1">
                Votre zone ne peut pas vendre de tickets tant que vous n'avez pas activé au moins un opérateur Mobile Money.
                Activez Orange Money, Moov Money, Telecel Money ou Wave ci-dessous.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Configuration par opérateur */}
      <div className="space-y-6">
        {(['orange', 'moov', 'telecel', 'wave'] as Operator[]).map((operator) => {
          const config = OPERATOR_CONFIGS[operator];
          const phoneNumber = phoneNumbers[operator];
          const isActive = isOperatorActive(operator);
          const hasPhone = phoneNumber.length > 0;

          return (
            <Card
              key={operator}
              className={cn('transition-all', isActive && 'ring-2 ring-brand-500')}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center text-white',
                      'bg-gradient-to-br',
                      operator === 'orange' && 'from-[#FF6600] to-[#E55A00]',
                      operator === 'moov' && 'from-[#0066CC] to-[#0055A6]',
                      operator === 'telecel' && 'from-[#00AAFF] to-[#0091D9]',
                      operator === 'wave' && 'from-[#1DC3C3] to-[#19A8A8]'
                    )}
                  >
                    <span className="text-xl font-bold">
                      {operator === 'orange' && 'OM'}
                      {operator === 'moov' && 'MV'}
                      {operator === 'telecel' && 'TC'}
                      {operator === 'wave' && 'WV'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <CardTitle>{config.displayName}</CardTitle>
                    {isActive && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                        <CheckCircle2 className="w-3 h-3" />
                        Actif
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {/* Numéro de téléphone */}
                <div>
                  <Label htmlFor={`phone-${operator}`}>
                    Votre numéro {config.displayName}
                  </Label>
                  <Input
                    id={`phone-${operator}`}
                    type="tel"
                    placeholder="70 12 34 56"
                    value={phoneNumber}
                    onChange={(e) =>
                      setPhoneNumbers({ ...phoneNumbers, [operator]: e.target.value })
                    }
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    C'est sur ce numéro que les clients enverront l'argent
                  </p>
                </div>

                {/* Format USSD (lecture seule pour Wave) */}
                {operator !== 'wave' && (
                  <div>
                    <Label>Format USSD (généré automatiquement)</Label>
                    <Input
                      value={getUSSDPreview(operator)}
                      readOnly
                      className="font-mono text-sm bg-gray-50"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Ce code USSD sera affiché aux clients pour le paiement one-click
                    </p>
                  </div>
                )}

                {/* Note pour Wave */}
                {operator === 'wave' && (
                  <div className="p-3 rounded-xl bg-cyan-50 border border-cyan-200">
                    <p className="text-sm text-cyan-800">
                      <strong>Wave :</strong> Pas de code USSD. Les clients utiliseront l'application
                      Wave pour envoyer l'argent sur votre numéro.
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleSave(operator)}
                    disabled={saving}
                    className={cn(
                      'flex-1 text-white',
                      isActive
                        ? 'bg-green-600 hover:bg-green-700'
                        : operator === 'wave'
                        ? 'bg-gradient-to-br from-[#1DC3C3] to-[#19A8A8] hover:from-[#19A8A8] hover:to-[#168F8F]'
                        : operator === 'orange'
                        ? 'bg-gradient-to-br from-[#FF6600] to-[#E55A00] hover:from-[#E55A00] hover:to-[#CC4D00]'
                        : operator === 'moov'
                        ? 'bg-gradient-to-br from-[#0066CC] to-[#0055A6] hover:from-[#0055A6] hover:to-[#00447A]'
                        : 'bg-gradient-to-br from-[#00AAFF] to-[#0091D9] hover:from-[#0091D9] hover:to-[#0077B3]'
                    )}
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isActive ? (
                      'Mettre à jour'
                    ) : (
                      'Activer'
                    )}
                  </Button>
                  {isActive && (
                    <Button
                      variant="outline"
                      onClick={() => handleSave(operator)}
                      disabled={saving}
                    >
                      Désactiver
                    </Button>
                  )}
                </div>

                {/* Preview USSD */}
                {hasPhone && operator !== 'wave' && (
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">
                      Aperçu du bouton de paiement client :
                    </p>
                    <a
                      href={`tel:${getUSSDPreview(operator).replace('#', '%23')}`}
                      className={cn(
                        'inline-flex items-center gap-2 px-4 py-3 rounded-xl text-white font-medium',
                        'transition-colors',
                        operator === 'orange'
                          ? 'bg-gradient-to-br from-[#FF6600] to-[#E55A00] hover:from-[#E55A00] hover:to-[#CC4D00]'
                          : operator === 'moov'
                          ? 'bg-gradient-to-br from-[#0066CC] to-[#0055A6] hover:from-[#0055A6] hover:to-[#00447A]'
                          : operator === 'telecel'
                          ? 'bg-gradient-to-br from-[#00AAFF] to-[#0091D9] hover:from-[#0091D9] hover:to-[#0077B3]'
                          : 'bg-gradient-to-br from-[#1DC3C3] to-[#19A8A8] hover:from-[#19A8A8] hover:to-[#168F8F]'
                      )}
                    >
                      <span className="text-xs opacity-80">tel:</span>
                      {getUSSDPreview(operator)}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info SMS Forwarder */}
      <Card className="mt-8 border-2 border-brand-200 bg-brand-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Configuration SMS Forwarder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-700">
            Pour recevoir automatiquement les confirmations de paiement, vous devez installer
            l'application SMS Forwarder sur votre téléphone.
          </p>

          <div className="space-y-2 text-sm">
            <p className="font-medium text-gray-900">
              1. Installez "SMS Forwarder" depuis Play Store
            </p>
            <p className="font-medium text-gray-900">
              2. Créez une règle de forwarding
            </p>
            <p className="font-medium text-gray-900">
              3. Entrez ces informations :
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">URL du webhook :</p>
            <code className="text-xs block bg-gray-100 px-2 py-1 rounded break-all">
              https://ticketswifizone.com/api/sms-webhook
            </code>
          </div>

          <p className="text-sm text-gray-500">
            Le token sera disponible dans les paramètres une fois le projet connecté.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
