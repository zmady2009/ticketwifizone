'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Wifi } from 'lucide-react';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError('Email ou mot de passe incorrect');
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#123B8B] p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative patterns */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-[#81B545] rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#81B545] rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#81B545] flex items-center justify-center">
              <Wifi className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">TicketWiFiZone</span>
          </div>
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-white mb-4">
            Vendez vos tickets WiFi en automatique
          </h2>
          <p className="text-xl text-blue-200 mb-8">
            Zéro commission. Paiement en 2 clics. Prêt en 5 minutes.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-white">
              <div className="w-8 h-8 rounded-lg bg-[#81B545]/20 flex items-center justify-center">
                <span className="text-[#81B545]">✓</span>
              </div>
              <span>Paiement USSD One-Click</span>
            </div>
            <div className="flex items-center gap-3 text-white">
              <div className="w-8 h-8 rounded-lg bg-[#81B545]/20 flex items-center justify-center">
                <span className="text-[#81B545]">✓</span>
              </div>
              <span>0% de commission sur vos ventes</span>
            </div>
            <div className="flex items-center gap-3 text-white">
              <div className="w-8 h-8 rounded-lg bg-[#81B545]/20 flex items-center justify-center">
                <span className="text-[#81B545]">✓</span>
              </div>
              <span>Portail captif inclus</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-blue-200 text-sm">
          Déjà utilisé par +50 WiFi Zones au Burkina Faso
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#81B545] text-white mb-4">
              <Wifi className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">TicketWiFiZone</h1>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 lg:p-10">
            <div className="mb-8">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                Connexion
              </h1>
              <p className="text-gray-500">
                Accédez à votre espace propriétaire
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">⚠</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="h-12 rounded-xl border-gray-200 focus:border-[#123B8B] focus:ring-[#123B8B]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  Mot de passe
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="h-12 rounded-xl border-gray-200 focus:border-[#123B8B] focus:ring-[#123B8B]"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-[#123B8B] hover:bg-[#0e2a66] text-white font-medium shadow-lg shadow-[#123B8B]/30"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connexion...
                  </>
                ) : (
                  'Se connecter'
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-gray-500 text-sm">
                Pas encore de compte ?{' '}
                <Link
                  href="/register"
                  className="text-[#123B8B] font-semibold hover:text-[#0e2a66]"
                >
                  Créer un compte gratuitement
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-gray-400 text-xs mt-6">
            Inscription gratuite · Zéro commission · Prêt en 5 minutes
          </p>
        </div>
      </div>
    </div>
  );
}
