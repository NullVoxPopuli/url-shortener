/**
 * xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx
 */
export function isUUID(maybe: string) {
  if (maybe.length !== 36) return false;

  let parts = maybe.split('-');

  if (parts.length !== 5) return false;

  if (parts[0].length !== 8) return false;
  if (parts[1].length !== 4) return false;
  if (parts[2].length !== 4) return false;
  if (parts[3].length !== 4) return false;
  if (parts[4].length !== 12) return false;

  return true;
}
