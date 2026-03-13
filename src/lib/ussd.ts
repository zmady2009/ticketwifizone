/**
 * Génération de codes USSD et liens tel: pour les boutons de paiement one-click.
 *
 * Formats USSD Mobile Money — Burkina Faso :
 * - Orange Money : *144*2*1*{destinataire}*{montant}#
 * - Moov Money   : *155*1*1*{destinataire}*{montant}#
 * - Telecel Money : *100*1*1*{destinataire}*{montant}#
 * - Wave          : Pas de USSD (app mobile uniquement)
 *
 * IMPORTANT : Le # doit être encodé %23 dans les liens tel:
 * sinon le navigateur coupe l'URL au #.
 */

export type Operator = 'orange' | 'moov' | 'telecel' | 'wave';

export interface USSDConfig {
  operator: Operator;
  displayName: string;
  /** Format USSD avec placeholders {phone} et {amount} */
  format: string;
  /** Couleur CSS gradient */
  colorClass: string;
  /** Couleur badge */
  badgeClass: string;
}

/** Configurations par défaut pour le Burkina Faso */
export const OPERATOR_CONFIGS: Record<Operator, USSDConfig> = {
  orange: {
    operator: 'orange',
    displayName: 'Orange Money',
    format: '*144*2*1*{phone}*{amount}#',
    colorClass: 'bg-gradient-to-br from-[#FF6600] to-[#E55A00]',
    badgeClass: 'bg-[#FF6600]',
  },
  moov: {
    operator: 'moov',
    displayName: 'Moov Money',
    format: '*155*1*1*{phone}*{amount}#',
    colorClass: 'bg-gradient-to-br from-[#0066CC] to-[#0055A6]',
    badgeClass: 'bg-[#0066CC]',
  },
  telecel: {
    operator: 'telecel',
    displayName: 'Telecel Money',
    format: '*100*1*1*{phone}*{amount}#',
    colorClass: 'bg-gradient-to-br from-[#00AAFF] to-[#0091D9]',
    badgeClass: 'bg-[#00AAFF]',
  },
  wave: {
    operator: 'wave',
    displayName: 'Wave',
    format: '', // Pas de USSD, utilise l'app
    colorClass: 'bg-gradient-to-br from-[#1DC3C3] to-[#19A8A8]',
    badgeClass: 'bg-[#1DC3C3]',
  },
};

/**
 * Génère le code USSD affiché à l'utilisateur.
 * Ex: "*144*2*1*65678727*200#"
 */
export function buildUSSDCode(
  format: string,
  phone: string,
  amount: number
): string {
  return format
    .replace('{phone}', phone.replace(/\s/g, ''))
    .replace('{amount}', String(amount));
}

/**
 * Génère le lien tel: pour ouvrir le dialer avec le code USSD pré-rempli.
 * Le # est encodé en %23 pour éviter que le navigateur coupe l'URL.
 * Ex: "tel:*144*2*1*65678727*200%23"
 */
export function buildTelURI(
  format: string,
  phone: string,
  amount: number
): string {
  const code = buildUSSDCode(format, phone, amount);
  return `tel:${code.replace('#', '%23')}`;
}

/**
 * Vérifie si l'opérateur supporte le USSD one-click.
 * Wave ne supporte pas le USSD (app mobile uniquement).
 */
export function supportsUSSD(operator: Operator): boolean {
  return operator !== 'wave';
}

/**
 * Formate un montant en FCFA lisible.
 * Ex: 1500 → "1 500 F"
 */
export function formatFCFA(amount: number): string {
  return amount.toLocaleString('fr-FR') + ' F';
}

/**
 * Normalise un numéro de téléphone burkinabè (8 chiffres, sans espaces).
 * Accepte : "70 12 34 56", "70123456", "+22670123456"
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  // Si le numéro commence par 226 (indicatif Burkina), le retirer
  if (digits.startsWith('226') && digits.length === 11) {
    return digits.slice(3);
  }
  return digits.slice(-8); // Prendre les 8 derniers chiffres
}

/**
 * Formate un numéro pour l'affichage : "70 12 34 56"
 */
export function formatPhone(phone: string): string {
  const normalized = normalizePhone(phone);
  if (normalized.length !== 8) return phone;
  return `${normalized.slice(0, 2)} ${normalized.slice(2, 4)} ${normalized.slice(4, 6)} ${normalized.slice(6, 8)}`;
}
