# CLAUDE.md — TicketsWiFiZone

## Contexte Projet

TicketsWiFiZone est une plateforme SaaS permettant aux propriétaires de WiFi Zone en Afrique (principalement Burkina Faso, zone UEMOA) de vendre automatiquement des tickets d'accès WiFi via paiement Mobile Money (Orange Money, Moov Money, Telecel Money, Wave).

Le système s'intègre avec des routeurs MikroTik qui gèrent le hotspot et le portail captif. Les propriétaires uploadent leurs tickets (générés via MikroTik User Manager) au format CSV, et la plateforme se charge de les distribuer automatiquement aux clients qui paient.

### Le problème résolu

Aujourd'hui, les propriétaires de WiFi Zone vendent manuellement les tickets : le client paie via Mobile Money, envoie le reçu par WhatsApp, et le propriétaire lui envoie le code. C'est lent, non-scalable, et impossible la nuit. TicketWiFiZone automatise tout ce processus.

### Utilisateurs cibles

1. **Propriétaire WiFi Zone** : Personne (souvent non-technique) qui possède un routeur MikroTik et vend l'accès Internet dans un quartier, kiosque, cybercafé, ou espace public.
2. **Client final** : Personne qui veut acheter un ticket WiFi. Utilise un smartphone Android (85%+) ou feature phone. Familier avec le Mobile Money (USSD).

---

## Analyse Concurrentielle & Positionnement

### Concurrents identifiés (février 2026)

| Concurrent | Pays | Paiement | Particularités | Faiblesses |
|------------|------|----------|----------------|------------|
| **ticketswifizone.com** (Galaxie Team) | Burkina | LigdiCash | App Android, vente de kits matériels (85K-425K FCFA), intégration portail captif | UI datée (PHP/Bootstrap), commission via agrégateur, score confiance faible |
| **ticketwifi.com** | Togo | Flooz, Tmoney, Orange, MTN | Même concept adapté zone UEMOA | Peu de visibilité, marché togolais principalement |
| **fasowifi.com** | Burkina | Orange, Moov, Visa, LigdiCash | Concurrent direct au Burkina | Interface basique |
| **wifizoner.click** | Togo | TMoney | Code envoyé par SMS, système de revendeurs avec commissions, config MikroTik gratuite | Marché togolais, un seul opérateur |
| **mana-zone.app** | Multi-pays | Mobile Money | Le plus avancé techniquement : création automatique tickets depuis serveur distant, multi-routeur | Plus complexe, pas de focus Burkina |

### Nos 4 différenciateurs clés (IMPORTANT — à mettre en avant dans TOUT le produit)

1. **🚀 Paiement USSD One-Click** — AUCUN concurrent ne l'a. Le client tape un bouton → le dialer s'ouvre avec le code USSD pré-rempli → il entre son PIN → c'est payé. 2 interactions au lieu de 5 écrans chez les concurrents qui passent par LigdiCash/CinetPay.

2. **💰 Zéro commission** — Grâce au SMS Forwarding, le paiement va directement du client au propriétaire via transfert Mobile Money standard. Pas d'agrégateur au milieu = 0% de commission. Les concurrents prennent 2-5% via LigdiCash. Sur 100 tickets/jour à 200F, le propriétaire économise 4 000-10 000 FCFA/jour.

3. **📱 Portail captif prêt à l'emploi** — On fournit un fichier `login.html` professionnel et responsive avec le QR code et les boutons de paiement intégrés. Les concurrents laissent le propriétaire se débrouiller ou donnent un snippet HTML brut.

4. **🆓 Offre 100% gratuite au démarrage** — Pas de kit à acheter, pas d'abonnement, pas de commission. Le propriétaire commence à vendre immédiatement. Monétisation future via features premium (analytics avancés, multi-zone, API MikroTik directe).

### Message marketing principal

> **"La seule plateforme où le propriétaire garde 100% de ses ventes. Zéro commission. Paiement en 2 clics pour le client."**

### Walled Garden MikroTik

Pour que les clients puissent payer sans avoir la connexion Internet (depuis le hotspot), le propriétaire doit ajouter notre domaine dans le Walled Garden MikroTik :
- `*ticketswifizone.com*` (notre plateforme)
- `*vercel.app*` (si déployé sur Vercel en dev)

Contrairement aux concurrents qui nécessitent `*ligdicash.com*` + `*cloudflare.com*` + `*galaxieteam.com*`, nous n'avons besoin QUE de notre propre domaine car le paiement passe par USSD (hors internet) et non par un agrégateur web.

