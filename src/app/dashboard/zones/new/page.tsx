'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Wifi } from 'lucide-react';
import { ZoneMapPicker } from '@/components/dashboard/ZoneMapPicker';

const CITIES = [
  'Ouagadougou',
  'Bobo-Dioulasso',
  'Koudougou',
  'Ouahigouya',
  'Banfora',
  'Kaya',
  'Dédougou',
  'Fada N\'Gourma',
  'Kaya',
  'Tenkodogo',
  'Koudougou',
  'Réo',
  'Dori',
  'Gaoua',
  'Po',
];

const BURKINA_CITIES = Array.from(new Set(CITIES)).sort();

export default function NewZonePage() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [routerIp, setRouterIp] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [city, setCity] = useState('Ouagadougou');
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation téléphone
    const phoneDigits = contactPhone.replace(/\s/g, '');
    if (contactPhone && !/^\d{8}$/.test(phoneDigits)) {
      setError('Numéro de téléphone invalide (8 chiffres requis)');
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Vous devez être connecté');
        return;
      }

      const { data: zone, error: zoneError } = await supabase
        .from('zones')
        .insert({
          owner_id: user.id,
          name,
          address: address || null,
          city,
          latitude,
          longitude,
          is_active: true,
        })
        .select()
        .single();

      if (zoneError) {
        setError('Erreur lors de la création de la zone');
        return;
      }

      router.push(`/dashboard/zones/${zone.id}`);
    } catch (err) {
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/zones"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux zones
        </Link>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
          Nouvelle zone WiFi
        </h1>
        <p className="text-gray-500 mt-1">
          Configurez un nouveau point d&apos;accès WiFi
        </p>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border-2 border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Informations de base */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="w-5 h-5" />
              Informations de base
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label htmlFor="name">
                Nom de la zone <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Ex: WiFi Zone Cissin"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-12"
              />
              <p className="text-sm text-gray-500 mt-1">
                Un nom identifiable pour vous et vos clients
              </p>
            </div>

            <div>
              <Label htmlFor="description">Description (optionnel)</Label>
              <Input
                id="description"
                type="text"
                placeholder="Ex: Café avec WiFi haut débit au centre-ville"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-12"
              />
            </div>

            <div>
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                type="text"
                placeholder="Ex: Quartier Cissin, près du marché"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="h-12"
              />
            </div>

            <div>
              <Label htmlFor="city">
                Ville <span className="text-red-500">*</span>
              </Label>
              <select
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="flex h-12 w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-2 text-base transition-colors focus-visible:border-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20"
                required
              >
                {BURKINA_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label htmlFor="contactPhone">
                Numéro de contact <span className="text-red-500">*</span>
              </Label>
              <Input
                id="contactPhone"
                type="tel"
                placeholder="70 12 34 56"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                required
                className="h-12"
              />
              <p className="text-sm text-gray-500 mt-1">
                Numéro où vos clients peuvent vous joindre (8 chiffres)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Configuration technique */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration technique (optionnel)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label htmlFor="routerIp">Adresse IP du routeur MikroTik</Label>
              <Input
                id="routerIp"
                type="text"
                placeholder="Ex: 192.168.88.1"
                value={routerIp}
                onChange={(e) => setRouterIp(e.target.value)}
                className="h-12"
              />
              <p className="text-sm text-gray-500 mt-1">
                Pour information uniquement, pas de connexion directe
              </p>
            </div>

            <ZoneMapPicker
              latitude={latitude}
              longitude={longitude}
              onChange={(lat, lng) => {
                setLatitude(lat);
                setLongitude(lng);
              }}
            />
          </CardContent>
        </Card>

        {/* Boutons d'action */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            asChild
          >
            <Link href="/dashboard/zones">Annuler</Link>
          </Button>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Création...
              </>
            ) : (
              'Créer la zone'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
