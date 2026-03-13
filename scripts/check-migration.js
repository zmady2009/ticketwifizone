/**
 * Script pour appliquer la migration SQL via l'API Supabase
 * Utilise les commandes SQL via l'endpoint RPC execute
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Pour l'API REST, on peut utiliser l'anon_key pour certaines opérations
// Mais pour les migrations, il faut le service_role_key
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL non trouvé');
  process.exit(1);
}

// Fonction pour exécuter du SQL via l'API Supabase
async function executeSQL(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'params=single-object',
    },
    body: JSON.stringify({ query: sql }),
  });

  const text = await response.text();
  if (!response.ok && !text.includes('already exists')) {
    throw new Error(`HTTP ${response.status}: ${text}`);
  }
  return text;
}

async function checkTable(tableName) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?limit=1`, {
    method: 'GET',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
  });
  // 406 ou 200 = table existe
  return response.ok || response.status === 406;
}

async function applyMigration() {
  console.log('📤 Application de la migration SQL via API Supabase...\n');
  console.log('📍 Projet:', SUPABASE_URL);

  // Vérifier les tables existantes
  const tables = [
    'profiles',
    'zones',
    'zone_payment_methods',
    'tarifs',
    'tickets',
    'pending_requests',
    'transactions',
    'sms_webhook_tokens',
    'ussd_templates',
  ];

  console.log('📋 Vérification des tables existantes...\n');
  for (const table of tables) {
    const exists = await checkTable(table);
    console.log(`  ${exists ? '✅' : '❌'} ${table}`);
  }

  console.log('\n⚠️  Note: L\'API REST ne peut pas créer de tables.');
  console.log('📝 Pour appliquer la migration complète, utilisez une de ces méthodes:\n');

  console.log('  OPTION 1 (Dashboard - Recommandée):');
  console.log('  1. Allez sur: https://supabase.com/dashboard/project/dnnwwexpmqhncnaizbfy/sql/new');
  console.log('  2. Ouvrez: scripts/migration-to-run.sql');
  console.log('  3. Copiez-collez tout le SQL');
  console.log('  4. Cliquez "Run"\n');

  console.log('  OPTION 2 (Python):');
  console.log('  pip install psycopg[binary] python-dotenv');
  console.log('  python scripts/apply-migration.py\n');

  console.log('  OPTION 3 (Node.js):');
  console.log('  node scripts/apply-migration.js\n');

  console.log('  OPTION 4 (psql):');
  console.log('  psql "postgresql://postgres:[PASSWORD]@db.dnnwwexpmqhncnaizbfy.supabase.co:5432/postgres" -f supabase/migrations/001_initial_schema.sql\n');
}

applyMigration().catch(console.error);
