/**
 * Script pour vérifier si les tables existent réellement
 * en tentant de requêter chaque table
 */

require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

async function checkTables() {
  console.log('📋 Vérification des tables Supabase...\n');
  console.log('📍 Projet:', SUPABASE_URL);

  let existingCount = 0;

  for (const table of tables) {
    try {
      // Tenter une requête SELECT
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?limit=0`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      });

      // 200 OK ou 406 Not Acceptable (mais table existe) = table existe
      // 404 Not Found = table n'existe pas
      if (response.status === 404) {
        console.log(`  ❌ ${table} - NON CRÉÉE`);
      } else {
        console.log(`  ✅ ${table} - CRÉÉE`);
        existingCount++;
      }
    } catch (err) {
      console.log(`  ❓ ${table} - Erreur: ${err.message}`);
    }
  }

  console.log(`\n📊 Résultat: ${existingCount}/${tables.length} tables créées\n`);

  if (existingCount === tables.length) {
    console.log('✨ Toutes les tables sont créées! Migration terminée avec succès!\n');
  } else if (existingCount > 0) {
    console.log('⚠️  Certaines tables sont créées, mais pas toutes.');
    console.log('   Vérifiez que vous avez exécuté TOUT le SQL dans le dashboard.\n');
  } else {
    console.log('❌ Aucune table trouvée.');
    console.log('   Veuillez appliquer la migration complète:\n');
    console.log('   1. Allez sur: https://supabase.com/dashboard/project/dnnwwexpmqhncnaizbfy/sql/new');
    console.log('   2. Copiez le contenu de: scripts/migration-to-run.sql');
    console.log('   3. Collez et cliquez sur "Run"\n');
  }
}

checkTables().catch(console.error);
