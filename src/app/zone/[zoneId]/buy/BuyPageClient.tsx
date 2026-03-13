'use client';

import { PurchaseFlow } from '@/components/purchase/PurchaseFlow';

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

interface BuyPageClientProps {
  zone: ZoneData;
  tarifs: Tarif[];
  paymentMethods: PaymentMethod[];
}

/**
 * BuyPageClient - Page d'achat client
 *
 * Ce composant utilise PurchaseFlow qui contient tout le flow interactif :
 * - Écran 1: Sélection du tarif
 * - Écran 2: Choix de l'opérateur + bouton USSD one-click
 * - Écran 3: Attente de confirmation (polling)
 * - Écran 4: Code WiFi reçu (succès)
 * - Écran 5: Expiration du délai
 */
export function BuyPageClient({ zone, tarifs, paymentMethods }: BuyPageClientProps) {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto bg-white min-h-screen">
        <PurchaseFlow zone={zone} tarifs={tarifs} paymentMethods={paymentMethods} />
      </div>
    </main>
  );
}
