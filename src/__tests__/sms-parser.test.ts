/**
 * Tests pour le parser de SMS Mobile Money.
 * 
 * Couvrir : Orange Money, Moov Money, Wave, Telecel Money
 * Cas limites : montants avec espaces, références, SMS invalides
 */

import { parseMobileMoneysSMS, isMobileMoneysSMS } from '@/lib/sms/parser';

describe('parseMobileMoneysSMS', () => {
  // =========================================
  // Orange Money
  // =========================================
  describe('Orange Money', () => {
    it('parses standard Orange Money SMS', () => {
      const sms = 'Vous avez recu 200 FCFA de 70 12 34 56. Votre solde est de 15 430 FCFA. Trans ID: OM240221.1234.A56789';
      const result = parseMobileMoneysSMS(sms);

      expect(result).not.toBeNull();
      expect(result!.amount).toBe(200);
      expect(result!.senderPhone).toBe('70123456');
      expect(result!.operator).toBe('orange');
      expect(result!.reference).toBe('OM240221.1234.A56789');
    });

    it('parses Orange SMS with large amount', () => {
      const sms = 'Vous avez recu 1 500 FCFA de 70 99 88 77. Trans ID: OM260301.5678.B12345';
      const result = parseMobileMoneysSMS(sms);

      expect(result).not.toBeNull();
      expect(result!.amount).toBe(1500);
      expect(result!.senderPhone).toBe('70998877');
    });

    it('parses Orange SMS without reference', () => {
      const sms = 'Vous avez recu 500 FCFA de 70 11 22 33. Votre solde est de 8 000 FCFA.';
      const result = parseMobileMoneysSMS(sms);

      expect(result).not.toBeNull();
      expect(result!.amount).toBe(500);
      expect(result!.reference).toBeUndefined();
    });
  });

  // =========================================
  // Moov Money
  // =========================================
  describe('Moov Money', () => {
    it('parses standard Moov Money SMS', () => {
      const sms = 'Transfert recu: 500 FCFA de 64 00 11 22. Ref: MM-2024-789456. Solde: 8 200 FCFA';
      const result = parseMobileMoneysSMS(sms);

      expect(result).not.toBeNull();
      expect(result!.amount).toBe(500);
      expect(result!.senderPhone).toBe('64001122');
      expect(result!.operator).toBe('moov');
      expect(result!.reference).toBe('MM-2024-789456');
    });

    it('parses Moov SMS without colon after recu', () => {
      const sms = 'Transfert recu 300 FCFA de 64 55 66 77. Ref: MM-2026-123';
      const result = parseMobileMoneysSMS(sms);

      expect(result).not.toBeNull();
      expect(result!.amount).toBe(300);
    });
  });

  // =========================================
  // Wave
  // =========================================
  describe('Wave', () => {
    it('parses standard Wave SMS with name', () => {
      const sms = 'Vous avez recu 100 FCFA de Amadou O. (76 55 44 33). Ref: WV-ABC123';
      const result = parseMobileMoneysSMS(sms);

      expect(result).not.toBeNull();
      expect(result!.amount).toBe(100);
      expect(result!.senderPhone).toBe('76554433');
      expect(result!.operator).toBe('wave');
      expect(result!.reference).toBe('WV-ABC123');
    });

    it('parses Wave SMS with long name', () => {
      const sms = 'Vous avez recu 2 000 FCFA de Jean-Pierre Ouédraogo (76 11 22 33). Ref: WV-XYZ789';
      const result = parseMobileMoneysSMS(sms);

      expect(result).not.toBeNull();
      expect(result!.amount).toBe(2000);
      expect(result!.senderPhone).toBe('76112233');
    });
  });

  // =========================================
  // Telecel Money
  // =========================================
  describe('Telecel Money', () => {
    it('parses standard Telecel SMS', () => {
      const sms = 'Vous avez recu 300 FCFA de 62 33 44 55. ID: TC2024-123. Solde: 5 000 FCFA';
      const result = parseMobileMoneysSMS(sms);

      expect(result).not.toBeNull();
      expect(result!.amount).toBe(300);
      expect(result!.senderPhone).toBe('62334455');
      expect(result!.operator).toBe('telecel');
      expect(result!.reference).toBe('TC2024-123');
    });
  });

  // =========================================
  // Edge cases
  // =========================================
  describe('Edge cases', () => {
    it('returns null for non-payment SMS', () => {
      expect(parseMobileMoneysSMS('Bienvenue chez Orange')).toBeNull();
      expect(parseMobileMoneysSMS('Votre solde est de 5000 FCFA')).toBeNull();
      expect(parseMobileMoneysSMS('')).toBeNull();
    });

    it('returns null for SMS with 0 amount', () => {
      const sms = 'Vous avez recu 0 FCFA de 70 12 34 56';
      expect(parseMobileMoneysSMS(sms)).toBeNull();
    });

    it('handles case insensitivity', () => {
      const sms = 'VOUS AVEZ RECU 200 FCFA DE 70 12 34 56';
      const result = parseMobileMoneysSMS(sms);
      expect(result).not.toBeNull();
      expect(result!.amount).toBe(200);
    });
  });
});

describe('isMobileMoneysSMS', () => {
  it('detects Mobile Money SMS', () => {
    expect(isMobileMoneysSMS('Vous avez recu 200 FCFA')).toBe(true);
    expect(isMobileMoneysSMS('Transfert recu: 500 FCFA')).toBe(true);
    expect(isMobileMoneysSMS('Votre solde est de 1000 FCFA')).toBe(true);
  });

  it('rejects non-Mobile Money SMS', () => {
    expect(isMobileMoneysSMS('Bienvenue chez Orange')).toBe(false);
    expect(isMobileMoneysSMS('Votre forfait expire demain')).toBe(false);
  });
});
