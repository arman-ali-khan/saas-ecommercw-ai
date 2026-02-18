
import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'v-7x!A%D*G-KaPdSgUkXp2s5v8y/B?E('; // Must be 32 bytes
const IV_LENGTH = 16;
const PREFIX = 'enc:';

/**
 * Encrypts a string. Returns original if already encrypted or empty.
 */
export function encrypt(text: string | null | undefined): string {
  if (!text || text.startsWith(PREFIX)) return text || '';

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return PREFIX + iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * Decrypts a string. Returns original if not encrypted with our prefix.
 */
export function decrypt(text: string | null | undefined): string {
  if (!text || !text.startsWith(PREFIX)) return text || '';

  try {
    const textParts = text.substring(PREFIX.length).split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error('Decryption failed:', error);
    return text; // Return original on failure
  }
}

/**
 * Recursively decrypts object fields
 */
export function decryptObject(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => decryptObject(item));
  }

  const decrypted: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      decrypted[key] = decrypt(value);
    } else if (typeof value === 'object') {
      decrypted[key] = decryptObject(value);
    } else {
      decrypted[key] = value;
    }
  }
  return decrypted;
}
