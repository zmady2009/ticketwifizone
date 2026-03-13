'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Trash2, Edit2, Loader2, Clock, Ticket as TicketIcon, CheckCircle, XCircle } from 'lucide-react';
import { formatCFA, formatDuration } from '@/lib/utils';

interface Tarif {
  id: string;
  label: string;
  duration_minutes: number;
  data_limit_mb: number | null;
  price_fcfa: number;
  sort_order: number;
  is_active: boolean;
}

export default function TarifsPage() {
  const router = useRouter();
  const params = useParams();
  const zoneId = params.zoneId as string;
  const supabase = createClient();

  const [tarifs, setTarifs] = useState<Tarif[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoneName, setZoneName] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingTarif, setEditingTarif] = useState<Tarif | null>(null);

  // Form state
  const [label, setLabel] = useState('');
  const [durationValue, setDurationValue] = useState('1');
  const [durationUnit, setDurationUnit] = useState<'minutes' | 'hours' | 'days'>('hours');
  const [dataLimitMb, setDataLimitMb] = useState('');
  const [priceFcfa, setPriceFcfa] = useState('200');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Calculer la durée en minutes pour l'affichage
  const durationInMinutes = parseInt(durationValue) || 0;
  let convertedMinutes = durationInMinutes;
  if (durationUnit === 'hours') {
    convertedMinutes = durationInMinutes * 60;
  } else if (durationUnit === 'days') {
    convertedMinutes = durationInMinutes * 24 * 60;
  }

  // Charger les tarifs
  const loadTarifs = async () => {
    setLoading(true);
    const { data: zoneData } = await supabase
      .from('zones')
      .select('name')
      .eq('id', zoneId)
      .single();

    if (zoneData) {
      setZoneName(zoneData.name);
    }

    const { data: tarifsData } = await supabase
      .from('tarifs')
      .select('*')
      .eq('zone_id', zoneId)
      .order('price_fcfa', { ascending: true }); // Tri par prix croissant

    if (tarifsData) {
      setTarifs(tarifsData);
    }
    setLoading(false);
  };

  // Charger au montage
  useEffect(() => {
    loadTarifs();
  }, []);

  // Convertir la durée en minutes selon l'unité
  const convertToMinutes = (): number => {
    const value = parseInt(durationValue) || 0;
    switch (durationUnit) {
      case 'minutes':
        return value;
      case 'hours':
        return value * 60;
      case 'days':
        return value * 24 * 60;
      default:
        return value;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    // Validation
    if (!label.trim()) {
      setFormError('Veuillez entrer un nom pour le tarif');
      setSaving(false);
      return;
    }

    const durationValueNum = parseInt(durationValue);
    if (!durationValueNum || durationValueNum < 1) {
      setFormError('La durée doit être supérieure à 0');
      setSaving(false);
      return;
    }

    const priceFcfaNum = parseInt(priceFcfa);
    if (!priceFcfaNum || priceFcfaNum < 50) {
      setFormError('Le prix doit être d\'au moins 50 FCFA');
      setSaving(false);
      return;
    }

    try {
      const durationMinutes = convertToMinutes();

      if (editingTarif) {
        // Update
        const { error } = await supabase
          .from('tarifs')
          .update({
            label,
            duration_minutes: durationMinutes,
            data_limit_mb: dataLimitMb ? parseInt(dataLimitMb) : null,
            price_fcfa: priceFcfaNum,
          })
          .eq('id', editingTarif.id);

        if (error) {
          setFormError('Erreur lors de la modification: ' + error.message);
          return;
        }
      } else {
        // Create
        const { error } = await supabase.from('tarifs').insert({
          zone_id: zoneId,
          label,
          duration_minutes: durationMinutes,
          data_limit_mb: dataLimitMb ? parseInt(dataLimitMb) : null,
          price_fcfa: priceFcfaNum,
          sort_order: tarifs.length,
        });

        if (error) {
          setFormError('Erreur lors de la création: ' + error.message);
          return;
        }
      }

      // Reset form
      setLabel('');
      setDurationValue('1');
      setDurationUnit('hours');
      setDataLimitMb('');
      setPriceFcfa('200');
      setShowForm(false);
      setEditingTarif(null);

      // Reload
      await loadTarifs();
    } catch (err: any) {
      console.error('Erreur:', err);
      setFormError('Une erreur est survenue: ' + (err?.message || 'Erreur inconnue'));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (tarif: Tarif) => {
    setEditingTarif(tarif);
    setLabel(tarif.label);

    // Convertir les minutes en valeur et unité appropriés
    const minutes = tarif.duration_minutes;
    if (minutes % (24 * 60) === 0 && minutes >= 24 * 60) {
      // Jours
      setDurationValue((minutes / (24 * 60)).toString());
      setDurationUnit('days');
    } else if (minutes % 60 === 0 && minutes >= 60) {
      // Heures
      setDurationValue((minutes / 60).toString());
      setDurationUnit('hours');
    } else {
      // Minutes
      setDurationValue(minutes.toString());
      setDurationUnit('minutes');
    }

    setDataLimitMb(tarif.data_limit_mb?.toString() || '');
    setPriceFcfa(tarif.price_fcfa.toString());
    setShowForm(true);
  };

  const handleDelete = async (tarifId: string) => {
    if (!confirm('Supprimer ce tarif ? Les tickets associés ne seront plus vendables.')) {
      return;
    }

    await supabase.from('tarifs').delete().eq('id', tarifId);
    await loadTarifs();
  };

  const handleToggleActive = async (tarif: Tarif) => {
    await supabase
      .from('tarifs')
      .update({ is_active: !tarif.is_active })
      .eq('id', tarif.id);
    await loadTarifs();
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
              Tarifs - {zoneName}
            </h1>
            <p className="text-gray-500 mt-1">
              Configurez les forfaits disponibles pour vos clients
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Nouveau tarif
          </Button>
        </div>
      </div>

      {/* Formulaire */}
      {showForm && (
        <Card className="mb-6 border-2 border-brand-200 bg-brand-50/30">
          <CardHeader>
            <CardTitle>{editingTarif ? 'Modifier le tarif' : 'Nouveau tarif'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border-2 border-red-200 text-red-700 text-sm">
                  {formError}
                </div>
              )}
              <div>
                <Label htmlFor="label">Nom du tarif *</Label>
                <Input
                  id="label"
                  type="text"
                  placeholder="Ex: 1 heure, Ticket journée, Pass semaine..."
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Durée *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={durationValue}
                      onChange={(e) => setDurationValue(e.target.value)}
                      required
                      className="flex-1"
                    />
                    <select
                      value={durationUnit}
                      onChange={(e) => setDurationUnit(e.target.value as 'minutes' | 'hours' | 'days')}
                      className="h-12 px-3 rounded-xl border-2 border-gray-300 bg-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    >
                      <option value="minutes">Minutes</option>
                      <option value="hours">Heures</option>
                      <option value="days">Jours</option>
                    </select>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    = {formatDuration(convertedMinutes)}
                  </p>
                </div>

                <div>
                  <Label htmlFor="price">Prix (FCFA) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="50"
                    value={priceFcfa}
                    onChange={(e) => setPriceFcfa(e.target.value)}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {formatCFA(Number(priceFcfa || 0))}
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="dataLimit">Limite de données (MB)</Label>
                <Input
                  id="dataLimit"
                  type="number"
                  min="0"
                  placeholder="Optionnel, ex: 500"
                  value={dataLimitMb}
                  onChange={(e) => setDataLimitMb(e.target.value)}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Laisser vide pour illimité
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingTarif(null);
                    setLabel('');
                    setDurationValue('1');
                    setDurationUnit('hours');
                    setDataLimitMb('');
                    setPriceFcfa('200');
                  }}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    editingTarif ? 'Modifier' : 'Créer'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Liste des tarifs */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-600" />
        </div>
      ) : tarifs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tarifs.map((tarif, index) => {
            // Couleur dynamique basée sur le prix (du plus clair au plus foncé)
            const priceColorClass = index === 0
              ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
              : index === 1
              ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'
              : index === 2
              ? 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'
              : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200';

            const badgeColor = index === 0
              ? 'bg-green-500'
              : index === 1
              ? 'bg-blue-500'
              : index === 2
              ? 'bg-purple-500'
              : 'bg-gray-500';

            return (
              <Card
                key={tarif.id}
                className={`transition-all hover:shadow-lg ${
                  !tarif.is_active ? 'opacity-60 bg-gray-50' : priceColorClass
                } border-2`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        tarif.is_active ? 'bg-white shadow-sm' : 'bg-gray-200'
                      }`}>
                        <TicketIcon className={`w-6 h-6 ${tarif.is_active ? badgeColor.replace('bg-', 'text-') : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900">{tarif.label}</h3>
                          {index === 0 && tarif.is_active && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-green-500 text-white rounded-full">
                              Populaire
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(tarif.duration_minutes)}
                        </p>
                      </div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      tarif.is_active ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <span className={`text-2xl font-bold ${
                      tarif.is_active ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {formatCFA(tarif.price_fcfa)}
                    </span>
                  </div>

                  {tarif.data_limit_mb && (
                    <p className="text-sm text-gray-600 mt-2 flex items-center gap-1">
                      <span className="font-medium">{tarif.data_limit_mb} MB</span>
                      <span className="text-gray-500">max</span>
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/50">
                    <button
                      onClick={() => handleToggleActive(tarif)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        tarif.is_active
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                      title={tarif.is_active ? 'Désactiver' : 'Activer'}
                    >
                      {tarif.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {tarif.is_active ? 'Actif' : 'Inactif'}
                    </button>

                    <button
                      onClick={() => handleEdit(tarif)}
                      className="p-2 rounded-lg hover:bg-white/50 text-gray-600 transition-colors"
                      title="Modifier"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(tarif.id)}
                      className="p-2 rounded-lg hover:bg-red-100 text-gray-600 hover:text-red-600 transition-colors ml-auto"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Empty state */
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <TicketIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Aucun tarif configuré
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Créez vos premiers tarifs pour commencer à vendre des tickets WiFi.
            </p>
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Créer mon premier tarif
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
