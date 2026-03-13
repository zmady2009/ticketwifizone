/**
 * Script pour appliquer la migration SQL à Supabase
 *
 * DEUX MÉTHODES:
 *
 * MÉTHODE 1 (Manuelle - recommandée):
 * 1. Allez sur https://supabase.com/dashboard/project/dnnwwexpmqhncnaizbfy/sql
 * 2. Copiez le contenu de scripts/migration-to-run.sql
 * 3. Collez dans l'éditeur SQL
 * 4. Cliquez sur "Run"
 *
 * MÉTHODE 2 (Automatique avec ce script):
 * 1. Récupérez votre mot de passe PostgreSQL:
 *    - Dashboard > Settings > Database > Connection String
 *    - Copiez le mot de passe après "postgresql://postgres:"
 * 2. Lancez: node scripts/apply-migration.js
 * 3. Entrez le mot de passe quand demandé
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!SUPABASE_URL) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL non trouvé dans .env.local');
  process.exit(1);
}

// Extraire le project reference
const match = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/);
if (!match) {
  console.error('❌ URL Supabase invalide');
  process.exit(1);
}
const projectRef = match[1];

async function main() {
  console.log('\n📤 Application de la migration SQL à Supabase');
  console.log('📍 Projet:', projectRef);
  console.log('\nVous avez DEUX options:\n');
  console.log('  OPTION 1 (Manuelle - Recommandée):');
  console.log('  1. Allez sur: https://supabase.com/dashboard/project/' + projectRef + '/sql');
  console.log('  2. Ouvrez le fichier: scripts/migration-to-run.sql');
  console.log('  3. Copiez-collez le contenu dans l\'éditeur SQL');
  console.log('  4. Cliquez sur "Run"\n');
  console.log('  OPTION 2 (Automatique):');
  console.log('  Vous aurez besoin de votre mot de passe PostgreSQL');
  console.log('  Dashboard > Settings > Database > Connection String > Copy\n');

  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const choice = await new Promise(resolve => {
    rl.question('Quelle option choisissez-vous ? (1/2) [1]: ', ans => resolve(ans || '1'));
  });
  rl.close();

  if (choice === '1') {
    console.log('\n✅ Utilisez le fichier scripts/migration-to-run.sql');
    console.log('🔗 Lien direct: https://supabase.com/dashboard/project/' + projectRef + '/sql\n');
    return;
  }

  // Option 2: Automatique
  const rl2 = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const dbPassword = await new Promise(resolve => {
    rl2.question('\nEntrez le mot de passe PostgreSQL: ', resolve);
  });
  rl2.close();

  if (!dbPassword) {
    console.log('❌ Mot de passe requis. Utilisez l\'option 1.');
    return;
  }

  const connectionString = `postgresql://postgres:${dbPassword}@db.${projectRef}.supabase.co:5432/postgres?sslmode=require`;

  console.log('\n🔗 Connexion à la base de données...');

  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ Connecté!\n');

    // Lire le fichier de migration
    const migrationPath = path.join(__dirname, '../supabase/migrations/001_initial_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📜 Exécution de la migration... (cela peut prendre quelques secondes)\n');

    // Exécuter la migration complète
    await client.query(migrationSQL);

    console.log('✅ Migration appliquée avec succès!\n');

    // Vérifier les tables
    console.log('📋 Tables créées:\n');
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

    let allGood = true;
    for (const table of tables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = $1
        );
      `, [table]);

      if (result.rows[0].exists) {
        console.log(`   ✅ ${table}`);
      } else {
        console.log(`   ❌ ${table} - MANQUANTE`);
        allGood = false;
      }
    }

    if (allGood) {
      console.log('\n✨ Migration terminée avec succès!');
      console.log('   Toutes les tables sont créées.\n');
    } else {
      console.log('\n⚠️  Certaines tables manquent. Vérifiez les erreurs ci-dessus.\n');
    }

  } catch (err) {
    console.error('\n❌ Erreur:', err.message);
    if (err.message.includes('password authentication failed')) {
      console.error('   Le mot de passe PostgreSQL est incorrect.');
      console.error('   Récupérez-le depuis: Dashboard > Settings > Database > Connection String');
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch(err => {
  console.error('Erreur:', err);
  process.exit(1);
});
