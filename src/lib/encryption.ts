import crypto from "crypto";

// Same AES-256-GCM approach as totp.ts's secret encryption, but with its
// own domain-separated key (a distinct label mixed into the hash) so
// compromising one doesn't hand over the other, even though both ultimately
// derive from AUTH_SECRET.
const ALGORITHM = "aes-256-gcm";

function encryptionKey(): Buffer {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not configured");
  return crypto.createHash("sha256").update(`${secret}:field-encryption`).digest();
}

// For sensitive user-entered values (policy/account numbers, etc.) that
// need to be stored at rest but aren't secrets in the TOTP sense - still
// readable by the household that owns them, just not as plaintext in the
// database. Null-safe: pass null/undefined through unchanged so call sites
// don't need an extra branch for optional fields.
export function encryptField(plaintext: string): string;
export function encryptField(plaintext: string | null | undefined): string | null;
export function encryptField(plaintext: string | null | undefined): string | null {
  if (plaintext == null) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return ["v1", iv.toString("hex"), authTag.toString("hex"), ciphertext.toString("hex")].join(":");
}

export function decryptField(stored: string): string;
export function decryptField(stored: string | null | undefined): string | null;
export function decryptField(stored: string | null | undefined): string | null {
  if (stored == null) return null;
  const parts = stored.split(":");
  // Values written before this encryption existed are plain text with no
  // "v1:" tag - pass them through as-is rather than failing to decrypt,
  // so the one-time backfill script is the only place that needs to care
  // about the transition.
  if (parts[0] !== "v1" || parts.length !== 4) return stored;

  const [, ivHex, authTagHex, ciphertextHex] = parts;
  const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  const plaintext = Buffer.concat([decipher.update(Buffer.from(ciphertextHex, "hex")), decipher.final()]);
  return plaintext.toString("utf8");
}
