# Architecture TicketWiFiZone - Lien Web + Mobile

## Vue d'ensemble

Le système TicketWiFiZone se compose de deux applications connectées :

1. **Application Web** (https://ticketswifizone.com) - Dashboard propriétaires + API backend
2. **Application Mobile Android** (TWZForwarder) - Forwarding automatique des SMS Mobile Money

## Flux de connexion

### 1. Création du compte (Web)
Le propriétaire crée un compte sur https://ticketswifizone.com/register
- Email + password
- Nom du business

### 2. Première connexion (Mobile)
Le propriétaire ouvre l'app TWZForwarder et entre ses identifiants :
- Email : le même que sur le web
- Password : le même que sur le web

L'app appelle `POST /api/auth/app-login` et reçoit :
- `token` : JWT Supabase pour les futures requêtes
- `webhookToken` : Token unique (64 caractères hex) pour authentifier les SMS forwardés
- `zones` : Liste des zones WiFi du propriétaire

### 3. Configuration automatique
Le webhook token est automatiquement configuré dans l'app Android. Le propriétaire peut le voir dans :
- Dashboard web : https://ticketswifizone.com/dashboard/settings
- App Android : Menu Settings (affichage seulement)

## Flux de paiement SMS

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT                                   │
│  1. Paie via Mobile Money (Orange/Moov/Telecel)                │
│     Ex: 200 FCFA au numéro 70 12 34 56                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              TÉLÉPHONE PROPRIÉTAIRE (Android)                   │
│  2. Reçoit le SMS de confirmation Mobile Money                 │
│     "Vous avez recu 200 FCFA de 70 12 34 56..."                 │
│  3. App TWZForwarder intercepte le SMS (BroadcastReceiver)      │
│  4. Parse le SMS :                                              │
│     - Expéditeur : "OrangeMoney"                                │
│     - Montant : 200 FCFA                                        │
│     - Client : 70 12 34 56                                      │
│  5. Envoie au serveur :                                         │
│     POST /api/sms-webhook                                       │
│     Headers: Authorization: Bearer {webhookToken}               │
│     Body: { from, message, receivedAt, sim }                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SERVEUR WEB (Next.js)                        │
│  6. Valide le webhookToken dans sms_webhook_tokens              │
│  7. Parse le SMS avec regex (opérateur + montant + numéro)     │
│  8. Cherche une pending_request qui match :                     │
│     - zone_id appartient au propriétaire                        │
│     - amount_fcfa == 200                                        │
│     - client_phone == "70123456"                                │
│     - status == 'waiting_payment'                               │
│     - expires_at > now()                                        │
│  9. Si match trouvé :                                           │
│     a. Récupère un ticket disponible (status='available')       │
│     b. UPDATE ticket → status='sold', buyer_phone, sold_at      │
│     c. UPDATE pending_request → status='completed'              │
│     d. Envoie SMS au client via Africa's Talking                │
│     e. INSERT dans transactions (historique)                    │
│     f. Broadcast Realtime (notification instantanée)            │
│  10. Répond à l'app Android :                                   │
│      { matched: true, ticket: {username: "wifi_001"}, ... }     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CLIENT (reçoit le code)                       │
│  11. Reçoit SMS avec le code WiFi                               │
│      "Votre code WiFi: username=wifi_001, password=xyz123"       │
│  12. Se connecte au hotspot et entre le code                    │
│  13. Accès Internet accordé !                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Schémas API

### POST /api/auth/app-login
**Authentification de l'app mobile Android**

```json
// Requête
{
  "email": "proprio@example.com",
  "password": "password123"
}

// Réponse (200 OK)
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", // JWT Supabase
  "user": {
    "id": "uuid-user-profil",
    "email": "proprio@example.com",
    "businessName": "Ma WiFi Zone"
  },
  "zones": [
    {
      "id": "zone-uuid-1",
      "name": "Zone Cissin",
      "webhookToken": "abc123def456..." // 64 caractères hex
    }
  ]
}

// Erreur (401)
{
  "error": "Email ou mot de passe incorrect"
}
```

### POST /api/sms-webhook
**Réception des SMS Mobile Money depuis l'app Android**

```json
// Requête
Headers:
  Authorization: Bearer abc123def456...
  Content-Type: application/json

Body:
{
  "from": "OrangeMoney",
  "message": "Vous avez recu 200 FCFA de 70 12 34 56. Votre solde est de 15430 FCFA.",
  "receivedAt": "2026-03-12T10:30:00Z",
  "sim": 0
}

// Réponse - Succès avec match (200 OK)
{
  "matched": true,
  "requestId": "pending-request-uuid",
  "zoneId": "zone-uuid-1",
  "zoneName": "Zone Cissin",
  "ticket": {
    "username": "wifi_user_001"
  },
  "smsSent": true
}

// Réponse - SMS non reconnu (200 OK)
{
  "matched": false,
  "reason": "not_payment_sms"
}

// Réponse - Pas de pending_request trouvée (200 OK)
{
  "matched": false,
  "reason": "no_matching_request",
  "searchCriteria": {
    "amount": 200,
    "clientPhone": "70123456",
    "zoneCount": 3,
    "pendingCount": 0
  }
}

// Erreur - Token invalide (401)
{
  "error": "Token invalide ou inactif"
}
```

### POST /api/sms-webhook/test
**Test de connexion du webhook (bouton "Tester la connexion")**

```json
// Requête
{
  "token": "abc123def456..."
}

// Réponse - Succès (200 OK)
{
  "success": true,
  "message": "Connexion réussie !",
  "profile": {
    "email": "proprio@example.com",
    "businessName": "Ma WiFi Zone"
  },
  "zones": [
    {
      "id": "zone-uuid-1",
      "name": "Zone Cissin",
      "is_active": true
    }
  ],
  "lastUsed": "2026-03-12T09:15:00Z"
}

// Erreur - Token invalide (401)
{
  "error": "Token invalide ou inactif"
}
```

## Sécurité

### Webhook Token
- **Génération** : 64 caractères hexadécimaux (encode(gen_random_bytes(32), 'hex'))
- **Stockage** : Table `sms_webhook_tokens` en base de données
- **Utilisation** : Header `Authorization: Bearer {webhookToken}` dans les requêtes SMS
- **Rotation** : Le propriétaire peut régénérer le token depuis le dashboard web
- **Validité** : Un token par propriétaire, partagé entre toutes ses zones

### JWT Token (Supabase Auth)
- **Durée** : 1 heure (renouvellement automatique dans l'app Android)
- **Utilisation** : Authentification des requêtes API depuis l'app mobile
- **Refresh** : Supabase gère automatiquement le refresh token

### Rate Limiting
- **Login** : 10 tentatives/heure par email (mémoire serveur)
- **Webhook** : Pas de rate limiting (doit supporter les pics de SMS)

## Base de données

### Tables principales

```sql
-- sms_webhook_tokens : Tokens pour authentifier les SMS forwarding
CREATE TABLE sms_webhook_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- pending_requests : Demandes d'achat en attente de paiement
CREATE TABLE pending_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID REFERENCES zones(id) ON DELETE CASCADE,
  tarif_id UUID REFERENCES tarifs(id) ON DELETE CASCADE,
  client_phone TEXT NOT NULL,
  operator TEXT NOT NULL,
  amount_fcfa INTEGER NOT NULL,
  status TEXT DEFAULT 'waiting_payment',
  ticket_id UUID REFERENCES tickets(id),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '10 minutes'),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- tickets : Pool de codes WiFi
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID REFERENCES zones(id) ON DELETE CASCADE,
  tarif_id UUID REFERENCES tarifs(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  status TEXT DEFAULT 'available',
  buyer_phone TEXT,
  sold_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(zone_id, username)
);

-- transactions : Historique des ventes
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID REFERENCES zones(id) ON DELETE CASCADE,
  tarif_id UUID REFERENCES tarifs(id),
  ticket_id UUID REFERENCES tickets(id),
  pending_request_id UUID REFERENCES pending_requests(id),
  amount_fcfa INTEGER NOT NULL,
  buyer_phone TEXT NOT NULL,
  operator TEXT NOT NULL,
  sms_ref TEXT,
  validation_method TEXT DEFAULT 'sms_forward',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Parsing SMS

### Regex par opérateur (Burkina Faso)

```typescript
const PATTERNS = {
  orange: /recu\s+(\d[\d\s]*?)\s*FCFA.*?(\d{2}\s*\d{2}\s*\d{2}\s*\d{2})/i,
  moov: /recu:?\s*(\d[\d\s]*?)\s*FCFA.*?(\d{2}\s*\d{2}\s*\d{2}\s*\d{2})/i,
  telecel: /recu\s+(\d[\d\s]*?)\s*FCFA.*?(\d{2}\s*\d{2}\s*\d{2}\s*\d{2})/i,
  wave: /recu\s+(\d[\d\s]*?)\s*FCFA.*?\((\d{2}\s*\d{2}\s*\d{2}\s*\d{2})\)/i,
}

// Format extrait :
{
  amount: 200,           // Montant en FCFA (sans espaces)
  senderPhone: "70123456", // Numéro à 8 chiffres (sans espaces)
  operator: 'orange'     // Opérateur détecté
}
```

## Environnements

### Développement
- **URL API** : `http://10.0.2.2:3010` (depuis l'émulateur Android)
- **Dashboard** : `http://localhost:3010/dashboard`
- **Build Android** : `./gradlew assembleDebug`

### Production
- **URL API** : `https://ticketswifizone.com`
- **Dashboard** : `https://ticketswifizone.com/dashboard`
- **Build Android** : `./gradlew assembleRelease`

Note : `10.0.2.2` est l'alias spécial pour accéder à `localhost` de la machine hôte depuis l'émulateur Android.

## Monitoring & Debugging

### Logs côté serveur
- Tous les webhooks SMS sont loggés avec le token partiel (masqué)
- Les SMS non parsés sont loggés pour ajuster les regex
- Les erreurs de matching sont loggées avec les critères de recherche

### Logs côté app Android
- Timber logcat en debug : `Timber.plant(Timber.DebugTree())`
- Historique des SMS stocké dans Room Database
- Notifications de succès/échec avec détails

## Dépannage

### L'app ne reçoit pas les SMS
- Vérifier que l'app a la permission READ_SMS
- Vérifier que le SmsReceiver est enregistré dans AndroidManifest.xml
- Vérifier que le téléphone n'est pas en mode "Do not disturb"

### Le webhook retourne "Token invalide"
- Régénérer le token depuis le dashboard web
- Se reconnecter depuis l'app Android (récupère le nouveau token)
- Vérifier que l'URL de base est correcte (dev vs prod)

### Les SMS ne matchent pas avec les pending_requests
- Vérifier que le numéro de téléphone est au même format (8 chiffres)
- Vérifier que le montant est exactement le même
- Vérifier que la demande n'a pas expiré (10 minutes)
- Consulter les logs serveur pour voir les critères de recherche

## Fichiers clés

### Application Android (TWZForwarder)
- `app/src/main/java/com/ticketswifizone/forwarder/util/Constants.kt` - URL de base + endpoints
- `app/build.gradle.kts` - Configuration dev/prod (BuildConfig)
- `app/src/main/java/com/ticketswifizone/forwarder/service/SmsReceiver.kt` - Réception SMS
- `app/src/main/java/com/ticketswifizone/forwarder/service/ForwardService.kt` - Forwarding

### Application Web (TicketWiFiZone)
- `src/app/api/auth/app-login/route.ts` - Login app mobile
- `src/app/api/sms-webhook/route.ts` - Réception SMS
- `src/app/api/sms-webhook/test/route.ts` - Test webhook
- `src/app/dashboard/settings/page.tsx` - Configuration webhook token
- `src/lib/sms/parser.ts` - Parsing SMS Mobile Money
