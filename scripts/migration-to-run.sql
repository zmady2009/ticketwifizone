# ============================================================
# TicketWiFiZone — Migration SQL à exécuter dans le dashboard Supabase
# ============================================================
#
# Pour appliquer cette migration:
# 1. Allez sur https://supabase.com/dashboard
# 2. Sélectionnez votre projet: dnnwwexpmqhncnaizbfy
# 3. Allez dans SQL Editor
# 4. Créez une nouvelle requête
# 5. Copiez-collez tout le contenu ci-dessous
# 6. Cliquez sur "Run"
#
# Vous pouvez aussi exécuter ce fichier en une seule fois.

-- ============================================================
-- Extension pour UUID
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLE: profiles (extension de auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
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
CREATE TABLE IF NOT EXISTS public.zones (
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
CREATE TABLE IF NOT EXISTS public.zone_payment_methods (
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
CREATE TABLE IF NOT EXISTS public.tarifs (
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
CREATE TABLE IF NOT EXISTS public.tickets (
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
-- TABLE: pending_requests (demandes d'achat en attente)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pending_requests (
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
CREATE TABLE IF NOT EXISTS public.transactions (
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
CREATE TABLE IF NOT EXISTS public.sms_webhook_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLE: ussd_templates (formats USSD par pays/opérateur, modifiables)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ussd_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code TEXT NOT NULL DEFAULT 'BF',
  operator TEXT NOT NULL,
  format TEXT NOT NULL,
  display_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(country_code, operator)
);

-- Données par défaut Burkina Faso
INSERT INTO public.ussd_templates (country_code, operator, format, display_name) VALUES
  ('BF', 'orange',  '*144*2*1*{phone}*{amount}#', 'Orange Money'),
  ('BF', 'moov',    '*155*1*1*{phone}*{amount}#', 'Moov Money'),
  ('BF', 'telecel', '*100*1*1*{phone}*{amount}#', 'Telecel Money')
ON CONFLICT (country_code, operator) DO NOTHING;

-- ============================================================
-- INDEX
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_tickets_available ON tickets(zone_id, tarif_id, status) WHERE status = 'available';
CREATE INDEX IF NOT EXISTS idx_pending_active ON pending_requests(zone_id, client_phone, status) WHERE status = 'waiting_payment';
CREATE INDEX IF NOT EXISTS idx_pending_expires ON pending_requests(expires_at) WHERE status = 'waiting_payment';
CREATE INDEX IF NOT EXISTS idx_transactions_zone ON transactions(zone_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_zones_owner ON zones(owner_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE zone_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarifs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_webhook_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE ussd_templates ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "profiles_own" ON profiles FOR ALL USING (id = auth.uid());

-- Zones
CREATE POLICY "zones_owner" ON zones FOR ALL USING (owner_id = auth.uid());

-- Payment methods
CREATE POLICY "payment_methods_owner" ON zone_payment_methods FOR ALL
  USING (zone_id IN (SELECT id FROM zones WHERE owner_id = auth.uid()));
CREATE POLICY "payment_methods_public_read" ON zone_payment_methods FOR SELECT
  USING (is_active = true);

-- Tarifs
CREATE POLICY "tarifs_owner" ON tarifs FOR ALL
  USING (zone_id IN (SELECT id FROM zones WHERE owner_id = auth.uid()));
CREATE POLICY "tarifs_public_read" ON tarifs FOR SELECT USING (is_active = true);

-- Tickets
CREATE POLICY "tickets_owner" ON tickets FOR ALL
  USING (zone_id IN (SELECT id FROM zones WHERE owner_id = auth.uid()));

-- Pending requests (public insert + select, owner update)
CREATE POLICY "pending_public_insert" ON pending_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "pending_public_select" ON pending_requests FOR SELECT USING (true);
CREATE POLICY "pending_service_update" ON pending_requests FOR UPDATE USING (true);

-- Transactions
CREATE POLICY "transactions_owner" ON transactions FOR ALL
  USING (zone_id IN (SELECT id FROM zones WHERE owner_id = auth.uid()));
CREATE POLICY "transactions_service_insert" ON transactions FOR INSERT WITH CHECK (true);

-- SMS tokens
CREATE POLICY "sms_tokens_owner" ON sms_webhook_tokens FOR ALL USING (owner_id = auth.uid());

-- USSD templates (lecture publique)
CREATE POLICY "ussd_public_read" ON ussd_templates FOR SELECT USING (is_active = true);

-- ============================================================
-- FONCTIONS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS zones_updated_at ON zones;
CREATE TRIGGER zones_updated_at BEFORE UPDATE ON zones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Créer profil auto quand un user s'inscrit
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Stats tickets disponibles par tarif
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

-- Expirer les vieilles pending_requests
CREATE OR REPLACE FUNCTION expire_old_requests()
RETURNS void AS $$
  UPDATE pending_requests
  SET status = 'expired'
  WHERE status = 'waiting_payment' AND expires_at < now();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Stats journalières pour le dashboard
CREATE OR REPLACE FUNCTION get_daily_stats(p_owner_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(
  total_sales BIGINT,
  total_revenue BIGINT,
  total_tickets_available BIGINT,
  total_zones BIGINT
) AS $$
  SELECT
    (SELECT COUNT(*) FROM transactions t
     JOIN zones z ON t.zone_id = z.id
     WHERE z.owner_id = p_owner_id AND t.created_at::date = p_date) AS total_sales,
    (SELECT COALESCE(SUM(t.amount_fcfa), 0) FROM transactions t
     JOIN zones z ON t.zone_id = z.id
     WHERE z.owner_id = p_owner_id AND t.created_at::date = p_date) AS total_revenue,
    (SELECT COUNT(*) FROM tickets tk
     JOIN zones z ON tk.zone_id = z.id
     WHERE z.owner_id = p_owner_id AND tk.status = 'available') AS total_tickets_available,
    (SELECT COUNT(*) FROM zones WHERE owner_id = p_owner_id AND is_active = true) AS total_zones;
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================================
-- REALTIME : activer pour pending_requests (notifications client)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE pending_requests;
