import { randomBytes } from "node:crypto";

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"; // no ambiguous chars

export function inviteToken(length = 10): string {
  const bytes = randomBytes(length);
  let s = "";
  for (let i = 0; i < length; i++) {
    s += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return s;
}
