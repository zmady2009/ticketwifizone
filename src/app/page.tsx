import Link from 'next/link';

/**
 * Landing page marketing — TicketWiFiZone
 * MESSAGE : "Zéro commission. Paiement en 2 clics."
 */

const steps = [
  {
    num: '01',
    title: 'Créez un compte',
    desc: 'Inscription gratuite en 30 secondes. Aucun paiement requis.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.5-1.632Z" />
      </svg>
    ),
  },
  {
    num: '02',
    title: 'Ajoutez une zone WiFi',
    desc: 'Configurez votre point d\'accès et vos tarifs en quelques clics.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12 18.75h.008v.008H12v-.008Z" />
      </svg>
    ),
  },
  {
    num: '03',
    title: 'Uploadez vos tickets',
    desc: 'Importez vos codes MikroTik en CSV ou ajoutez-les manuellement.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
      </svg>
    ),
  },
  {
    num: '04',
    title: 'Affichez le QR code',
    desc: 'Imprimez-le dans votre kiosque. Les clients scannent et paient.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 14.625v2.625m3.375-2.625v2.625M16.875 20.25h-3.375v-3h3.375m1.125-1.125h.008v.008h-.008v-.008Zm0 3.375h.008v.008h-.008V19.5Zm-1.125 1.125h.008v.008h-.008v-.008Zm1.125 0h.008v.008h-.008v-.008Z" />
      </svg>
    ),
  },
  {
    num: '05',
    title: 'Vendez automatiquement',
    desc: 'Les paiements arrivent, les tickets partent. Même à 3h du matin.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.746 3.746 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
      </svg>
    ),
  },
];

