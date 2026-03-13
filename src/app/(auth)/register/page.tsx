'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Wifi, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Ouagadougou');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    // Validation téléphone Burkina (8 chiffres)
    const phoneDigits = phone.replace(/\s/g, '');
    if (phoneDigits && !/^\d{8}$/.test(phoneDigits)) {
      setError('Numéro de téléphone invalide (8 chiffres requis)');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            phone: phoneDigits,
            business_name: businessName,
            city: city,
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('Un compte existe déjà avec cet email');
        } else {
          setError(signUpError.message);
        }
        return;
      }

      // Redirection vers dashboard
      if (data.user) {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('Une erreur est survenue lors de l\'inscription');
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
            Rejoignez la révolution WiFi
          </h2>
          <p className="text-xl text-blue-200 mb-8">
            Automatisez vos ventes. Gardez 100% de vos revenus.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-white">
              <div className="w-8 h-8 rounded-lg bg-[#81B545]/20 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-[#81B545]" />
              </div>
              <span>Création de compte gratuite</span>
            </div>
            <div className="flex items-center gap-3 text-white">
              <div className="w-8 h-8 rounded-lg bg-[#81B545]/20 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-[#81B545]" />
              </div>
              <span>0% de commission, pour toujours</span>
            </div>
            <div className="flex items-center gap-3 text-white">
              <div className="w-8 h-8 rounded-lg bg-[#81B545]/20 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-[#81B545]" />
              </div>
              <span>Configuration en 5 minutes</span>
            </div>
            <div className="flex items-center gap-3 text-white">
              <div className="w-8 h-8 rounded-lg bg-[#81B545]/20 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-[#81B545]" />
              </div>
              <span>Support par WhatsApp</span>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-blue-200 text-sm mb-4">
            Comparez aux autres solutions :
          </p>
          <div className="flex gap-6 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#81B545]">0%</div>
              <div className="text-blue-200">Notre commission</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400 line-through">2-5%</div>
              <div className="text-blue-200">Concurrents</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Register form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#81B545] text-white mb-4">
              <Wifi className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">TicketWiFiZone</h1>
            <p className="text-gray-500 text-sm mt-1">Zéro commission, 100% automatique</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 lg:p-10">
            <div className="mb-8">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                Créez votre compte
              </h1>
              <p className="text-gray-500">
                Commencez à vendre automatiquement en 2 minutes
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">⚠</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="businessName" className="text-gray-700 font-medium">
                  Nom de votre business
                </Label>
                <Input
                  id="businessName"
                  type="text"
                  placeholder="Ex: WiFi Zone Cissin"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="h-12 rounded-xl border-gray-200 focus:border-[#123B8B] focus:ring-[#123B8B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-700 font-medium">
                    Téléphone
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="70 12 34 56"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-12 rounded-xl border-gray-200 focus:border-[#123B8B] focus:ring-[#123B8B]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city" className="text-gray-700 font-medium">
                    Ville
                  </Label>
                  <Input
                    id="city"
                    type="text"
                    placeholder="Ouagadougou"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="h-12 rounded-xl border-gray-200 focus:border-[#123B8B] focus:ring-[#123B8B]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  Email *
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
                  Mot de passe * (min. 6 caractères)
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="h-12 rounded-xl border-gray-200 focus:border-[#123B8B] focus:ring-[#123B8B]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
                  Confirmer le mot de passe *
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
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
                    Création du compte...
                  </>
                ) : (
                  'Créer mon compte gratuitement'
                )}
              </Button>

              <p className="text-xs text-gray-400 text-center">
                En créant un compte, vous acceptez nos conditions d'utilisation.
              </p>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-gray-500 text-sm">
                Déjà un compte ?{' '}
                <Link
                  href="/login"
                  className="text-[#123B8B] font-semibold hover:text-[#0e2a66]"
                >
                  Se connecter
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
