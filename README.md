# TicketWiFiZone

> Plateforme SaaS de vente automatique de tickets WiFi via Mobile Money pour l'Afrique.

[![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green?style=flat&logo=supabase)](https://supabase.com/)

## 🚀 Description

TicketWiFiZone permet aux propriétaires de WiFi Zone en Afrique (principalement Burkina Faso, zone UEMOA) de vendre automatiquement des tickets d'accès WiFi via paiement Mobile Money (Orange Money, Moov Money, Telecel Money, Wave).

### Le problème résolu

Aujourd'hui, les propriétaires de WiFi Zone vendent manuellement les tickets : le client paie via Mobile Money, envoie le reçu par WhatsApp, et le propriétaire lui envoie le code. C'est lent, non-scalable, et impossible la nuit. TicketWiFiZone automatise tout ce processus.

### Fonctionnalités clés

- **🎯 Paiement USSD One-Click** — Le client tape un bouton → le dialer s'ouvre avec le code USSD pré-rempli → il entre son PIN → c'est payé. 2 interactions au lieu de 5 écrans.
- **💰 Zéro commission** — Grâce au SMS Forwarding, le paiement va directement du client au propriétaire via transfert Mobile Money standard.
- **📱 Portail captif prêt à l'emploi** — Fichier HTML professionnel et responsive avec le QR code et les boutons de paiement intégrés.
- **🆓 Offre 100% gratuite au démarrage** — Pas de kit à acheter, pas d'abonnement, pas de commission.

## 🛠️ Stack Technique

| Couche | Technologie |
|--------|-------------|
| Frontend | **Next.js 14+ (App Router)** |
| Styling | **Tailwind CSS + shadcn/ui** |
| Backend/BaaS | **Supabase** (Auth, PostgreSQL, Edge Functions, Realtime) |
| Base de données | **PostgreSQL** |
| Notifications SMS | **Africa's Talking** |
| QR Code | **qrcode (npm)** |
| Déploiement | **Vercel** (front) + **Supabase Cloud** (back) |
| Langage | **TypeScript** |

## 📋 Prérequis

- Node.js 20+
- pnpm, npm ou yarn
- Un compte Supabase (gratuit)
- Un compte Africa's Talking (optionnel, pour les SMS)

## 🔧 Installation

1. **Cloner le repository**
   ```bash
   git clone https://github.com/yourusername/ticketwifizone.git
   cd ticketwifizone
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement**
   ```bash
   cp .env.local.example .env.local
   ```

   Puis remplir les variables :
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...

   # Africa's Talking (SMS)
   AT_API_KEY=xxx
   AT_USERNAME=sandbox
   AT_SENDER_ID=TicketWiFi

   # App
   NEXT_PUBLIC_APP_URL=https://ticketswifizone.com
   ```

4. **Lancer les migrations Supabase**
   ```bash
   # Appliquer le schéma de base de données
   npx supabase db push
   ```

5. **Lancer le serveur de développement**
   ```bash
   npm run dev
   ```

   Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 📁 Structure du Projet

```
ticketwifizone/
├── src/
│   ├── app/                    # Pages Next.js (App Router)
│   │   ├── (auth)/            # Pages d'authentification
│   │   ├── dashboard/         # Dashboard propriétaire
│   │   ├── zone/[zoneId]/     # Pages client (achat, récupération)
│   │   └── api/               # API routes
│   ├── components/            # Composants React
│   │   ├── ui/                # shadcn/ui components
│   │   └── dashboard/         # Composants dashboard
│   ├── lib/                   # Utilitaires
│   │   ├── supabase/          # Clients Supabase
│   │   └── utils.ts           # Helpers
│   └── types/                 # Types TypeScript
├── public/
│   └── captive-portal/        # Portail captif MikroTik
├── supabase/
│   └── migrations/            # Migrations SQL
└── package.json
```

## 🎯 Utilisation

### Pour les propriétaires WiFi

1. Créez un compte sur [ticketswifizone.com](https://ticketswifizone.com)
2. Créez une zone WiFi (votre kiosque, cybercafé, etc.)
3. Configurez vos tarifs (ex: 1h à 200 FCFA)
4. Uploadez vos tickets MikroTik (export CSV depuis User Manager)
5. Téléchargez et affichez le QR code

### Pour les clients

1. Scannez le QR code avec votre téléphone
2. Choisissez votre tarif
3. Cliquez sur le bouton USSD de votre opérateur
4. Entrez votre PIN Mobile Money pour payer
5. Recevez votre code WiFi instantanément !

## 📱 Captures d'écran

<!-- Ajoutez des captures d'écran ici -->

![Dashboard](./screenshots/dashboard.png)
![Page d'achat](./screenshots/buy-page.png)

## 🧪 Tests

```bash
# Lancer les tests
npm test

# Linter
npm run lint

# Type check
npm run typecheck

# Build
npm run build
```

## 🚀 Déploiement

Le projet est configuré pour être déployé sur Vercel :

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel
```

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou un pull request.

## 📄 Licence

MIT License - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 📞 Contact

- Site web : [https://ticketswifizone.com](https://ticketswifizone.com)
- Email : support@ticketswifizone.com
- WhatsApp : +226 XX XX XX XX

---

Fait avec ❤️ au Burkina Faso
