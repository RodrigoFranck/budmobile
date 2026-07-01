const DEVELOPER_EMAILS = new Set([
  'bpiccoli98@gmail.com',
  'rodrigofranck1990@gmail.com',
]);

export function isDeveloperEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }
  return DEVELOPER_EMAILS.has(email.trim().toLowerCase());
}