const competitors = [
  { name: 'Autres plateformes', commission: '2–5%', payment: '5+ étapes', setup: '4–5 domaines', cost: '85 000+ FCFA' },
  { name: 'TicketWiFiZone', commission: '0%', payment: '2 clics', setup: '1 seul domaine', cost: 'Gratuit' },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* ─── NAVBAR ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12 18.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <span className="font-bold text-lg text-gray-900">
              Ticket<span className="text-brand-600">WiFi</span>Zone
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#avantages" className="hover:text-brand-600 transition-colors">Avantages</a>
            <a href="#comment-ca-marche" className="hover:text-brand-600 transition-colors">Comment ça marche</a>
            <a href="#comparaison" className="hover:text-brand-600 transition-colors">Comparaison</a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-flex text-sm font-semibold text-gray-700 hover:text-brand-600 transition-colors px-4 py-2"
            >
              Connexion
            </Link>
            <Link
              href="/register"
              className="bg-brand-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-700 transition-colors shadow-sm"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-600 to-brand-700 text-white pt-32 pb-20 md:pt-40 md:pb-28">
        {/* Decorative background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse-soft" />
          <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-brand-500/30 rounded-full blur-3xl animate-pulse-soft animation-delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/[0.03] rounded-full" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="animate-fade-in-up inline-flex items-center gap-2.5 bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-2 rounded-full text-sm mb-8">
              <span className="bg-accent text-white px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase">
                0% commission
              </span>
              <span className="text-blue-100">Gardez 100% de vos ventes</span>
            </div>

            {/* Heading */}
            <h1 className="animate-fade-in-up animation-delay-100 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight mb-6">
              Vendez vos tickets WiFi{' '}
              <span className="relative inline-block">
                <span className="text-accent">automatiquement</span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                  <path d="M2 8 C50 2, 100 2, 150 6 S250 10, 298 4" stroke="#81B545" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
                </svg>
              </span>
            </h1>

            {/* Subheading */}
            <p className="animate-fade-in-up animation-delay-200 text-lg sm:text-xl md:text-2xl text-blue-100/90 mb-10 max-w-2xl leading-relaxed">
              Vos clients paient via Mobile Money en 2 clics.
              Ils reçoivent leur code WiFi instantanément.
              <span className="text-white font-medium"> Vous n&apos;avez rien à faire.</span> Même à 3h du matin.
            </p>

            {/* CTA buttons */}
            <div className="animate-fade-in-up animation-delay-300 flex flex-col sm:flex-row gap-4">
              <Link
                href="/register"
                className="group relative inline-flex items-center justify-center gap-2 bg-accent text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-accent-500 transition-all shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/30 hover:-translate-y-0.5"
              >
                Créer mon compte gratuit
                <svg className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <a
                href="#comment-ca-marche"
                className="inline-flex items-center justify-center gap-2 border-2 border-white/20 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/10 hover:border-white/30 transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z" />
                </svg>
                Comment ça marche
              </a>
            </div>

            {/* Trust line */}
            <div className="animate-fade-in-up animation-delay-400 mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-blue-200/80">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
                Prêt en 5 minutes
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
                Aucun paiement requis
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
                Orange · Moov · Telecel · Wave
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SOCIAL PROOF / STATS ─── */}
      <section className="relative -mt-10 z-20 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 p-6 sm:p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { value: '0%', label: 'Commission sur vos ventes', color: 'text-accent' },
              { value: '2', label: 'Clics pour payer', color: 'text-brand-600' },
              { value: '24/7', label: 'Vente automatique', color: 'text-brand-600' },
              { value: '4', label: 'Opérateurs supportés', color: 'text-accent' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className={`text-3xl sm:text-4xl font-black ${stat.color} animate-count-up`}>
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500 mt-1 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── AVANTAGES / DIFFÉRENCIATEURS ─── */}
      <section id="avantages" className="py-24 sm:py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-600 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
              </svg>
              Pourquoi nous choisir
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
              Conçue pour maximiser{' '}
              <span className="text-brand-600">vos revenus</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              La seule plateforme où le propriétaire garde 100% de ses ventes. Pas de commission, pas de frais cachés.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card 1 */}
            <div className="group relative p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-green-50 to-emerald-50/50 border border-green-100 hover:shadow-lg hover:shadow-green-100/50 transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-green-100 flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">0% de commission</h3>
              <p className="text-gray-600 leading-relaxed">
                Les autres plateformes prennent 2 à 5% de vos ventes via des agrégateurs. Nous, zéro.
                Sur 100 tickets/jour à 200 F, vous <span className="font-semibold text-green-700">économisez jusqu&apos;à 10 000 F/jour</span>.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-green-700">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Paiement direct propriétaire
              </div>
            </div>

            {/* Card 2 */}
            <div className="group relative p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-brand-50 to-blue-50/50 border border-brand-100 hover:shadow-lg hover:shadow-brand-100/50 transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-brand-100 flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Paiement en 2 clics</h3>
              <p className="text-gray-600 leading-relaxed">
                Notre bouton USSD one-click ouvre le dialer avec le code pré-rempli.
                Vos clients paient en <span className="font-semibold text-brand-600">2 secondes au lieu de 5 minutes</span>. Aucun concurrent ne le propose.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-600">
                <span className="w-2 h-2 rounded-full bg-brand-500" />
                Exclusivité TicketWiFiZone
              </div>
            </div>

            {/* Card 3 */}
            <div className="group relative p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-violet-50 to-purple-50/50 border border-violet-100 hover:shadow-lg hover:shadow-violet-100/50 transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-violet-100 flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Configuration simple</h3>
              <p className="text-gray-600 leading-relaxed">
                Un seul domaine à ajouter dans le Walled Garden MikroTik. Pas besoin de 4 ou 5 domaines.
                <span className="font-semibold text-violet-700"> Opérationnel en 5 minutes</span>, même pour les non-techniciens.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-violet-700">
                <span className="w-2 h-2 rounded-full bg-violet-500" />
                1 seul domaine dans Walled Garden
              </div>
            </div>

            {/* Card 4 */}
            <div className="group relative p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-100 hover:shadow-lg hover:shadow-amber-100/50 transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-amber-100 flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">100% gratuit au démarrage</h3>
              <p className="text-gray-600 leading-relaxed">
                Pas de kit à acheter, pas d&apos;abonnement, pas de frais cachés. Créez votre compte,
                ajoutez vos tickets, et <span className="font-semibold text-amber-700">commencez à vendre immédiatement</span>.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-amber-700">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Monétisation premium future optionnelle
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── COMMENT ÇA MARCHE ─── */}
      <section id="comment-ca-marche" className="py-24 sm:py-32 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-accent/10 text-accent-600 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
              Mise en place rapide
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
              Prêt en <span className="text-accent">5 étapes</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Configurez votre WiFi Zone en moins de 5 minutes et commencez à vendre automatiquement.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {steps.map((step, i) => (
              <div
                key={i}
                className={`group relative flex items-start gap-6 p-6 sm:p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 ${
                  i === steps.length - 1 ? 'border-accent/30 bg-accent/5' : ''
                }`}
              >
                {/* Step number */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-mono text-sm font-bold ${
                  i === steps.length - 1
                    ? 'bg-accent text-white'
                    : 'bg-brand-50 text-brand-600'
                }`}>
                  {step.num}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{step.title}</h3>
                  <p className="text-gray-500">{step.desc}</p>
                </div>

                {/* Icon */}
                <div className={`hidden sm:flex flex-shrink-0 w-12 h-12 rounded-xl items-center justify-center ${
                  i === steps.length - 1
                    ? 'bg-accent/10 text-accent'
                    : 'bg-gray-50 text-gray-400 group-hover:text-brand-600 group-hover:bg-brand-50'
                } transition-colors`}>
                  {step.icon}
                </div>

                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="absolute left-[3.25rem] sm:left-[3.5rem] top-[4.5rem] w-px h-4 bg-gray-200" />
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 bg-accent text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-accent-500 transition-all shadow-lg shadow-accent/20 hover:shadow-xl hover:shadow-accent/30 hover:-translate-y-0.5"
            >
              Commencer maintenant
              <svg className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <p className="text-sm text-gray-400 mt-3">Gratuit, sans engagement</p>
          </div>
        </div>
      </section>

      {/* ─── COMPARAISON ─── */}
      <section id="comparaison" className="py-24 sm:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
              </svg>
              Face à face
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
              Comparez par <span className="text-brand-600">vous-même</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Voyez la différence concrète entre TicketWiFiZone et les autres solutions du marché.
            </p>
          </div>

          {/* Comparison table */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-6 py-4 text-sm font-semibold text-gray-500" />
                    <th className="px-6 py-4 text-sm font-semibold text-gray-400">Autres plateformes</th>
                    <th className="px-6 py-4 text-sm font-semibold text-brand-600 bg-brand-50/50">TicketWiFiZone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[
                    { label: 'Commission', other: '2–5% par vente', ours: '0%', highlight: true },
                    { label: 'Paiement client', other: '5+ étapes / écrans', ours: '2 clics (USSD)', highlight: true },
                    { label: 'Walled Garden', other: '4–5 domaines requis', ours: '1 seul domaine', highlight: false },
                    { label: 'Coût de démarrage', other: '85 000+ FCFA', ours: 'Gratuit', highlight: true },
                    { label: 'Portail captif', other: 'À configurer soi-même', ours: 'Fichier prêt à l\'emploi', highlight: false },
                    { label: 'Vente 24h/24', other: 'Dépend du propriétaire', ours: 'Entièrement automatique', highlight: false },
                  ].map((row, i) => (
                    <tr key={i} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{row.label}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{row.other}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-brand-600 bg-brand-50/30">
                        <span className="inline-flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-accent flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                          </svg>
                          {row.ours}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ─── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-600 to-brand-700 text-white py-24 sm:py-32">
        {/* Decorative */}
        <div className="absolute inset-0">
          <div className="absolute -top-32 -right-32 w-[400px] h-[400px] bg-accent/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-brand-500/30 rounded-full blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-6 tracking-tight leading-tight">
            Prêt à automatiser
            <br />
            votre WiFi Zone ?
          </h2>
          <p className="text-lg sm:text-xl text-blue-100/90 mb-10 max-w-xl mx-auto leading-relaxed">
            Inscription gratuite. Zéro commission. Vos premiers tickets vendus aujourd&apos;hui.
          </p>

          <Link
            href="/register"
            className="group inline-flex items-center gap-3 bg-white text-brand-600 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all shadow-xl shadow-black/10 hover:-translate-y-0.5"
          >
            Créer mon compte gratuit
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>

          <p className="mt-6 text-blue-200/70 text-sm">
            Rejoignez les propriétaires qui vendent déjà en automatique
          </p>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="sm:col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12 18.75h.008v.008H12v-.008Z" />
                  </svg>
                </div>
                <span className="font-bold text-white">
                  Ticket<span className="text-brand-400">WiFi</span>Zone
                </span>
              </div>
              <p className="text-sm leading-relaxed">
                Plateforme de vente automatique de tickets WiFi via Mobile Money. Conçue pour l&apos;Afrique.
              </p>
            </div>

            {/* Produit */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Produit</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#avantages" className="hover:text-white transition-colors">Avantages</a></li>
                <li><a href="#comment-ca-marche" className="hover:text-white transition-colors">Comment ça marche</a></li>
                <li><a href="#comparaison" className="hover:text-white transition-colors">Comparaison</a></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Créer un compte</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Support</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/login" className="hover:text-white transition-colors">Connexion</Link></li>
                <li><a href="https://wa.me/22670000000" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">WhatsApp</a></li>
              </ul>
            </div>

            {/* Opérateurs */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Opérateurs supportés</h4>
              <ul className="space-y-2.5 text-sm">
                <li>Orange Money</li>
                <li>Moov Money</li>
                <li>Telecel Money</li>
                <li>Wave</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
            <p>&copy; {new Date().getFullYear()} TicketWiFiZone. Tous droits réservés.</p>
            <p className="text-gray-600">Ouagadougou, Burkina Faso</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
