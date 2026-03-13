'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft,
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Download,
  Plus,
  Trash2,
  Filter,
  Search,
  Eye,
  EyeOff,
} from 'lucide-react';
import { parseTicketCSV, type CSVParseResult } from '@/lib/csv-parser';
import { cn } from '@/lib/utils';
import { ticketRowSchema } from '@/lib/schemas';
import { formatCFA, formatDuration } from '@/lib/utils';
import { z } from 'zod';

interface Tarif {
  id: string;
  label: string;
  duration_minutes: number;
  price_fcfa: number;
}

interface Ticket {
  id: string;
  username: string;
  password: string;
  status: 'available' | 'sold' | 'expired';
  tarif_id: string;
  buyer_phone: string | null;
  sold_at: string | null;
  created_at: string;
}

interface TicketCount {
  tarifId: string;
  available_count: number;
  sold_count: number;
}

type UploadTab = 'file' | 'manual';

export default function TicketsPage() {
  const router = useRouter();
  const params = useParams();
  const zoneId = params.zoneId as string;
  const supabase = createClient();

  const [tarifs, setTarifs] = useState<Tarif[]>([]);
  const [ticketCounts, setTicketCounts] = useState<TicketCount[]>([]);
  const [zoneName, setZoneName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Upload state
  const [selectedTarifId, setSelectedTarifId] = useState<string>('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<CSVParseResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: number;
    errors: number;
  } | null>(null);
  const [uploadTab, setUploadTab] = useState<UploadTab>('file');

  // Manual entry state
  const [manualTickets, setManualTickets] = useState<{ username: string; password: string }[]>([
    { username: '', password: '' },
  ]);
  const [showPasswords, setShowPasswords] = useState(false);

  // Tickets list state
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tarifFilter, setTarifFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // Calculer les totaux
  const totalAvailable = ticketCounts.reduce((sum, tc) => sum + (tc.available_count || 0), 0);
  const totalSold = ticketCounts.reduce((sum, tc) => sum + (tc.sold_count || 0), 0);
  const totalUploaded = totalAvailable + totalSold;

  // Charger les tarifs
  const loadData = async () => {
    setLoading(true);

    // Récupérer la zone
    const { data: zoneData } = await supabase
      .from('zones')
      .select('name')
      .eq('id', zoneId)
      .single();
    if (zoneData) setZoneName(zoneData.name);

    // Récupérer les tarifs
    const { data: tarifsData } = await supabase
      .from('tarifs')
      .select('*')
      .eq('zone_id', zoneId)
      .eq('is_active', true)
      .order('price_fcfa', { ascending: true });
    if (tarifsData) {
      setTarifs(tarifsData);
      if (tarifsData.length > 0 && !selectedTarifId) {
        setSelectedTarifId(tarifsData[0].id);
      }
    }

    // Récupérer les counts
    const { data: countsData } = await supabase.rpc('get_ticket_counts', { p_zone_id: zoneId });
    if (countsData) {
      setTicketCounts(countsData);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Charger les tickets avec filtres
  const loadTickets = async () => {
    setTicketsLoading(true);

    let query = supabase
      .from('tickets')
      .select('*')
      .eq('zone_id', zoneId)
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }
    if (tarifFilter !== 'all') {
      query = query.eq('tarif_id', tarifFilter);
    }

    const { data: ticketsData } = await query;
    if (ticketsData) {
      setTickets(ticketsData);
    }

    setTicketsLoading(false);
  };

  useEffect(() => {
    loadTickets();
  }, [statusFilter, tarifFilter, page]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    setParsedData(null);
    setUploadResult(null);

    // Parser le fichier
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsed = parseTicketCSV(content);
      setParsedData(parsed);
    };
    reader.readAsText(file);
  };

  const handleUpload = async (ticketsToUpload: Array<{ username: string; password: string }>) => {
    if (!selectedTarifId) return;

    setUploading(true);
    setUploadResult(null);

    try {
      // Valider chaque ticket
      const validTickets = [];
      const invalidTickets = [];

      for (const ticket of ticketsToUpload) {
        try {
          ticketRowSchema.parse(ticket);
          validTickets.push(ticket);
        } catch (err) {
          invalidTickets.push({
            ticket,
            error: err instanceof Error ? err.message : 'Format invalide',
          });
        }
      }

      // Insérer dans la base via l'API
      let successCount = 0;
      let errorCount = 0;

      // Insérer par lots de 50
      const batchSize = 50;
      for (let i = 0; i < validTickets.length; i += batchSize) {
        const batch = validTickets.slice(i, i + batchSize);
        const response = await fetch('/api/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            zoneId,
            tarifId: selectedTarifId,
            tickets: batch,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          successCount += result.imported || 0;
          errorCount += (result.duplicates || 0) + (batch.length - (result.imported || 0));
        } else {
          errorCount += batch.length;
        }
      }

      errorCount += invalidTickets.length;

      setUploadResult({
        success: successCount,
        errors: errorCount,
      });

      // Reset et reload
      if (successCount > 0) {
        setCsvFile(null);
        setParsedData(null);
        setManualTickets([{ username: '', password: '' }]);
        await loadData();
        await loadTickets();
      }
    } catch (err) {
      console.error('Erreur upload:', err);
      setUploadResult({ success: 0, errors: 1 });
    } finally {
      setUploading(false);
    }
  };

  const addManualRow = () => {
    setManualTickets([...manualTickets, { username: '', password: '' }]);
  };

  const removeManualRow = (index: number) => {
    if (manualTickets.length > 1) {
      setManualTickets(manualTickets.filter((_, i) => i !== index));
    }
  };

  const updateManualRow = (index: number, field: 'username' | 'password', value: string) => {
    const updated = [...manualTickets];
    updated[index][field] = value;
    setManualTickets(updated);
  };

  const getValidManualTickets = () => {
    return manualTickets.filter((t) => t.username.trim() && t.password.trim());
  };

  const filteredTickets = tickets.filter((ticket) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        ticket.username.toLowerCase().includes(query) ||
        ticket.password.toLowerCase().includes(query) ||
        (ticket.buyer_phone && ticket.buyer_phone.includes(query))
      );
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return (
          <span className="px-2 py-1 rounded-lg text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Disponible
          </span>
        );
      case 'sold':
        return (
          <span className="px-2 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-700 flex items-center gap-1">
            <Plus className="w-3 h-3 rotate-45" />
            Vendu
          </span>
        );
      case 'expired':
        return (
          <span className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600">
            Expiré
          </span>
        );
      default:
        return null;
    }
  };

  const getTarifLabel = (tarifId: string) => {
    const tarif = tarifs.find((t) => t.id === tarifId);
    return tarif ? tarif.label : 'Inconnu';
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
          Tickets - {zoneName}
        </h1>
        <p className="text-gray-500 mt-1">
          Uploadez vos tickets MikroTik (CSV) ou saisissez-les manuellement
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500 mb-1">Disponibles</p>
            <p className="text-2xl font-bold text-green-600">{totalAvailable}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500 mb-1">Vendus</p>
            <p className="text-2xl font-bold text-blue-600">{totalSold}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500 mb-1">Total uploadés</p>
            <p className="text-2xl font-bold text-brand-600">{totalUploaded}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500 mb-1">Tx de vente</p>
            <p className="text-2xl font-bold text-gray-900">
              {totalUploaded > 0 ? Math.round((totalSold / totalUploaded) * 100) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upload */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Ajouter des tickets</CardTitle>
            <div className="flex gap-2">
              <button
                onClick={() => setUploadTab('file')}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  uploadTab === 'file'
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                <Upload className="w-4 h-4 inline mr-1" />
                Fichier CSV
              </button>
              <button
                onClick={() => setUploadTab('manual')}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  uploadTab === 'manual'
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                <Plus className="w-4 h-4 inline mr-1" />
                Saisie manuelle
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sélection du tarif */}
          <div>
            <Label htmlFor="tarif">Tarif concerné *</Label>
            <select
              id="tarif"
              value={selectedTarifId}
              onChange={(e) => setSelectedTarifId(e.target.value)}
              className="w-full h-12 rounded-xl border-2 border-gray-300 bg-white px-4 py-2"
              required
            >
              {tarifs.map((tarif) => {
                const count = ticketCounts.find((tc) => tc.tarifId === tarif.id);
                return (
                  <option key={tarif.id} value={tarif.id}>
                    {tarif.label} - {formatCFA(tarif.price_fcfa)}
                    {count && ` (${count.available_count} dispo)`}
                  </option>
                );
              })}
            </select>
            {tarifs.length === 0 && (
              <p className="text-sm text-orange-600 mt-2">
                Créez d&apos;abord des tarifs pour pouvoir uploader des tickets
              </p>
            )}
          </div>

          {uploadTab === 'file' ? (
            <>
              {!parsedData ? (
                <>
                  {/* File drop */}
                  <div>
                    <Label>Fichier CSV *</Label>
                    <div
                      className={cn(
                        'border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer',
                        csvFile ? 'border-brand-400 bg-brand-50' : 'border-gray-300 hover:border-gray-400'
                      )}
                      onClick={() => document.getElementById('csvInput')?.click()}
                    >
                      <input
                        id="csvInput"
                        type="file"
                        accept=".csv"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      {csvFile ? (
                        <div className="space-y-2">
                          <FileText className="w-12 h-12 mx-auto text-brand-600" />
                          <p className="font-medium text-gray-900">{csvFile.name}</p>
                          <p className="text-sm text-gray-500">{(csvFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="w-12 h-12 mx-auto text-gray-400" />
                          <p className="text-gray-600">Glissez-déposez votre fichier CSV ici</p>
                          <p className="text-sm text-gray-400">ou cliquez pour sélectionner</p>
                        </div>
                      )}
                    </div>

                    {/* Format attendu */}
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Format CSV attendu :</p>
                      <code className="text-sm block bg-white px-3 py-2 rounded-lg">
                        username,password
                      </code>
                      <p className="text-xs text-gray-500 mt-2">Exemple: wifi_abc123,motdepasse123</p>
                    </div>
                  </div>

                  {/* Template CSV */}
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                    <p className="text-sm font-medium text-blue-800 mb-2">💡 Pas de fichier ?</p>
                    <button
                      onClick={() => {
                        const template = 'username,password\nwifi_001,pass001\nwifi_002,pass002\nwifi_003,pass003';
                        const blob = new Blob([template], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'tickets_template.csv';
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Download className="w-4 h-4" />
                      Télécharger un template
                    </button>
                  </div>
                </>
              ) : (
                /* Preview */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">
                      Aperçu du fichier ({parsedData.totalRows} lignes)
                    </h3>
                    <button
                      onClick={() => {
                        setCsvFile(null);
                        setParsedData(null);
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Annuler
                    </button>
                  </div>

                  {parsedData.errors.length > 0 && (
                    <div className="p-4 rounded-xl bg-red-50 border-2 border-red-200">
                      <p className="font-medium text-red-800 mb-2">
                        ⚠️ {parsedData.errors.length} lignes invalides :
                      </p>
                      <div className="max-h-32 overflow-y-auto text-sm text-red-700 space-y-1">
                        {parsedData.errors.slice(0, 5).map((err, i) => (
                          <p key={i}>• {err}</p>
                        ))}
                        {parsedData.errors.length > 5 && (
                          <p>...et {parsedData.errors.length - 5} autres</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="p-4 rounded-xl bg-green-50 border-2 border-green-200">
                    <p className="font-medium text-green-800 mb-2">
                      ✅ {parsedData.tickets.length} tickets valides trouvés
                    </p>
                    <div className="max-h-48 overflow-y-auto text-sm">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-gray-600 border-b">
                            <th className="pb-2">Username</th>
                            <th className="pb-2">Password</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedData.tickets.slice(0, 5).map((ticket, i) => (
                            <tr key={i} className="border-b border-gray-200">
                              <td className="py-2 font-mono text-sm">{ticket.username}</td>
                              <td className="py-2 font-mono text-sm">{ticket.password}</td>
                            </tr>
                          ))}
                          {parsedData.tickets.length > 5 && (
                            <tr>
                              <td colSpan={2} className="py-2 text-gray-500 text-sm">
                                ...et {parsedData.tickets.length - 5} autres
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleUpload(parsedData.tickets)}
                    disabled={uploading}
                    className="w-full"
                    size="lg"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Upload en cours...
                      </>
                    ) : (
                      `Importer ${parsedData.tickets.length} tickets`
                    )}
                  </Button>
                </div>
              )}
            </>
          ) : (
            /* Saisie manuelle */
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Tickets à importer</Label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                      {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {showPasswords ? 'Masquer' : 'Voir'} les mots de passe
                    </button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addManualRow}
                      disabled={uploading}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Ajouter une ligne
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {manualTickets.map((ticket, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        placeholder="Username"
                        value={ticket.username}
                        onChange={(e) => updateManualRow(index, 'username', e.target.value)}
                        disabled={uploading}
                        className="flex-1"
                      />
                      <div className="relative flex-1">
                        <Input
                          type={showPasswords ? 'text' : 'password'}
                          placeholder="Password"
                          value={ticket.password}
                          onChange={(e) => updateManualRow(index, 'password', e.target.value)}
                          disabled={uploading}
                          className="w-full"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeManualRow(index)}
                        disabled={uploading || manualTickets.length === 1}
                        className="p-2 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    {getValidManualTickets().length} ticket(s) valide(s)
                  </p>
                  <Button
                    onClick={() => handleUpload(getValidManualTickets())}
                    disabled={uploading || getValidManualTickets().length === 0}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Importation...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Importer {getValidManualTickets().length} ticket(s)
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Résultat upload */}
          {uploadResult && (
            <div
              className={cn(
                'p-4 rounded-xl border-2',
                uploadResult.errors === 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
              )}
            >
              <div className="flex items-center gap-3">
                {uploadResult.errors === 0 ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                )}
                <div>
                  <p className="font-medium">
                    {uploadResult.errors === 0 ? 'Upload réussi !' : 'Upload terminé avec des erreurs'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {uploadResult.success} tickets importés
                    {uploadResult.errors > 0 && `, ${uploadResult.errors} erreurs`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Liste des tickets */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Liste des tickets</CardTitle>
            <div className="flex flex-wrap gap-2">
              {/* Filtre statut */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
                className="h-10 px-3 rounded-lg border-2 border-gray-300 bg-white text-sm"
              >
                <option value="all">Tous les statuts</option>
                <option value="available">Disponibles</option>
                <option value="sold">Vendus</option>
                <option value="expired">Expirés</option>
              </select>

              {/* Filtre tarif */}
              <select
                value={tarifFilter}
                onChange={(e) => {
                  setTarifFilter(e.target.value);
                  setPage(0);
                }}
                className="h-10 px-3 rounded-lg border-2 border-gray-300 bg-white text-sm"
              >
                <option value="all">Tous les tarifs</option>
                {tarifs.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>

              {/* Recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 pl-10 pr-4 rounded-lg border-2 border-gray-300 bg-white text-sm w-40"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {ticketsLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-600" />
            </div>
          ) : filteredTickets.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-600 border-b">
                      <th className="pb-3 font-medium">Username</th>
                      <th className="pb-3 font-medium">Password</th>
                      <th className="pb-3 font-medium">Tarif</th>
                      <th className="pb-3 font-medium">Statut</th>
                      <th className="pb-3 font-medium">Date création</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTickets.map((ticket) => (
                      <tr key={ticket.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 font-mono text-sm">{ticket.username}</td>
                        <td className="py-3 font-mono text-sm">
                          <span className="bg-gray-100 px-2 py-1 rounded">
                            {showPasswords ? ticket.password : '••••••••'}
                          </span>
                        </td>
                        <td className="py-3 text-sm">{getTarifLabel(ticket.tarif_id)}</td>
                        <td className="py-3">{getStatusBadge(ticket.status)}</td>
                        <td className="py-3 text-sm text-gray-500">
                          {new Date(ticket.created_at).toLocaleDateString('fr-FR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">
                  Affichage de {page * pageSize + 1}-{Math.min((page + 1) * pageSize, tickets.length)} sur{' '}
                  {tickets.length}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                  >
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={tickets.length < pageSize}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Aucun ticket trouvé</p>
              {tickets.length === 0 && statusFilter === 'all' && (
                <p className="text-sm mt-2">Uploadez votre premier fichier CSV pour commencer</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cards tarifs avec stocks */}
      <h2 className="text-xl font-bold text-gray-900 mb-4 mt-8">Stock par tarif</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tarifs.map((tarif) => {
          const count = ticketCounts.find((tc) => tc.tarifId === tarif.id);
          const available = count?.available_count || 0;
          const sold = count?.sold_count || 0;

          return (
            <Card
              key={tarif.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                selectedTarifId === tarif.id && 'ring-2 ring-brand-500'
              )}
              onClick={() => setSelectedTarifId(tarif.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">{tarif.label}</h3>
                  <span className="text-lg font-bold text-brand-600">{formatCFA(tarif.price_fcfa)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{formatDuration(tarif.duration_minutes)}</span>
                  <span
                    className={cn(
                      'font-medium',
                      available === 0 ? 'text-red-600' : available < 10 ? 'text-orange-600' : 'text-green-600'
                    )}
                  >
                    {available} dispo
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Vendus : {sold}</span>
                    <span>Total : {available + sold}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
