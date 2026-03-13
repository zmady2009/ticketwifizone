import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { BuyPageClient } from './BuyPageClient';
import { Wifi, MapPin } from 'lucide-react';

interface PageProps {
  params: Promise<{
    zoneId: string;
  }>;
}

interface ZoneData {
  id: string;
  name: string;
  address?: string;
  city?: string;
  is_active: boolean;
}

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

/**
 * Page d'achat client — LA PAGE LA PLUS IMPORTANTE DU PROJET
 *
 * Cette page est accessible publiquement (pas d'authentification requise).
 * C'est la page que les clients voient quand ils scannent le QR code.
 *
 * FONCTIONNALITÉS:
 * - Écran 1: Sélection du tarif
 * - Écran 2: Choix de l'opérateur + bouton USSD one-click
 * - Écran 3: Attente de confirmation (polling)
 * - Écran 4: Code WiFi reçu (succès)
 * - Écran 5: Expiration du délai
 */
export default async function BuyPage({ params }: PageProps) {
  const { zoneId } = await params;
  const supabase = await createClient();

  // Récupérer la zone
  const { data: zone, error: zoneError } = await supabase
    .from('zones')
    .select('id, name, address, city, is_active')
    .eq('id', zoneId)
    .single();

  if (zoneError || !zone) {
    notFound();
  }

  // Vérifier que la zone est active
  if (!zone.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <Wifi className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Zone désactivée</h1>
          <p className="text-gray-600">
            Cette zone WiFi n&apos;est pas active pour le moment.
          </p>
        </div>
      </div>
    );
  }

  // Récupérer les tarifs actifs
  const { data: tarifs } = await supabase
    .from('tarifs')
    .select('id, label, duration_minutes, data_limit_mb, price_fcfa')
    .eq('zone_id', zoneId)
    .eq('is_active', true)
    .order('sort_order');

  // Récupérer les méthodes de paiement actives
  const { data: paymentMethods } = await supabase
    .from('zone_payment_methods')
    .select('operator, phone_number, is_active')
    .eq('zone_id', zoneId)
    .eq('is_active', true);

  return (
    <BuyPageClient
      zone={zone as ZoneData}
      tarifs={(tarifs || []) as Tarif[]}
      paymentMethods={(paymentMethods || []) as PaymentMethod[]}
    />
  );
}

/**
 * Metadata pour le SEO et le partage
 */
export async function generateMetadata({ params }: PageProps) {
  const { zoneId } = await params;
  const supabase = await createClient();

  const { data: zone } = await supabase
    .from('zones')
    .select('name, city')
    .eq('id', zoneId)
    .single();

  return {
    title: zone ? `Acheter ticket WiFi - ${zone.name}` : 'Acheter ticket WiFi',
    description: zone
      ? `Achetez votre ticket WiFi pour ${zone.name} en quelques clics. Paiement Mobile Money (Orange, Moov, Telecel, Wave).`
      : 'Achetez votre ticket WiFi en quelques clics. Paiement Mobile Money.',
    viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  };
}
