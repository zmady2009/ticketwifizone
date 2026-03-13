/**
 * Parser de SMS de confirmation Mobile Money.
 *
 * Chaque opérateur envoie un SMS de confirmation au destinataire d'un transfert.
 * Ce module extrait le montant et le numéro de l'expéditeur de ces SMS.
 *
 * IMPORTANT : Les formats de SMS changent parfois. Les regex doivent être
 * testées régulièrement avec des SMS réels. Logger les SMS non-parsés
 * pour ajuster les patterns.
 *
 * Exemples de SMS réels (Burkina Faso) :
 *
 * Orange Money :
 *   "Vous avez recu 200 FCFA de 70 12 34 56. Votre solde est de 15 430 FCFA. Trans ID: OM240221.1234.A56789"
 *
 * Moov Money :
 *   "Transfert recu: 500 FCFA de 64 00 11 22. Ref: MM-2024-789456. Solde: 8 200 FCFA"
 *
 * Wave :
 *   "Vous avez recu 100 FCFA de Amadou O. (76 55 44 33). Ref: WV-ABC123"
 *
 * Telecel Money :
 *   "Vous avez recu 300 FCFA de 62 33 44 55. ID: TC2024-123. Solde: 5 000 FCFA"
 */

import { type Operator, normalizePhone } from '@/lib/ussd';

export interface ParsedSMS {
  /** Montant reçu en FCFA */
  amount: number;
  /** Numéro de téléphone de l'expéditeur (8 chiffres, normalisé) */
  senderPhone: string;
  /** Référence de transaction (si disponible) */
  reference?: string;
  /** Opérateur détecté */
  operator: Operator;
}

interface SMSPattern {
  operator: Operator;
  /** Regex avec groupes : (1) montant, (2) numéro expéditeur */
  regex: RegExp;
  /** Regex optionnelle pour extraire la référence */
  refRegex?: RegExp;
}

/**
 * Patterns de SMS par opérateur.
 * L'ordre est important : tester dans cet ordre.
 * Chaque regex utilise le flag 'i' pour être case-insensitive.
 */
const SMS_PATTERNS: SMSPattern[] = [
  {
    operator: 'orange',
    // "Vous avez recu 200 FCFA de 70 12 34 56"
    regex: /recu\s+(\d[\d\s]*?)\s*FCFA\s*de\s*(\d{2}\s*\d{2}\s*\d{2}\s*\d{2})/i,
    refRegex: /Trans\s*ID:\s*([\w.-]+)/i,
  },
  {
    operator: 'moov',
    // "Transfert recu: 500 FCFA de 64 00 11 22"
    regex: /recu:?\s*(\d[\d\s]*?)\s*FCFA\s*de\s*(\d{2}\s*\d{2}\s*\d{2}\s*\d{2})/i,
    refRegex: /Ref:\s*([\w-]+)/i,
  },
  {
    operator: 'wave',
    // "Vous avez recu 100 FCFA de Amadou O. (76 55 44 33)"
    regex: /recu\s+(\d[\d\s]*?)\s*FCFA.*?\((\d{2}\s*\d{2}\s*\d{2}\s*\d{2})\)/i,
    refRegex: /Ref:\s*([\w-]+)/i,
  },
  {
    operator: 'telecel',
    // "Vous avez recu 300 FCFA de 62 33 44 55"
    regex: /recu\s+(\d[\d\s]*?)\s*FCFA\s*de\s*(\d{2}\s*\d{2}\s*\d{2}\s*\d{2})/i,
    refRegex: /ID:\s*([\w-]+)/i,
  },
];

/**
 * Parse un SMS de confirmation Mobile Money.
 * Retourne null si le SMS n'est pas reconnu comme un paiement.
 */
export function parseMobileMoneysSMS(smsBody: string): ParsedSMS | null {
  for (const pattern of SMS_PATTERNS) {
    const match = smsBody.match(pattern.regex);
    if (match) {
      const amount = parseInt(match[1].replace(/\s/g, ''), 10);
      const senderPhone = normalizePhone(match[2]);

      if (isNaN(amount) || amount <= 0 || senderPhone.length !== 8) {
        continue; // Pattern matched mais données invalides, essayer le suivant
      }

      let reference: string | undefined;
      if (pattern.refRegex) {
        const refMatch = smsBody.match(pattern.refRegex);
        if (refMatch) {
          reference = refMatch[1];
        }
      }

      return {
        amount,
        senderPhone,
        reference,
        operator: pattern.operator,
      };
    }
  }

  return null;
}

/**
 * Vérifie si un SMS semble être une notification Mobile Money (pré-filtre rapide).
 * Utile pour l'app SMS Forwarder qui peut filtrer avant d'envoyer au serveur.
 */
export function isMobileMoneysSMS(smsBody: string): boolean {
  const keywords = ['FCFA', 'recu', 'transfert', 'solde'];
  const bodyLower = smsBody.toLowerCase();
  return keywords.some((kw) => bodyLower.includes(kw.toLowerCase()));
}