**Chemin MikroTik** : IP → Hotspot → Walled Garden → New → Dst. Host = `*ticketswifizone.com*`

---

## Stack Technique

| Couche | Technologie | Justification |
|--------|-------------|---------------|
| Frontend | **Next.js 14+ (App Router)** | SSR, API routes, performance, i18n |
| Styling | **Tailwind CSS + shadcn/ui** | Rapide, responsive, composants accessibles |
| Backend/BaaS | **Supabase** | Auth, PostgreSQL, Edge Functions, Realtime, Storage |
| Base de données | **PostgreSQL (via Supabase)** | RLS, robuste, temps réel |
| Notifications SMS | **Africa's Talking** | Bonne couverture Burkina, API simple, ~15 FCFA/SMS |
| QR Code | **qrcode (npm)** | Génération côté serveur |
| Déploiement | **Vercel** (front) + **Supabase Cloud** (back) | Gratuit au démarrage |
| Langage | **TypeScript** partout | Sécurité des types, meilleure DX |

### Pourquoi PAS d'API Mobile Money (FedaPay/CinetPay) pour le MVP ?

Le MVP utilise une approche **SMS Forwarding** : le propriétaire installe une app Android gratuite ("SMS Forwarder") qui forwarde les SMS de confirmation Mobile Money vers notre serveur. Le serveur parse le SMS, matche avec la demande en attente, et distribue le ticket. Avantages : zéro coût d'intégration, marche avec tous les opérateurs, aucun KYC/contrat commercial.

---

## Architecture du Système

```
┌─────────────────────────────────────────────────────────────────┐
│                      INTERFACES CLIENT                          │
├──────────────────┬──────────────────┬───────────────────────────┤
│  Page d'achat    │  Dashboard       │  Portail captif MikroTik  │
│  /zone/[id]/buy  │  /dashboard/*    │  (HTML hébergé sur        │
│  (public, PWA)   │  (auth required) │   le routeur, lien vers   │
│                  │                  │   notre page d'achat)     │
└────────┬─────────┴────────┬─────────┴───────────────────────────┘
         │                  │
         ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS API ROUTES                            │
│  /api/purchase/initiate    → Créer une demande d'achat          │
│  /api/purchase/check       → Polling statut (Realtime aussi)    │
│  /api/sms-webhook          → Réception SMS forwardés            │
│  /api/manual-validate      → Validation manuelle propriétaire   │
│  /api/tickets/upload       → Upload CSV tickets                 │
│  /api/zones/[id]/qr        → Génération QR code                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SUPABASE                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │   Auth   │  │ Postgres │  │ Realtime │  │    Storage     │  │
│  │ (email + │  │  (RLS)   │  │(channels)│  │ (QR images)    │  │
│  │  phone)  │  │          │  │          │  │                │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Flux de paiement (cœur du système)

```
1. Client scanne QR → ouvre /zone/[zoneId]/buy
2. Client choisit tarif (ex: 1h, 200F) + opérateur (Orange)
3. Page affiche bouton USSD one-click : tel:*144*2*1*65678727*200%23
4. Client appuie → dialer s'ouvre → client entre PIN → paiement fait
5. Client entre son numéro → clique "J'ai payé"
6. Système crée une `pending_request` (status: waiting_payment)
7. Client voit un spinner + polling /api/purchase/check (+ Realtime)
8. PENDANT CE TEMPS : propriétaire reçoit SMS de confirmation Mobile Money
9. App "SMS Forwarder" sur le téléphone du propriétaire forwarde le SMS → POST /api/sms-webhook
10. Serveur parse le SMS → extrait montant + numéro expéditeur
11. Serveur matche avec la pending_request correspondante
12. Serveur récupère un ticket disponible, le marque "sold"
13. Serveur envoie SMS au client avec le code WiFi
14. Serveur update pending_request → status: completed
15. Realtime notifie la page client → affiche le code WiFi
```

---

## Schéma de Base de Données

### Tables principales

```sql
-- ============================================================
-- TABLE: profiles (extension de auth.users)
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  business_name TEXT,
  city TEXT DEFAULT 'Ouagadougou',
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLE: zones (points d'accès WiFi)
-- ============================================================
CREATE TABLE public.zones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT DEFAULT 'Ouagadougou',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_active BOOLEAN DEFAULT true,
  qr_code_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLE: zone_payment_methods (numéros Mobile Money par zone)
-- ============================================================
CREATE TABLE public.zone_payment_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id UUID NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  operator TEXT NOT NULL CHECK (operator IN ('orange', 'moov', 'telecel', 'wave')),
  phone_number TEXT NOT NULL,
  ussd_format TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(zone_id, operator)
);

