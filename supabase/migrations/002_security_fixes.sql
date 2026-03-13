-- ============================================================
-- Migration 002: Security fixes
-- - Restrict pending_requests RLS
-- - Add cleanup function for expired requests
-- - Add index for cleanup
-- ============================================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "pending_public_insert" ON pending_requests;
DROP POLICY IF EXISTS "pending_service_update" ON pending_requests;

-- New INSERT: public can insert but only with valid constraints
CREATE POLICY "pending_validated_insert" ON pending_requests
  FOR INSERT WITH CHECK (
    status = 'waiting_payment'
    AND amount_fcfa > 0
    AND expires_at > now()
    AND zone_id IN (SELECT id FROM zones WHERE is_active = true)
  );

-- SELECT: keep public read (needed for purchase/check polling)
-- The existing policy is fine

-- UPDATE: NO public policy = only service_role (admin client) can update
-- sms-webhook and purchase/check use createAdminClient() which bypasses RLS

-- Owner can view their zone's pending requests in dashboard
CREATE POLICY "pending_owner_all" ON pending_requests
  FOR ALL USING (
    zone_id IN (SELECT id FROM zones WHERE owner_id = auth.uid())
  );

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_pending_expired_cleanup
  ON pending_requests(status, expires_at)
  WHERE status = 'waiting_payment';

-- Function to clean up expired pending_requests
CREATE OR REPLACE FUNCTION cleanup_expired_requests()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE pending_requests
  SET status = 'expired'
  WHERE status = 'waiting_payment'
    AND expires_at < now();

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- To enable automatic cleanup, enable pg_cron in Supabase Dashboard
-- (Database > Extensions > pg_cron), then run:
--
-- SELECT cron.schedule(
--   'cleanup-expired-requests',
--   '*/5 * * * *',
--   $$SELECT cleanup_expired_requests()$$
-- );
