# 🚀 Instructions Rapides : Appliquer la Migration Supabase

## 📋 État Actuel
Les tables ne sont pas encore créées dans votre projet Supabase.

## ✅ Solution la plus simple (2 minutes)

### 1. Ouvrez le SQL Editor Supabase
Cliquez directement sur ce lien :
**https://supabase.com/dashboard/project/dnnwwexpmqhncnaizbfy/sql/new**

### 2. Copiez le contenu SQL
Ouvrez ce fichier dans votre éditeur :
**`scripts/migration-to-run.sql`**

Sélectionnez tout (Ctrl+A) et copiez (Ctrl+C)

### 3. Collez et exécutez
- Collez dans l'éditeur SQL du dashboard (Ctrl+V)
- Cliquez sur le bouton **"Run"** en bas à droite
- Attendez que toutes les commandes s'exécutent (vous devriez voir des ✅)

### 4. Vérifiez
Allez sur : https://supabase.com/dashboard/project/dnnwwexpmqhncnaizbfy/database/tables

Vous devriez voir ces tables :
- ✅ profiles
- ✅ zones
- ✅ zone_payment_methods
- ✅ tarifs
- ✅ tickets
- ✅ pending_requests
- ✅ transactions
- ✅ sms_webhook_tokens
- ✅ ussd_templates

---

## 🔄 Si vous préférez automatiser (Python)

```bash
# Installation
pip install psycopg[binary] python-dotenv

# Exécution
python scripts/apply-migration.py
```

Entrez votre mot de passe PostgreSQL depuis :
https://supabase.com/dashboard/project/dnnwwexpmqhncnaizbfy/settings/database

---

## ✅ Une fois terminé

Revenez me dire "migration terminée" et je continuerai avec le Sprint 2 (tarifs, tickets, paiement).
