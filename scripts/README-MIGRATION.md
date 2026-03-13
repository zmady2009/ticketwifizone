# 📤 Instructions pour appliquer la migration SQL Supabase

## Option 1 : Via le Dashboard Supabase (RECOMMANDÉ)

1. **Ouvrez le SQL Editor** dans votre navigateur :
   - Allez sur : https://supabase.com/dashboard/project/dnnwwexpmqhncnaizbfy/sql/new

2. **Copiez le contenu du fichier de migration** :
   - Le fichier se trouve dans : `scripts/migration-to-run.sql`
   - Vous pouvez l'ouvrir avec un éditeur de texte et tout sélectionner (Ctrl+A)

3. **Collez le SQL dans l'éditeur** du dashboard

4. **Cliquez sur le bouton "Run"** en bas à droite

5. **Vérifiez que toutes les tables sont créées** :
   - Allez dans : https://supabase.com/dashboard/project/dnnwwexpmqhncnaizbfy/database/tables
   - Vous devriez voir : profiles, zones, zone_payment_methods, tarifs, tickets, pending_requests, transactions, sms_webhook_tokens, ussd_templates

---

## Option 2 : Via la ligne de commande (requiert Python)

1. **Installez les dépendances Python** (si pas déjà installé) :
   ```bash
   pip install psycopg2-binary python-dotenv
   ```

2. **Lancez le script** :
   ```bash
   python scripts/apply-migration.py
   ```

3. **Entrez votre mot de passe PostgreSQL** quand demandé :
   - Récupérez-le depuis : https://supabase.com/dashboard/project/dnnwwexpmqhncnaizbfy/settings/database
   - Section "Connection string" > "URI"
   - Le mot de passe est après `postgresql://postgres:`

---

## Option 3 : Via psql (si installé)

1. **Exécutez** :
   ```bash
   psql "postgresql://postgres:[MOT_DE_PASSE]@db.dnnwwexpmqhncnaizbfy.supabase.co:5432/postgres?sslmode=require" -f supabase/migrations/001_initial_schema.sql
   ```

---

## Vérification après migration

Une fois la migration appliquée, vous devriez voir ces tables dans le dashboard :

- ✅ **profiles** - Profils utilisateurs
- ✅ **zones** - Zones WiFi
- ✅ **zone_payment_methods** - Méthodes de paiement Mobile Money
- ✅ **tarifs** - Tarifs par zone
- ✅ **tickets** - Tickets WiFi disponibles
- ✅ **pending_requests** - Demandes d'achat en attente
- ✅ **transactions** - Historique des ventes
- ✅ **sms_webhook_tokens** - Tokens pour le SMS Forwarder
- ✅ **ussd_templates** - Templates USSD par opérateur

---

## Si vous rencontrez des erreurs

- **"permission denied"** : Vérifiez que vous utilisez bien le project ID `dnnwwexpmqhncnaizbfy`
- **"table already exists"** : C'est normal si vous avez déjà appliqué la migration partiellement
- **"connection refused"** : Vérifiez votre mot de passe PostgreSQL
