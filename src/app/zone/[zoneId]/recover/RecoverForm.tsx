'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, XCircle, Wifi } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TicketResult {
  username: string;
  password: string;
  sold_at: string;
}

interface RecoverFormProps {
  zoneId: string;
}

export function RecoverForm({ zoneId }: RecoverFormProps) {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TicketResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    // Nettoyer le numéro (enlever les espaces)
    const cleanPhone = phone.replace(/\s/g, '');

    if (cleanPhone.length !== 8) {
      setError('Veuillez entrer un numéro à 8 chiffres');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/zone/${zoneId}/recover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone }),
      });

      const data = await response.json();

      if (response.ok && data.ticket) {
        setResult(data.ticket);
      } else {
        setError(data.message || 'Aucun ticket trouvé pour ce numéro');
      }
    } catch {
      setError('Erreur de connexion. Veuillez réessayer.');
    }

    setLoading(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="phone">Numéro de téléphone</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="70 12 34 56"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={8}
            required
            className="text-lg text-center tracking-wider"
          />
          <p className="text-xs text-gray-500 mt-1">
            Le numéro utilisé lors de l&apos;achat du ticket
          </p>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Recherche...
            </>
          ) : (
            'Retrouver mon ticket'
          )}
        </Button>
      </form>

      {/* Result: Success */}
      {result && (
        <div className="mt-6 p-6 rounded-2xl bg-green-50 border-2 border-green-200 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <h3 className="font-bold text-green-900">Ticket trouvé !</h3>
          </div>

          <div className="bg-white rounded-xl p-4 border border-green-200 space-y-3">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Nom d&apos;utilisateur</p>
              <p className="text-xl font-mono font-bold text-gray-900 select-all">{result.username}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Mot de passe</p>
              <p className="text-xl font-mono font-bold text-gray-900 select-all">{result.password}</p>
            </div>
          </div>

          <p className="text-sm text-green-700 mt-4 text-center">
            <Wifi className="w-4 h-4 inline mr-1" />
            Connectez-vous au WiFi et utilisez ces codes
          </p>
        </div>
      )}

      {/* Result: Error */}
      {error && (
        <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
          <p className="text-xs text-red-600 mt-2 ml-7">
            Les tickets sont disponibles pendant 30 jours après l&apos;achat.
          </p>
        </div>
      )}
    </>
  );
}
