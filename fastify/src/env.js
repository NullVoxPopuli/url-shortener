import assert from "node:assert";

export const PORT = String(process.env.PORT || 5001);
export const DATABASE_URL = process.env.DATABASE_URL;
export const COOKIE_SECRET = process.env.COOKIE_SECRET;

assert(DATABASE_URL, "DATABASE_URL must be set");
assert(COOKIE_SECRET, "COOKIE_SECRET must be set");
