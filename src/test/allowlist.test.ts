import { describe, it, expect } from 'vitest';
import { isEmailConfiguredAllowed, getPartnerEmail, normalizeEmail } from '../utils/allowlist';

describe('Allowlist Security and Authorization Logic', () => {
  it('correctly normalizes email strings with whitespace and casing', () => {
    expect(normalizeEmail('  Alice@Example.COM  ')).toBe('alice@example.com');
    expect(normalizeEmail(null)).toBe('');
    expect(normalizeEmail(undefined)).toBe('');
  });

  it('permits configured authorized email accounts', () => {
    // configured in .env as alice@example.com and bob@example.com
    expect(isEmailConfiguredAllowed('alice@example.com')).toBe(true);
    expect(isEmailConfiguredAllowed('ALICE@example.com')).toBe(true);
    expect(isEmailConfiguredAllowed('bob@example.com')).toBe(true);
    expect(isEmailConfiguredAllowed('  Bob@Example.com  ')).toBe(true);
  });

  it('strictly rejects unauthorized email accounts', () => {
    expect(isEmailConfiguredAllowed('eve@attacker.com')).toBe(false);
    expect(isEmailConfiguredAllowed('mallory@intruder.io')).toBe(false);
    expect(isEmailConfiguredAllowed('random@gmail.com')).toBe(false);
    expect(isEmailConfiguredAllowed('')).toBe(false);
    expect(isEmailConfiguredAllowed(null)).toBe(false);
  });

  it('correctly returns the paired partner email', () => {
    expect(getPartnerEmail('alice@example.com')).toBe('bob@example.com');
    expect(getPartnerEmail('bob@example.com')).toBe('alice@example.com');
    expect(getPartnerEmail('unknown@other.com')).toBeNull();
  });
});