-- ============================================================
-- TABLE: tarifs
-- ============================================================
CREATE TABLE public.tarifs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id UUID NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  data_limit_mb INTEGER,
  price_fcfa INTEGER NOT NULL CHECK (price_fcfa > 0),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLE: tickets (pool de codes WiFi uploadés depuis MikroTik)
-- ============================================================
CREATE TABLE public.tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id UUID NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  tarif_id UUID NOT NULL REFERENCES public.tarifs(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'sold', 'expired')),
  buyer_phone TEXT,
  sold_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(zone_id, username)
);

-- ============================================================
-- TABLE: pending_requests (demandes d'achat en attente de paiement)
-- ============================================================
CREATE TABLE public.pending_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id UUID NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  tarif_id UUID NOT NULL REFERENCES public.tarifs(id) ON DELETE CASCADE,
  client_phone TEXT NOT NULL,
  operator TEXT NOT NULL,
  amount_fcfa INTEGER NOT NULL,
  status TEXT DEFAULT 'waiting_payment' CHECK (status IN ('waiting_payment', 'completed', 'expired', 'manual_review')),
  ticket_id UUID REFERENCES public.tickets(id),
  sms_ref TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '10 minutes'),
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- ============================================================
-- TABLE: transactions (historique des ventes)
-- ============================================================
CREATE TABLE public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id UUID NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  tarif_id UUID NOT NULL REFERENCES public.tarifs(id),
  ticket_id UUID REFERENCES public.tickets(id),
  pending_request_id UUID REFERENCES public.pending_requests(id),
  amount_fcfa INTEGER NOT NULL,
  buyer_phone TEXT NOT NULL,
  operator TEXT NOT NULL,
  sms_ref TEXT,
  validation_method TEXT DEFAULT 'sms_forward' CHECK (validation_method IN ('sms_forward', 'manual', 'api')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLE: sms_webhook_tokens (auth pour SMS Forwarder)
-- ============================================================
CREATE TABLE public.sms_webhook_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEX
-- ============================================================
CREATE INDEX idx_tickets_available ON tickets(zone_id, tarif_id, status) WHERE status = 'available';
CREATE INDEX idx_pending_active ON pending_requests(zone_id, client_phone, status) WHERE status = 'waiting_payment';
CREATE INDEX idx_pending_expires ON pending_requests(expires_at) WHERE status = 'waiting_payment';
CREATE INDEX idx_transactions_zone ON transactions(zone_id, created_at DESC);
CREATE INDEX idx_zones_owner ON zones(owner_id);
```

### Row Level Security (RLS)

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE zone_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarifs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_webhook_tokens ENABLE ROW LEVEL SECURITY;

-- Profiles: chaque user ne voit que son profil
CREATE POLICY "profiles_own" ON profiles FOR ALL USING (id = auth.uid());

-- Zones: propriétaire voit ses zones
CREATE POLICY "zones_own" ON zones FOR ALL USING (owner_id = auth.uid());

-- Payment methods: propriétaire voit celles de ses zones
CREATE POLICY "payment_methods_own" ON zone_payment_methods FOR ALL
  USING (zone_id IN (SELECT id FROM zones WHERE owner_id = auth.uid()));

-- Tarifs: propriétaire gère ses tarifs, public peut lire les tarifs actifs
CREATE POLICY "tarifs_own" ON tarifs FOR ALL
  USING (zone_id IN (SELECT id FROM zones WHERE owner_id = auth.uid()));
CREATE POLICY "tarifs_public_read" ON tarifs FOR SELECT USING (is_active = true);

-- Tickets: propriétaire gère ses tickets
CREATE POLICY "tickets_own" ON tickets FOR ALL
  USING (zone_id IN (SELECT id FROM zones WHERE owner_id = auth.uid()));

-- Pending requests: accès public en INSERT (clients), propriétaire voit les siens
CREATE POLICY "pending_public_insert" ON pending_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "pending_public_select" ON pending_requests FOR SELECT USING (true);
CREATE POLICY "pending_own_update" ON pending_requests FOR UPDATE
  USING (zone_id IN (SELECT id FROM zones WHERE owner_id = auth.uid()));

-- Transactions: propriétaire voit ses transactions
CREATE POLICY "transactions_own" ON transactions FOR ALL
  USING (zone_id IN (SELECT id FROM zones WHERE owner_id = auth.uid()));

-- SMS tokens: propriétaire gère ses tokens
CREATE POLICY "sms_tokens_own" ON sms_webhook_tokens FOR ALL USING (owner_id = auth.uid());
```

### Fonctions SQL

```sql
-- Fonction : compter les tickets disponibles par tarif pour une zone
CREATE OR REPLACE FUNCTION get_ticket_counts(p_zone_id UUID)
RETURNS TABLE(tarif_id UUID, available_count BIGINT, sold_count BIGINT) AS $$
  SELECT
    t.tarif_id,
    COUNT(*) FILTER (WHERE t.status = 'available') AS available_count,
    COUNT(*) FILTER (WHERE t.status = 'sold') AS sold_count
  FROM tickets t
  WHERE t.zone_id = p_zone_id
  GROUP BY t.tarif_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Fonction : expirer les pending_requests anciennes (cron ou appel périodique)
CREATE OR REPLACE FUNCTION expire_old_requests()
RETURNS void AS $$
  UPDATE pending_requests
  SET status = 'expired'
  WHERE status = 'waiting_payment' AND expires_at < now();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Trigger : auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER zones_updated_at BEFORE UPDATE ON zones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger : créer un profil automatiquement quand un user s'inscrit
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## Structure du Projet

```
ticketwifizone/
├── CLAUDE.md                          ← CE FICHIER
├── package.json
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── .env.local.example
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql     ← Schéma complet ci-dessus
├── public/
│   └── logo.svg
├── src/
│   ├── app/
│   │   ├── layout.tsx                 ← Layout racine (fonts, metadata)
│   │   ├── page.tsx                   ← Landing page marketing
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx         ← Connexion propriétaire
│   │   │   └── register/page.tsx      ← Inscription propriétaire
│   │   ├── dashboard/
│   │   │   ├── layout.tsx             ← Layout protégé (sidebar, auth check)
│   │   │   ├── page.tsx               ← Vue d'ensemble (stats du jour)
│   │   │   ├── zones/
│   │   │   │   ├── page.tsx           ← Liste des zones
│   │   │   │   ├── new/page.tsx       ← Créer une zone
│   │   │   │   └── [zoneId]/
│   │   │   │       ├── page.tsx       ← Détail zone (stats, QR, lien)
│   │   │   │       ├── tarifs/page.tsx     ← Gestion tarifs
│   │   │   │       ├── tickets/page.tsx    ← Upload/gestion tickets
│   │   │   │       └── payments/page.tsx   ← Config paiement (numéros MM)
│   │   │   ├── transactions/page.tsx  ← Historique des ventes
│   │   │   └── settings/page.tsx      ← Profil, SMS Forwarder setup
│   │   ├── zone/
│   │   │   └── [zoneId]/
│   │   │       └── buy/page.tsx       ← PAGE D'ACHAT CLIENT (publique)
│   │   └── api/
│   │       ├── purchase/
│   │       │   ├── initiate/route.ts  ← Créer pending_request
│   │       │   └── check/route.ts     ← Vérifier statut
│   │       ├── sms-webhook/route.ts   ← Réception SMS forwardés
│   │       ├── manual-validate/route.ts ← Validation manuelle
│   │       ├── tickets/
│   │       │   └── upload/route.ts    ← Upload CSV
│   │       └── zones/
│   │           └── [zoneId]/
│   │               └── qr/route.ts    ← Génération QR code
│   ├── components/
│   │   ├── ui/                        ← Composants shadcn/ui
│   │   ├── dashboard/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── StatsCards.tsx
│   │   │   ├── ZoneCard.tsx
│   │   │   ├── TarifForm.tsx
│   │   │   ├── TicketUploader.tsx     ← Upload + parse CSV
│   │   │   ├── PaymentMethodForm.tsx  ← Config numéros Mobile Money
│   │   │   ├── TransactionTable.tsx
│   │   │   ├── PendingRequestsList.tsx ← Validations manuelles en attente
│   │   │   └── SmsForwarderSetup.tsx  ← Instructions + token webhook
│   │   └── purchase/
│   │       ├── TarifSelector.tsx
│   │       ├── OperatorSelector.tsx
│   │       ├── USSDPayButton.tsx      ← LE BOUTON USSD ONE-CLICK
│   │       ├── PhoneInput.tsx
│   │       ├── PaymentWaiting.tsx     ← Spinner + polling
│   │       └── TicketDisplay.tsx      ← Affichage du code WiFi
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts             ← createBrowserClient
│   │   │   ├── server.ts             ← createServerClient (pour RSC)
│   │   │   ├── middleware.ts          ← Refresh session
│   │   │   └── admin.ts              ← Service role (pour API routes)
│   │   ├── sms/
│   │   │   ├── parser.ts             ← Parse SMS Mobile Money
│   │   │   └── sender.ts             ← Envoi SMS via Africa's Talking
│   │   ├── ussd.ts                   ← Génération codes USSD + liens tel:
│   │   ├── csv-parser.ts             ← Parse CSV MikroTik
│   │   ├── qr.ts                     ← Génération QR code
│   │   └── utils.ts                  ← Helpers (formatage FCFA, etc.)
│   ├── hooks/
│   │   ├── useSupabase.ts
│   │   ├── useRealtimeStatus.ts      ← Écoute Realtime pour page d'achat
│   │   └── useZoneStats.ts
│   └── types/
│       ├── database.ts               ← Types générés par Supabase CLI
│       └── index.ts                   ← Types métier
└── middleware.ts                       ← Auth middleware (protège /dashboard)
```

---

## Spécifications Détaillées par Composant

### 1. Page d'achat client — `/zone/[zoneId]/buy/page.tsx`

C'est la page la plus critique. Elle doit être :
- **Ultra-rapide** (PWA, pas de JS inutile)
- **Mobile-first** (95% des clients sont sur mobile)
- **Simple** (3 écrans maximum : tarif → opérateur+paiement → code WiFi)
- **Accessible offline-first** (service worker pour la structure, le contenu dynamique via API)

#### Écran 1 : Sélection du tarif
- Header avec nom de la zone WiFi + adresse
- Grille de tarifs (icône, label, prix en FCFA) — cards cliquables
- Badges des opérateurs acceptés en bas

#### Écran 2 : Paiement (opérateur + USSD + numéro)
- Bouton retour
- Résumé du tarif choisi
- Liste des opérateurs disponibles avec le bouton USSD one-click pour chacun :
  ```html
  <a href="tel:*144*2*1*65678727*200%23">
    Payer 200 F via Orange Money
    *144*2*1*65678727*200#
  </a>
  ```
- Code USSD affiché en clair comme fallback (copiable)
- Note Wave : "Ouvrez l'app Wave et envoyez XXX F au NUMÉRO"
- Champ numéro de téléphone (celui qui a payé)
- Bouton "J'ai payé — Recevoir mon code WiFi"

#### Écran 3a : Attente
- Spinner animé avec compteur de secondes
- Barre de progression
- Message "Vérification en cours... 10-30 secondes"
- **Polling** : GET /api/purchase/check?requestId=XXX toutes les 3 secondes
- **Realtime** : subscribe au channel `pending_request:{requestId}` pour notification instantanée
- Timeout à 2 minutes → affiche bouton "Contacter le propriétaire" (WhatsApp link)

#### Écran 3b : Succès
- Icône check animée
- Code WiFi en gros (username + password), sélectionnable/copiable
- Instructions : "Connectez-vous au réseau WiFi, entrez ce code sur la page de connexion"
- Note "Un SMS avec ce code a été envoyé au 70 XX XX XX"
- Bouton "Acheter un autre ticket"

### 2. Bouton USSD One-Click — `USSDPayButton.tsx`

```typescript
// Formats USSD par opérateur pour le Burkina Faso
const USSD_FORMATS: Record<string, string> = {
  orange:  '*144*2*1*{phone}*{amount}#',
  moov:    '*155*1*1*{phone}*{amount}#',
  telecel: '*100*1*1*{phone}*{amount}#',
};

// Le # doit être encodé en %23 dans le lien tel:
function buildTelUri(operator: string, phone: string, amount: number): string {
  const code = USSD_FORMATS[operator]
    .replace('{phone}', phone)
    .replace('{amount}', String(amount));
  return `tel:${code.replace('#', '%23')}`;
}
```

Le composant doit :
- Être un `<a href="tel:...">` (pas un button) pour que le navigateur ouvre le dialer
- Afficher le code USSD lisible à l'intérieur du bouton
- Avoir un style visuel fort (gradient couleur de l'opérateur, gros, cliquable)
- Afficher le code en clair en dessous comme fallback copiable

### 3. API SMS Webhook — `/api/sms-webhook/route.ts`

Endpoint POST qui reçoit les SMS forwardés par l'app "SMS Forwarder" du propriétaire.

#### Payload attendu
```json
{
  "from": "OrangeMoney",
  "body": "Vous avez recu 200 FCFA de 70 12 34 56. Votre solde est de 15430 FCFA. Trans ID: OM240221.1234.A56789",
  "receivedAt": "2026-02-22T10:30:00Z",
  "token": "abc123def456..."
}
```

#### Logique
1. Vérifier le token dans `sms_webhook_tokens` → identifier le propriétaire
2. Parser le SMS avec les regex pour chaque opérateur (voir `lib/sms/parser.ts`)
3. Trouver les zones du propriétaire
4. Chercher une `pending_request` qui matche : même zone, même montant, numéro client = numéro expéditeur dans le SMS, status = 'waiting_payment', non expirée
5. Si match trouvé :
   - Récupérer un ticket disponible (status = 'available') pour le bon tarif
   - UPDATE ticket → status = 'sold', buyer_phone, sold_at
   - UPDATE pending_request → status = 'completed', ticket_id, completed_at
   - INSERT dans transactions
   - Envoyer SMS au client avec le code WiFi (Africa's Talking)
   - Broadcast Realtime sur le channel de la pending_request
6. Si pas de match : logger pour debug, ne rien faire (le SMS peut être un paiement non lié)

#### Parser SMS — `lib/sms/parser.ts`

```typescript
interface ParsedSMS {
  amount: number;
  senderPhone: string;
  reference?: string;
  operator: 'orange' | 'moov' | 'telecel' | 'wave';
}

// Regex patterns pour le Burkina Faso
const PATTERNS = {
  orange: /recu\s+(\d[\d\s]*?)\s*FCFA.*?(\d{2}\s*\d{2}\s*\d{2}\s*\d{2})/i,
  moov: /recu:?\s*(\d[\d\s]*?)\s*FCFA.*?(\d{2}\s*\d{2}\s*\d{2}\s*\d{2})/i,
  wave: /recu\s+(\d[\d\s]*?)\s*FCFA.*?\((\d{2}\s*\d{2}\s*\d{2}\s*\d{2})\)/i,
};

// IMPORTANT : les formats SMS changent parfois. Prévoir un fallback
// et logger les SMS non-parsés pour ajuster les regex.
```

### 4. Dashboard propriétaire — `/dashboard/`

#### Page d'accueil (`/dashboard/page.tsx`)
- Cards stats : Ventes aujourd'hui (nombre + montant FCFA), Tickets restants, Zones actives
- Liste des dernières transactions (5 dernières)
- Alertes : "⚠️ 3 tickets restants pour le tarif 1h sur Zone Cissin"
- Lien rapide vers les validations manuelles en attente

#### Gestion zones (`/dashboard/zones/`)
- Liste des zones avec status (active/inactive), nombre de tickets restants
- Création zone : nom, adresse, ville
- Détail zone : stats, QR code téléchargeable, lien de la page d'achat, config paiement

#### Upload tickets (`/dashboard/zones/[zoneId]/tickets/page.tsx`)
- Drag & drop zone pour fichier CSV
- Format attendu : `username,password` (une colonne par ligne)
- Le propriétaire sélectionne le tarif associé avant upload
- Prévisualisation des 5 premiers tickets avant confirmation
- Après upload : nombre de tickets ajoutés, total disponible par tarif

#### Configuration paiement (`/dashboard/zones/[zoneId]/payments/page.tsx`)
- Pour chaque opérateur : toggle actif/inactif + champ numéro de téléphone
- Le numéro est celui sur lequel le propriétaire reçoit les paiements Mobile Money
- Prévisualisation du code USSD qui sera généré pour les clients

#### Paramètres (`/dashboard/settings/page.tsx`)
- Profil (nom business, email, téléphone)
- **Section SMS Forwarder** : instructions pas-à-pas avec screenshots
  1. Télécharger "SMS Forwarder" sur Play Store
  2. Créer une règle : SMS contenant "FCFA" ou "recu"
  3. Action : HTTP POST vers `https://ticketswifizone.com/api/sms-webhook`
  4. Body JSON avec le token affiché (copiable)
  5. Bouton "Tester la connexion" pour vérifier que le forwarding marche

### 5. Validation manuelle (fallback) — `/api/manual-validate/route.ts`

Pour les propriétaires sans SMS Forwarder ou quand le forwarding échoue :
- Le dashboard affiche les `pending_requests` en status 'waiting_payment'
- Le propriétaire voit : numéro client, montant attendu, heure de la demande
- Bouton "✅ Valider" qui distribue le ticket
- Bouton "❌ Rejeter" qui expire la demande

---

## Codes USSD Mobile Money — Burkina Faso

| Opérateur | USSD transfert | Format avec montant | Notes |
|-----------|---------------|---------------------|-------|
| Orange Money | `*144#` | `*144*2*1*{destinataire}*{montant}#` | 2=Transfert, 1=Vers numéro |
| Moov Money | `*155#` | `*155*1*1*{destinataire}*{montant}#` | 1=Transfert, 1=Vers numéro |
| Telecel Money | `*100#` | `*100*1*1*{destinataire}*{montant}#` | 1=Transfert, 1=Vers numéro |
| Wave | App mobile | N/A (pas de USSD) | Montrer instructions "Ouvrir l'app Wave" |

**Important** : ces formats USSD peuvent changer si les opérateurs mettent à jour leurs menus. Prévoir une table `ussd_templates` en base pour pouvoir les modifier sans redéployer.

---

## Variables d'Environnement

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Africa's Talking (SMS)
AT_API_KEY=xxx
AT_USERNAME=sandbox
AT_SENDER_ID=TicketWiFi

# App
NEXT_PUBLIC_APP_URL=https://ticketswifizone.com
```

---

## Conventions de Code

- **Langue du code** : TypeScript strict, commentaires en français
- **Langue de l'UI** : Français uniquement (pas d'i18n pour le MVP)
- **Composants** : React Server Components par défaut, 'use client' uniquement si nécessaire
- **Styling** : Tailwind CSS, pas de CSS modules. shadcn/ui pour les composants de base.
- **Imports** : alias `@/` pour `src/`
- **API routes** : Next.js App Router route handlers (route.ts)
- **Erreurs** : try/catch avec logging, messages d'erreur user-friendly en français
- **Monnaie** : toujours en FCFA, formaté avec séparateur de milliers (ex: "1 500 F")
- **Numéros de téléphone** : format Burkina sans indicatif (8 chiffres : 70 12 34 56), stockés sans espaces en DB
- **Dates** : toujours en UTC en DB, affichées en heure de Ouagadougou (GMT+0)

---

## Dépendances npm

```json
{
  "dependencies": {
    "next": "^14.2",
    "@supabase/supabase-js": "^2",
    "@supabase/ssr": "^0.5",
    "africastalking": "^0.7",
    "qrcode": "^1.5",
    "csv-parse": "^5",
    "zod": "^3.22"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^18",
    "tailwindcss": "^3.4",
    "postcss": "^8",
    "autoprefixer": "^10",
    "@types/qrcode": "^1"
  }
}
```

---

## Validation avec Zod

Utiliser Zod pour valider toutes les entrées utilisateur :

```typescript
// schemas/purchase.ts
import { z } from 'zod';

export const initiateSchema = z.object({
  zoneId: z.string().uuid(),
  tarifId: z.string().uuid(),
  clientPhone: z.string().regex(/^\d{8}$/, 'Numéro à 8 chiffres requis'),
  operator: z.enum(['orange', 'moov', 'telecel', 'wave']),
});

// schemas/sms-webhook.ts
export const smsWebhookSchema = z.object({
  from: z.string(),
  body: z.string().min(10),
  receivedAt: z.string().optional(),
  token: z.string().min(32),
});

// schemas/ticket-upload.ts
export const ticketRowSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(3).max(50),
});
```

---

## Priorité d'Implémentation

Suivre cet ordre pour un développement incrémental fonctionnel :

### Sprint 1 — Fondations (3-4 jours)
1. Setup Next.js + Tailwind + shadcn/ui + Supabase
2. Migration DB (schéma complet)
3. Auth (inscription/connexion propriétaire)
4. Layout dashboard avec sidebar
5. CRUD zones (créer, lister, voir)

### Sprint 2 — Configuration (3-4 jours)
6. CRUD tarifs par zone
7. Upload CSV tickets (parse + insert)
8. Configuration méthodes de paiement par zone
9. Génération QR code par zone

### Sprint 3 — Page d'achat client (3-4 jours)
10. Page publique /zone/[zoneId]/buy
11. Sélection tarif + opérateur
12. Composant USSDPayButton (bouton one-click)
13. API /purchase/initiate (créer pending_request)
14. Écran d'attente avec polling

### Sprint 4 — Automatisation paiement (3-4 jours)
15. API /sms-webhook (réception SMS)
16. Parser SMS (regex Orange, Moov, Telecel, Wave)
17. Logique de matching + distribution ticket
18. Envoi SMS au client (Africa's Talking)
19. Realtime notification → écran succès
20. Validation manuelle (fallback dashboard)

### Sprint 5 — Polish & Différenciateurs (3-4 jours)
21. Dashboard stats (ventes du jour, revenus, graphique)
22. Alertes stock bas
23. Page settings avec setup SMS Forwarder
24. **Fichier portail captif MikroTik** (login.html personnalisable, téléchargeable)
25. **Page de récupération ticket** /zone/[zoneId]/recover
26. **Landing page marketing** avec message "Zéro commission" + comparaison concurrents
27. Tests end-to-end du flux complet
28. Responsive final + PWA manifest

---

## Notes Importantes

### Positionnement vs concurrents (CRITIQUE)
- **TOUJOURS mentionner "Zéro commission"** dans l'UI — c'est le message #1. Afficher "0% de frais" en badge visible sur la page d'achat et la landing page.
- **TOUJOURS mettre en avant le bouton USSD one-click** — il doit être spectaculaire visuellement (gros, coloré par opérateur, avec le code USSD affiché en clair).
- **La landing page doit comparer** (subtilement) notre approche vs les agrégateurs : "Pas de commission cachée, pas d'intermédiaire."
- **Le design doit être significativement plus moderne** que ticketswifizone.com (Galaxie Team) — c'est notre signal de qualité. Mobile-first, rapide, professionnel.

### Règles techniques MVP
- **Ne PAS implémenter LigdiCash/FedaPay/CinetPay** pour le MVP. Le SMS Forwarding est notre avantage compétitif. L'agrégateur viendra en Phase 2 comme option complémentaire.
- **Ne PAS implémenter l'API MikroTik directe**. L'upload CSV est suffisant pour le MVP.
- **Ne PAS implémenter le chatbot WhatsApp**. C'est Phase 3.
- **Ne PAS implémenter les abonnements payants** propriétaires. Tout est gratuit au MVP.
- **USSD one-click est la killer feature** côté client. Le bouton `tel:` doit être gros, visible, coloré.
- **Le SMS Forwarder est la killer feature** côté infrastructure. Documenter clairement son setup.
- **Tester avec de vrais SMS** dès que possible. Les regex de parsing doivent être validées avec des SMS réels de Orange Money, Moov Money, Telecel Money au Burkina.
- **Prévoir le fallback** : si le SMS forwarding ne matche pas, le propriétaire peut toujours valider manuellement depuis le dashboard.

### Livrables supplémentaires (différenciateurs)

#### 1. Fichier portail captif MikroTik (`public/captive-portal/login.html`)
Fournir un fichier HTML complet, responsive, prêt à uploader sur le routeur MikroTik. Ce fichier :
- S'intègre avec le système d'authentification Hotspot MikroTik (variables `$(link-login-only)`, `$(link-orig)`, `$(error)`)
- Affiche le nom de la zone WiFi et les tarifs
- Contient un QR code + lien direct vers notre page d'achat `/zone/[zoneId]/buy`
- Affiche un gros bouton "Acheter un ticket WiFi" pointant vers notre page
- A un formulaire de connexion (username/password) pour les clients qui ont déjà un code
- Design moderne, mobile-first, aux couleurs de la marque TicketWiFiZone
- Fonctionne 100% offline (pas de CDN externe, tout inline)
- Le propriétaire n'a qu'à remplacer UNE variable (l'URL de sa zone) pour personnaliser

Ce fichier doit être générable/téléchargeable depuis le dashboard, déjà personnalisé avec les infos de la zone.

#### 2. Page de récupération de ticket (`/zone/[zoneId]/recover`)
Si un client a payé mais n'a pas vu son code (fermeture navigateur, timeout, etc.), il peut entrer son numéro de téléphone pour retrouver son dernier ticket actif. Aucun concurrent ne propose ça proprement.

#### 3. Walled Garden simplifié
Contrairement aux concurrents qui nécessitent 4 domaines dans le Walled Garden, nous n'en avons besoin que d'un seul (`*ticketswifizone.com*`) car le paiement se fait via USSD (hors réseau data). C'est un argument de vente : "Configuration plus simple que les alternatives".

---

## Phase 2 — Roadmap post-MVP

Une fois le MVP validé avec 5-10 propriétaires réels :

1. **LigdiCash comme option supplémentaire** — Proposer le paiement via agrégateur EN PLUS du SMS Forwarding (pour les propriétaires qui préfèrent, ou pour Wave qui n'a pas de USSD)
2. **API MikroTik directe** — Connexion SSH/API au routeur pour créer les tickets à la volée (comme mana-zone.app), sans CSV
3. **Système de revendeurs** — Comme wifizoner.click, permettre à des revendeurs physiques de vendre des codes avec commission
4. **App mobile propriétaire** — Dashboard + notifications push + validation manuelle depuis l'app
5. **Analytics avancés** — Heures de pointe, tarifs optimaux, prédiction de stock
6. **Multi-pays** — Adapter les USSD templates pour Côte d'Ivoire, Mali, Sénégal, Togo
7. **Abonnement Pro** — Fonctionnalités premium payantes (analytics, multi-zone, support prioritaire)

