/**
 * Génération de QR codes pour les zones WiFi.
 * Le QR code pointe vers la page d'achat : /zone/{zoneId}/buy
 */

import QRCode from 'qrcode';

/**
 * Génère un QR code en base64 (data URL PNG) pour une zone WiFi.
 */
export async function generateQRCodeDataURL(
  zoneId: string,
  options?: { width?: number; margin?: number }
): Promise<string> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ticketswifizone.com';
  const buyUrl = `${appUrl}/zone/${zoneId}/buy`;

  return QRCode.toDataURL(buyUrl, {
    width: options?.width || 400,
    margin: options?.margin || 2,
    color: {
      dark: '#1e1b4e', // Couleur brand foncée
      light: '#ffffff',
    },
    errorCorrectionLevel: 'M',
  });
}

/**
 * Génère un QR code en buffer PNG (pour upload vers Supabase Storage).
 */
export async function generateQRCodeBuffer(
  zoneId: string,
  options?: { width?: number }
): Promise<Buffer> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ticketswifizone.com';
  const buyUrl = `${appUrl}/zone/${zoneId}/buy`;

  return QRCode.toBuffer(buyUrl, {
    width: options?.width || 400,
    margin: 2,
    color: {
      dark: '#1e1b4e',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'M',
    type: 'png',
  });
}

/**
 * Retourne l'URL de la page d'achat pour une zone.
 */
export function getBuyPageURL(zoneId: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ticketswifizone.com';
  return `${appUrl}/zone/${zoneId}/buy`;
}
