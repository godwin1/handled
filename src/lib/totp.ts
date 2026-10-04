import crypto from "crypto";
import * as OTPAuth from "otpauth";
import bcrypt from "bcryptjs";

const ALGORITHM = "aes-256-gcm";

function encryptionKey(): Buffer {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not configured");
  return crypto.createHash("sha256").update(secret).digest();
}

// Secrets are TOTP seeds - compromise lets an attacker generate valid codes
// forever, so they're encrypted at rest rather than stored plaintext like
// the user-facing fields.
export function encryptSecret(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("hex"), authTag.toString("hex"), ciphertext.toString("hex")].join(":");
}

export function decryptSecret(stored: string): string {
  const [ivHex, authTagHex, ciphertextHex] = stored.split(":");
  const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  const plaintext = Buffer.concat([decipher.update(Buffer.from(ciphertextHex, "hex")), decipher.final()]);
  return plaintext.toString("utf8");
}

export function generateTotpSecret(): string {
  return new OTPAuth.Secret({ size: 20 }).base32;
}

export function buildOtpauthUrl(params: { secret: string; email: string }): string {
  const totp = new OTPAuth.TOTP({
    issuer: "Handled",
    label: params.email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(params.secret),
  });
  return totp.toString();
}

// Allows the immediately-previous and next 30s window too, so a slightly
// clock-skewed phone or slow typing doesn't fail a correct code.
export function verifyTotpCode(secret: string, code: string): boolean {
  const totp = new OTPAuth.TOTP({
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
  const delta = totp.validate({ token: code.trim(), window: 1 });
  return delta !== null;
}

const BACKUP_CODE_COUNT = 10;

export function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    // 10 hex chars grouped for readability, e.g. "a1b2-c3d4e5"
    const raw = crypto.randomBytes(5).toString("hex");
    codes.push(`${raw.slice(0, 4)}-${raw.slice(4)}`);
  }
  return codes;
}

export async function hashBackupCode(code: string): Promise<string> {
  return bcrypt.hash(code.trim().toLowerCase(), 10);
}

export async function verifyBackupCode(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code.trim().toLowerCase(), hash);
}
