import { createClient } from '@supabase/supabase-js';

/**
 * Client Supabase avec le Service Role Key.
 * CONTOURNE le RLS — à utiliser uniquement dans les API routes serveur
 * pour des opérations administratives (webhook SMS, distribution tickets, etc.)
 *
 * NE JAMAIS exposer côté client.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
