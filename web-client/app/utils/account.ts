/**
 * Accounts appear in URLs as the first 8 characters of their id —
 * plenty of uniqueness among one user's own accounts.
 */
export function shortAccountId(accountId: string) {
  return accountId.slice(0, 8);
}
