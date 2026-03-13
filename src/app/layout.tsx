import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// Layout racine - Application TicketWiFiZone
// Déploiement production Vercel - Mars 2026
const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TicketWiFiZone — Vendez vos tickets WiFi automatiquement',
  description:
    'Plateforme de vente automatique de tickets WiFi via Mobile Money. Scannez, payez, connectez-vous. Zéro commission.',
  keywords: ['WiFi Zone', 'ticket WiFi', 'Mobile Money', 'Orange Money', 'Burkina Faso', 'hotspot', 'MikroTik'],
  manifest: '/manifest.json',
  openGraph: {
    title: 'TicketWiFiZone — Vendez vos tickets WiFi automatiquement',
    description: 'Plateforme de vente automatique de tickets WiFi via Mobile Money. Zéro commission. Paiement en 2 clics.',
    url: 'https://ticketswifizone.com',
    siteName: 'TicketWiFiZone',
    locale: 'fr_FR',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TicketWiFiZone',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TicketWiFiZone — Vendez vos tickets WiFi automatiquement',
    description: 'Plateforme de vente automatique de tickets WiFi via Mobile Money. Zéro commission.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#123B8B',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
