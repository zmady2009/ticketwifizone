/**
 * Page d'accueil / Landing page marketing.
 *
 * MESSAGE PRINCIPAL : "Zéro commission. Paiement en 2 clics."
 *
 * Sections à implémenter :
 * 1. Hero : "Vendez vos tickets WiFi automatiquement — Gardez 100% de vos ventes"
 * 2. Problème/Solution : "Fini les WhatsApp à minuit"
 * 3. Différenciateurs :
 *    - 💰 0% de commission (vs 2-5% chez les autres)
 *    - 🚀 Paiement en 2 clics pour vos clients (bouton USSD one-click)
 *    - 📱 Configuration simple (1 seul domaine dans le Walled Garden)
 *    - 🆓 100% gratuit au démarrage
 * 4. Comment ça marche (5 étapes visuelles)
 * 5. Témoignages (à ajouter post-lancement)
 * 6. CTA : "Créer mon compte gratuit — C'est prêt en 5 minutes"
 * 7. Footer : liens, contact WhatsApp
 *
 * DESIGN : Doit être SIGNIFICATIVEMENT plus moderne que ticketswifizone.com (Galaxie Team).
 * Mobile-first, animations subtiles, typographie soignée.
 */
export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* HERO */}
      <section className="relative overflow-hidden bg-[#123B8B] text-white">
        <div className="max-w-5xl mx-auto px-4 py-20 md:py-32 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full text-sm mb-8">
            <span className="bg-[#81B545] text-white px-2 py-0.5 rounded-full text-xs font-bold">
              0% commission
            </span>
            <span>Gardez 100% de vos ventes</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
            Vendez vos tickets WiFi
            <br />
            <span className="text-[#81B545]">
              automatiquement
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-blue-200 mb-10 max-w-2xl mx-auto">
            Vos clients paient via Mobile Money en 2 clics.
            Ils reçoivent leur code WiFi instantanément.
            Vous n&apos;avez rien à faire. Même à 3h du matin.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="/register"
              className="bg-[#81B545] text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-[#6b9637] transition-colors shadow-lg"
            >
              Créer mon compte gratuit
            </a>
            <a
              href="#comment-ca-marche"
              className="border-2 border-white/30 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/10 transition-colors"
            >
              Comment ça marche ?
            </a>
          </div>

          <p className="mt-6 text-blue-200 text-sm">
            Prêt en 5 minutes · Aucun paiement requis · Tous les opérateurs
          </p>
        </div>
      </section>

      {/* DIFFÉRENCIATEURS */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-4">
            Pourquoi TicketWiFiZone ?
          </h2>
          <p className="text-gray-500 text-center mb-12 max-w-2xl mx-auto">
            La seule plateforme conçue pour maximiser vos revenus, pas les nôtres.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: 0% commission */}
            <div className="p-8 rounded-2xl border-2 border-green-200 bg-green-50 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center text-3xl mb-4">
                💰
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">0% de commission</h3>
              <p className="text-gray-600">
                Contrairement aux autres plateformes qui prennent 2 à 5% de vos ventes, nous ne prenons
                aucune commission. Sur 100 tickets à 200 F, économisez jusqu&apos;à 10 000 F par jour.
              </p>
            </div>

            {/* Card 2: Paiement 2 clics */}
            <div className="p-8 rounded-2xl border-2 border-brand-200 bg-brand-50 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center text-3xl mb-4">
                🚀
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Paiement en 2 clics</h3>
              <p className="text-gray-600">
                Notre bouton USSD one-click ouvre le dialer avec le code pré-rempli. Vos clients
                paient en 2 secondes au lieu de 5 minutes. Personne d&apos;autre ne le fait.
              </p>
            </div>

            {/* Card 3: Config simple */}
            <div className="p-8 rounded-2xl border-2 border-blue-200 bg-blue-50 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-3xl mb-4">
                📱
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Configuration simple</h3>
              <p className="text-gray-600">
                Un seul domaine à ajouter dans le Walled Garden MikroTik. Pas besoin de 4 ou 5
                domaines comme nos concurrents. Vous êtes prêt en 5 minutes.
              </p>
            </div>

            {/* Card 4: 100% gratuit */}
            <div className="p-8 rounded-2xl border-2 border-accent/200 bg-accent/10 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center text-3xl mb-4">
                🆓
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">100% gratuit au démarrage</h3>
              <p className="text-gray-600">
                Pas de kit à acheter, pas d&apos;abonnement, pas de frais cachés. Créez votre compte,
                ajoutez vos tickets, et commencez à vendre immédiatement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section id="comment-ca-marche" className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-4">Prêt en 5 étapes</h2>
          <p className="text-gray-500 text-center mb-12 max-w-2xl mx-auto">
            Configurez votre WiFi Zone en moins de 5 minutes et commencez à vendre automatiquement.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-white rounded-2xl p-6 text-center border-2 border-gray-200 h-full">
                <div className="w-12 h-12 rounded-full bg-brand-600 text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Créez un compte</h3>
                <p className="text-sm text-gray-600">
                  Inscription gratuite en 30 secondes
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-brand-300" />
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="bg-white rounded-2xl p-6 text-center border-2 border-gray-200 h-full">
                <div className="w-12 h-12 rounded-full bg-brand-600 text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Ajoutez une zone</h3>
                <p className="text-sm text-gray-600">
                  Créez votre premier point d&apos;accès WiFi
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-brand-300" />
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="bg-white rounded-2xl p-6 text-center border-2 border-gray-200 h-full">
                <div className="w-12 h-12 rounded-full bg-brand-600 text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Configurez les tarifs</h3>
                <p className="text-sm text-gray-600">
                  Définissez vos prix et durées (1h, 1 jour...)
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-brand-300" />
            </div>

            {/* Step 4 */}
            <div className="relative">
              <div className="bg-white rounded-2xl p-6 text-center border-2 border-gray-200 h-full">
                <div className="w-12 h-12 rounded-full bg-brand-600 text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  4
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Uploadez vos tickets</h3>
                <p className="text-sm text-gray-600">
                  Importez vos codes MikroTik en CSV
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-brand-300" />
            </div>

            {/* Step 5 */}
            <div>
              <div className="bg-white rounded-2xl p-6 text-center border-2 border-brand-200 bg-brand-50 h-full">
                <div className="w-12 h-12 rounded-full bg-brand-600 text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  5
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Affichez le QR code</h3>
                <p className="text-sm text-gray-600">
                  Imprimez et c&apos;est parti ! 🎉
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <a
              href="/register"
              className="inline-block bg-[#81B545] text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-[#6b9637] transition-colors shadow-lg"
            >
              Commencer maintenant — C&apos;est gratuit
            </a>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 bg-[#123B8B] text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-black mb-4">
            Prêt à automatiser votre WiFi Zone ?
          </h2>
          <p className="text-blue-200 text-lg mb-8">
            Inscription gratuite. Zéro commission. Vos premiers tickets vendus aujourd&apos;hui.
          </p>
          <a
            href="/register"
            className="inline-block bg-[#81B545] text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-[#6b9637] transition-colors shadow-lg"
          >
            Commencer maintenant — C&apos;est gratuit
          </a>
        </div>
      </section>
    </main>
  );
}
