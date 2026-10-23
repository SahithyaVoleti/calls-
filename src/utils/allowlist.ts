/**
 * Allowlist Configuration & Validation
 *
 * TogetherSpace is a private sanctuary built for exactly two authorized users.
 * The two authorized email addresses are configured via environment variables:
 * - VITE_AUTHORIZED_EMAIL_1
 * - VITE_AUTHORIZED_EMAIL_2
 *
 * Server-side / Firestore rules strictly check against the authorized_users collection
 * to ensure no unauthorized user can read or write any call, message, or user profile data.
 */

export function normalizeEmail(email: string | null | undefined): string {
  if (!email) return '';
  return email.trim().toLowerCase();
}

export function getConfiguredAuthorizedEmails(): string[] {
  const email1 = normalizeEmail(import.meta.env.VITE_AUTHORIZED_EMAIL_1);
  const email2 = normalizeEmail(import.meta.env.VITE_AUTHORIZED_EMAIL_2);

  const list: string[] = [];
  if (email1) list.push(email1);
  if (email2 && email2 !== email1) list.push(email2);

  return list;
}

export function isEmailConfiguredAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = normalizeEmail(email);
  const allowed = getConfiguredAuthorizedEmails();

  // If no environment variables are configured yet in dev, we return false
  // to avoid accidentally granting access to arbitrary accounts.
  if (allowed.length === 0) {
    return false;
  }

  return allowed.includes(normalized);
}

export function getPartnerEmail(currentEmail: string | null | undefined): string | null {
  if (!currentEmail) return null;
  const normalized = normalizeEmail(currentEmail);
  const allowed = getConfiguredAuthorizedEmails();

  if (allowed.length < 2) return null;
  if (allowed[0] === normalized) return allowed[1];
  if (allowed[1] === normalized) return allowed[0];

  return null;
}
