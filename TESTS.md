# 🧪 Guide de Test - TicketWiFiZone

Serveur démarré : **http://localhost:3001**

## 📋 Tests à effectuer

### 1. Test d'accueil
1. Allez sur : http://localhost:3001
2. Vérifiez la landing page s'affiche

### 2. Test Inscription
1. Allez sur : http://localhost:3001/register
2. Remplissez le formulaire :
   - Business Name: "Test WiFi"
   - Téléphone: "70 12 34 56"
   - Email: "test@example.com"
   - Mot de passe: "password123"
3. Cliquez sur "Créer mon compte"
4. Vous devriez être redirigé vers le dashboard

### 3. Test Dashboard - Création d'une zone
1. Dans le dashboard, cliquez sur "Créer ma première zone"
2. Remplissez :
   - Nom: "Zone Test"
   - Ville: "Ouagadougou"
3. Cliquez sur "Créer la zone"

### 4. Test Configuration - Tarifs
1. Cliquez sur "Tarifs" dans la zone
2. Cliquez "Nouveau tarif"
3. Créez 3 tarifs :
   - "1 heure" - 60 min - 200 FCFA
   - "3 heures" - 180 min - 500 FCFA
   - "Journée" - 1440 min - 1000 FCFA

### 5. Test Configuration - Paiements
1. Cliquez sur "Paiement" dans la zone
2. Activez Orange Money :
   - Numéro: "70 12 34 56" (ou votre vrai numéro)
3. Vérifiez que le code USSD s'affiche correctement

### 6. Test Upload Tickets
1. Cliquez sur "Tickets" dans la zone
2. Sélectionnez le tarif "1 heure"
3. Téléchargez le template CSV
4. Éditez le fichier et ajoutez quelques lignes :
   ```
   username,password
   test_001,pass001
   test_002,pass002
   test_003,pass003
   ```
5. Uploadez le fichier et vérifiez que les 3 tickets sont importés

### 7. Test QR Code
1. Dans la page de la zone, vous devriez voir le QR code généré
2. Vérifiez que vous pouvez le télécharger

---

## 🐛 Résoudre les problèmes

### L'inscription ne fonctionne pas
- Vérifiez que les tables sont créées dans Supabase
- Vérifiez les variables dans `.env.local`

### Le dashboard ne se charge pas
- Vérifiez que vous êtes connecté
- Regardez la console du navigateur (F12)

### Les tarifs ne s'affichent pas
- Vérifiez que vous avez créé une zone
- Rechargez la page

---

## ✅ Checklist de validation

- [ ] Landing page s'affiche
- [ ] Inscription fonctionne
- [ ] Connexion fonctionne
- [ ] Dashboard s'affiche après connexion
- [ ] Création d'une zone fonctionne
- [ ] Détail de la zone s'affiche
- [ ] Création d'un tarif fonctionne
- [ ] Activation/désactivation d'un tarif fonctionne
- [ ] Configuration numéro Mobile Money fonctionne
- [ ] Upload CSV de tickets fonctionne
- [ ] QR code s'affiche et se télécharge
