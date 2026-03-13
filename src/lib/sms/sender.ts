/**
 * Envoi de SMS via Africa's Talking.
 * Utilisé pour envoyer les codes WiFi aux clients après paiement.
 *
 * Coût estimé : ~15 FCFA par SMS au Burkina Faso.
 *
 * Configuration :
 * - AT_API_KEY : clé API Africa's Talking
 * - AT_USERNAME : nom d'utilisateur (ou "sandbox" en dev)
 * - AT_SENDER_ID : identifiant expéditeur (ex: "TicketWiFi")
 */

interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Envoie un SMS via Africa's Talking.
 * Le numéro doit être au format international : +226XXXXXXXX
 */
export async function sendSMS(
  to: string,
  message: string
): Promise<SMSResult> {
  const apiKey = process.env.AT_API_KEY;
  const username = process.env.AT_USERNAME || 'sandbox';
  const senderId = process.env.AT_SENDER_ID || 'TicketWiFi';

  if (!apiKey) {
    console.error('[SMS] AT_API_KEY non configurée');
    return { success: false, error: 'SMS non configuré' };
  }

  // Normaliser le numéro au format international Burkina
  const phone = normalizeToInternational(to);

  try {
    // Africa's Talking API
    const baseUrl =
      username === 'sandbox'
        ? 'https://api.sandbox.africastalking.com'
        : 'https://api.africastalking.com';

    const response = await fetch(`${baseUrl}/version1/messaging`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        apiKey: apiKey,
      },
      body: new URLSearchParams({
        username,
        to: phone,
        message,
        from: senderId,
      }),
    });

    const data = await response.json();

    if (data.SMSMessageData?.Recipients?.[0]?.status === 'Success') {
      return {
        success: true,
        messageId: data.SMSMessageData.Recipients[0].messageId,
      };
    }

    console.error('[SMS] Échec envoi:', JSON.stringify(data));
    return {
      success: false,
      error: data.SMSMessageData?.Recipients?.[0]?.status || 'Erreur inconnue',
    };
  } catch (error) {
    console.error('[SMS] Erreur réseau:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur réseau',
    };
  }
}

/**
 * Envoie le code WiFi au client par SMS.
 */
export async function sendWiFiCodeSMS(
  phone: string,
  zoneName: string,
  username: string,
  password: string,
  duration: string
): Promise<SMSResult> {
  const message = [
    `${zoneName} - Votre code WiFi:`,
    `Identifiant: ${username}`,
    `Mot de passe: ${password}`,
    `Durée: ${duration}`,
    `Connectez-vous au réseau WiFi et entrez ce code. Bon surf!`,
  ].join('\n');

  return sendSMS(phone, message);
}

/**
 * Normalise un numéro burkinabè au format international.
 * "70123456" → "+22670123456"
 */
function normalizeToInternational(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('226')) return `+${digits}`;
  if (digits.length === 8) return `+226${digits}`;
  return `+${digits}`;
}
