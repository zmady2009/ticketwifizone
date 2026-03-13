'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Key, Smartphone, LogOut, Loader2, Copy, Check, RefreshCw, Bell, Info, Download, ExternalLink } from 'lucide-react';

interface Profile {
  id: string;
  email: string;
  phone?: string;
  business_name?: string;
  city: string;
  plan: string;
  created_at: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [webhookToken, setWebhookToken] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [notificationSale, setNotificationSale] = useState(true);
  const [notificationLowStock, setNotificationLowStock] = useState(true);

  // Charger le profil
  const loadProfile = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(data);

      // Notifications (si les colonnes existent)
      if (data) {
        setNotificationSale((data as any).notification_sale !== false);
        setNotificationLowStock((data as any).notification_low_stock !== false);
      }

      // Récupérer le webhook token
      const { data: tokenData } = await supabase
        .from('sms_webhook_tokens')
        .select('token, last_used_at')
        .eq('owner_id', user.id)
        .eq('is_active', true)
        .single();

      if (tokenData) {
        setWebhookToken(tokenData.token);
      }
    }

    setLoading(false);
  };

  const handleTestConnection = async () => {
    if (!webhookToken) return;

    setTestingConnection(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/sms-webhook/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: webhookToken }),
      });

      const data = await response.json();
      setTestResult({
        success: response.ok,
        message: data.message || (response.ok ? 'Connexion réussie !' : 'Erreur de connexion'),
      });
    } catch {
      setTestResult({ success: false, message: 'Erreur de connexion au serveur' });
    }

    setTestingConnection(false);
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        notification_sale: notificationSale,
        notification_low_stock: notificationLowStock,
      })
      .eq('id', profile!.id);

    if (!error) {
      await loadProfile();
    }
    setSaving(false);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    const updates = {
      business_name: formData.get('business_name') || null,
      phone: formData.get('phone') || null,
      city: formData.get('city') || 'Ouagadougou',
    };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile!.id);

    if (error) {
      alert('Erreur lors de la sauvegarde');
    } else {
      await loadProfile();
      setSaving(false);
    }
  };

  const handleGenerateWebhookToken = async () => {
    setSaving(true);
    const { data } = await supabase
      .from('sms_webhook_tokens')
           .insert({
        owner_id: profile!.id,
        token: crypto.randomUUID(),
        is_active: true,
      })
      .select('token')
      .single();

    if (data) {
      setWebhookToken(data.token);
      setShowToken(true);
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const copyToken = () => {
    navigator.clipboard.writeText(webhookToken);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-8">
        Paramètres
      </h1>

      {/* Profil */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Profil</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4 max-w-2xl">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={profile?.email || ''} disabled />
            </div>

            <div>
              <Label htmlFor="businessName">Nom du business</Label>
              <Input
                id="businessName"
                type="text"
                defaultValue={profile?.business_name || ''}
                placeholder="Ex: WiFi Zone Cissin"
              />
            </div>

            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                type="tel"
                defaultValue={profile?.phone || ''}
                placeholder="70 12 34 56"
              />
            </div>

            <div>
              <Label htmlFor="city">Ville</Label>
              <Input
                id="city"
                type="text"
                defaultValue={profile?.city || 'Ouagadougou'}
              />
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Enregistrer'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* SMS Forwarder */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Configuration SMS Forwarder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Qu'est-ce que le SMS Forwarder */}
          <div className="p-4 rounded-xl bg-brand-50 border border-brand-200">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-brand-900 mb-1">Qu&apos;est-ce que le SMS Forwarder ?</h4>
                <p className="text-sm text-brand-800">
                  Une application Android gratuite qui transfère automatiquement les SMS de confirmation
                  Mobile Money à notre serveur. Ainsi, quand un client paie, le ticket lui est envoyé
                  instantanément — même à 3h du matin !
                </p>
              </div>
            </div>
          </div>

          {/* Token display */}
          <div>
            <p className="text-sm text-gray-600 mb-3">
              Votre token unique d&apos;authentification. Gardez-le secret !
            </p>

            {webhookToken ? (
              <div className="space-y-3">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <code className="text-sm flex-1 break-all font-mono">
                      {showToken ? webhookToken : `${webhookToken.slice(0, 16)}...`}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyToken}
                      className="shrink-0"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Copié
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" />
                          Copier
                        </>
                      )}
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowToken(!showToken)}
                    className="text-xs"
                  >
                    {showToken ? 'Masquer' : 'Afficher'} le token complet
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestConnection}
                    disabled={testingConnection}
                  >
                    {testingConnection ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Tester la connexion
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerateWebhookToken}
                    className="text-gray-500"
                  >
                    Régénérer
                  </Button>
                </div>

                {testResult && (
                  <div
                    className={`p-3 rounded-lg text-sm ${
                      testResult.success
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    {testResult.message}
                  </div>
                )}
              </div>
            ) : (
              <Button onClick={handleGenerateWebhookToken} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Générer un token'}
              </Button>
            )}
          </div>

          {/* Installation instructions */}
          <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h4 className="font-semibold text-gray-900">Configuration (2 minutes)</h4>
            </div>
            <div className="p-4 space-y-4">
              {/* Step 1 */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-bold">
                  1
                </div>
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900 mb-1">Installer l&apos;application</h5>
                  <p className="text-sm text-gray-600 mb-2">
                    Installez l&apos;application <strong>TWZForwarder</strong> sur votre téléphone Android.
                    Cette application personnalisée transfère automatiquement vos SMS Mobile Money à notre serveur.
                  </p>
                  <div className="inline-flex items-center gap-2 p-2 bg-brand-50 rounded-lg border border-brand-200">
                    <Info className="w-4 h-4 text-brand-600" />
                    <span className="text-sm text-brand-900">
                      L&apos;application sera bientôt disponible sur le Play Store
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-bold">
                  2
                </div>
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900 mb-1">Se connecter</h5>
                  <p className="text-sm text-gray-600">
                    Ouvrez l&apos;app TWZForwarder et connectez-vous avec les mêmes identifiants que
                    ce compte (email et mot de passe).
                  </p>
                  <div className="mt-2 p-3 bg-white rounded-lg border border-gray-200 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Email :</span>
                      <span className="font-medium">{profile?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Mot de passe :</span>
                      <span className="font-medium">••••••••</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    L&apos;app va automatiquement récupérer votre webhook token et commencer à
                    transférer les SMS de confirmation Mobile Money.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-bold">
                  3
                </div>
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900 mb-1">Accorder les permissions</h5>
                  <p className="text-sm text-gray-600">
                    Au premier lancement, l&apos;app vous demandera la permission de lire vos SMS.
                    Acceptez cette permission pour que l&apos;app puisse transférer les confirmations
                    de paiement Mobile Money.
                  </p>
                  <div className="mt-2 p-3 bg-amber-50 rounded-lg border border-amber-200 text-sm text-amber-900">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p>
                        L&apos;app ne lit que les SMS contenant &quot;FCFA&quot;, &quot;recu&quot; ou
                        provenant des opérateurs Mobile Money. Vos autres SMS restent privés.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-bold">
                  4
                </div>
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900 mb-1">Tester</h5>
                  <p className="text-sm text-gray-600 mb-2">
                    Utilisez le bouton &quot;Tester la connexion&quot; ci-dessus pour vérifier que
                    l&apos;app peut communiquer avec le serveur.
                  </p>
                  <p className="text-sm text-gray-600">
                    Ensuite, envoyez-vous un petit montant Mobile Money (ex: 50 F) et vérifiez
                    que vous recevez la notification dans l&apos;app !
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Recevez des alertes par SMS pour rester informé de votre activité.
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200">
              <div>
                <p className="font-medium text-gray-900">Notification de vente</p>
                <p className="text-sm text-gray-500">Recevoir un SMS à chaque ticket vendu</p>
              </div>
              <button
                onClick={() => {
                  setNotificationSale(!notificationSale);
                  handleSaveNotifications();
                }}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  notificationSale ? 'bg-brand-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    notificationSale ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200">
              <div>
                <p className="font-medium text-gray-900">Alerte stock bas</p>
                <p className="text-sm text-gray-500">Recevoir un SMS quand il reste moins de 10 tickets</p>
              </div>
              <button
                onClick={() => {
                  setNotificationLowStock(!notificationLowStock);
                  handleSaveNotifications();
                }}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  notificationLowStock ? 'bg-brand-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    notificationLowStock ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compte */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Compte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm text-gray-500">Plan</p>
              <p className="font-medium capitalize">{profile?.plan || 'free'}</p>
            </div>
            <span className="px-2 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-medium">
              Actif
            </span>
          </div>

          <p className="text-sm text-gray-500">
            Membre depuis le{' '}
            {profile?.created_at
              ? new Date(profile.created_at).toLocaleDateString('fr-FR')
              : '...'}
          </p>
        </CardContent>
      </Card>

      {/* Déconnexion */}
      <Button
        variant="outline"
        onClick={handleLogout}
        className="text-red-600 hover:text-red-700 hover:border-red-300"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Déconnexion
      </Button>
    </div>
  );
}
