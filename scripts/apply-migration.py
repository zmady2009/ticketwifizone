#!/usr/bin/env python3
"""
Script pour appliquer la migration SQL à Supabase

Usage: python scripts/apply-migration.py

Ce script va:
1. Demander le mot de passe PostgreSQL
2. Se connecter à Supabase
3. Appliquer la migration SQL complète
4. Vérifier que toutes les tables sont créées
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

try:
    import psycopg
    from psycopg.rows import dict_row
except ImportError:
    print("❌ psycopg3 n'est pas installé")
    print("Installez-le avec: pip install psycopg[binary] python-dotenv")
    sys.exit(1)

# Charger les variables d'environnement
load_dotenv('.env.local')

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
if not SUPABASE_URL:
    print("❌ NEXT_PUBLIC_SUPABASE_URL non trouvé dans .env.local")
    sys.exit(1)

# Extraire le project reference
match = SUPABASE_URL.split('https://')[1].split('.supabase.co')[0]
project_ref = match

print(f"\n📤 Application de la migration SQL à Supabase")
print(f"📍 Projet: {project_ref}")
print(f"\nVous aurez besoin de votre mot de passe PostgreSQL.")
print(f"Récupérez-le depuis: https://supabase.com/dashboard/project/{project_ref}/settings/database\n")

# Demander le mot de passe
db_password = input("Entrez le mot de passe PostgreSQL: ").strip()
if not db_password:
    print("❌ Mot de passe requis")
    sys.exit(1)

# Chaîne de connexion
conn_string = f"postgresql://postgres:{db_password}@db.{project_ref}.supabase.co:5432/postgres?sslmode=require"

print("\n🔗 Connexion à la base de données...")

try:
    # Connexion
    conn = psycopg.connect(conn_string, autocommit=False)
    conn.row_factory = dict_row
    cursor = conn.cursor()

    print("✅ Connecté!\n")

    # Lire le fichier de migration
    migration_path = Path(__file__).parent.parent / 'supabase' / 'migrations' / '001_initial_schema.sql'
    with open(migration_path, 'r', encoding='utf-8') as f:
        migration_sql = f.read()

    print("📜 Exécution de la migration... (peut prendre quelques secondes)\n")

    # Exécuter la migration
    cursor.execute(migration_sql)
    conn.commit()

    print("✅ Migration appliquée avec succès!\n")

    # Vérifier les tables
    print("📋 Vérification des tables créées:\n")

    tables = [
        'profiles',
        'zones',
        'zone_payment_methods',
        'tarifs',
        'tickets',
        'pending_requests',
        'transactions',
        'sms_webhook_tokens',
        'ussd_templates',
    ]

    cursor.execute("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
    """)

    existing_tables = {row['table_name'] for row in cursor.fetchall()}

    all_good = True
    for table in tables:
        if table in existing_tables:
            print(f"   ✅ {table}")
        else:
            print(f"   ❌ {table} - MANQUANTE")
            all_good = False

    cursor.close()
    conn.close()

    if all_good:
        print("\n✨ Migration terminée avec succès!")
        print("   Toutes les tables sont créées.\n")
    else:
        print("\n⚠️  Certaines tables manquent.")
        print("   Vérifiez les erreurs ci-dessus.\n")

except Exception as err:
    print(f"\n❌ Erreur: {err}")
    if "password authentication failed" in str(err):
        print("   Le mot de passe PostgreSQL est incorrect.")
        print(f"   Récupérez-le depuis: https://supabase.com/dashboard/project/{project_ref}/settings/database")
    sys.exit(1)
