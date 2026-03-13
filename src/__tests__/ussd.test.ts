/**
 * Tests pour le builder USSD et les utilitaires téléphone.
 */

import {
  buildUSSDCode,
  buildTelURI,
  supportsUSSD,
  normalizePhone,
  formatPhone,
  formatFCFA,
  OPERATOR_CONFIGS,
} from '@/lib/ussd';

describe('buildUSSDCode', () => {
  it('builds Orange Money USSD code', () => {
    const code = buildUSSDCode(OPERATOR_CONFIGS.orange.format, '65678727', 200);
    expect(code).toBe('*144*2*1*65678727*200#');
  });

  it('builds Moov Money USSD code', () => {
    const code = buildUSSDCode(OPERATOR_CONFIGS.moov.format, '64001122', 500);
    expect(code).toBe('*155*1*1*64001122*500#');
  });

  it('builds Telecel Money USSD code', () => {
    const code = buildUSSDCode(OPERATOR_CONFIGS.telecel.format, '62334455', 300);
    expect(code).toBe('*100*1*1*62334455*300#');
  });

  it('strips spaces from phone number', () => {
    const code = buildUSSDCode(OPERATOR_CONFIGS.orange.format, '65 67 87 27', 200);
    expect(code).toBe('*144*2*1*65678727*200#');
  });
});

describe('buildTelURI', () => {
  it('encodes # as %23', () => {
    const uri = buildTelURI(OPERATOR_CONFIGS.orange.format, '65678727', 200);
    expect(uri).toBe('tel:*144*2*1*65678727*200%23');
    expect(uri).not.toContain('#');
  });
});

describe('supportsUSSD', () => {
  it('returns true for Orange, Moov, Telecel', () => {
    expect(supportsUSSD('orange')).toBe(true);
    expect(supportsUSSD('moov')).toBe(true);
    expect(supportsUSSD('telecel')).toBe(true);
  });

  it('returns false for Wave', () => {
    expect(supportsUSSD('wave')).toBe(false);
  });
});

describe('normalizePhone', () => {
  it('normalizes 8-digit phone', () => {
    expect(normalizePhone('70123456')).toBe('70123456');
  });

  it('strips spaces', () => {
    expect(normalizePhone('70 12 34 56')).toBe('70123456');
  });

  it('strips +226 prefix', () => {
    expect(normalizePhone('+22670123456')).toBe('70123456');
  });

  it('strips 226 prefix', () => {
    expect(normalizePhone('22670123456')).toBe('70123456');
  });
});

describe('formatPhone', () => {
  it('formats 8 digits with spaces', () => {
    expect(formatPhone('70123456')).toBe('70 12 34 56');
  });
});

describe('formatFCFA', () => {
  it('formats amount with separator', () => {
    const result = formatFCFA(1500);
    expect(result).toContain('1');
    expect(result).toContain('500');
    expect(result).toContain('F');
  });
});
