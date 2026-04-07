import crypto from 'crypto';

// The key should be exactly 32 bytes (256 bits) for aes-256-gcm
// If not provided in env, we use a default fallback (DO NOT use default in production)
const SECRET_KEY = process.env.ENCRYPTION_KEY || 'ins-nepali-swad-2026-super-secrt';
const ALGORITHM = 'aes-256-gcm';

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decrypt(encData: string): string | null {
  try {
    const parts = encData.split(':');
    if (parts.length !== 3) return null;

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedText = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption failed', error);
    return null;
  }
}

export function blindIndex(text: string): string {
  // Deterministic HMAC for database lookup
  return crypto.createHmac('sha256', SECRET_KEY).update(text.toLowerCase().trim()).digest('hex');
}
