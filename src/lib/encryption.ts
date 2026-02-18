
import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const RAW_KEY = process.env.ENCRYPTION_KEY || 'v-7x!A%D*G-KaPdSgUkXp2s5v8y/B?E('; 
const IV_LENGTH = 16;
const PREFIX = 'enc:';

// Ensure the key is exactly 32 bytes for AES-256
const ENCRYPTION_KEY = Buffer.alloc(32);
Buffer.from(RAW_KEY).copy(ENCRYPTION_KEY);

/**
 * Encrypts a string. Returns original if already encrypted or empty.
 */
export function encrypt(text: string | null | undefined): string {
  if (text === null || text === undefined || text === '') return '';
  if (typeof text !== 'string') return String(text);
  if (text.startsWith(PREFIX)) return text;

  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return PREFIX + iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (error) {
    console.error('Encryption failed:', error);
    return text;
  }
}

/**
 * Decrypts a string. Returns original if not encrypted with our prefix.
 */
export function decrypt(text: string | null | undefined): string {
  if (!text || typeof text !== 'string' || !text.startsWith(PREFIX)) return text || '';

  try {
    const textParts = text.substring(PREFIX.length).split(':');
    const ivString = textParts.shift();
    const encryptedString = textParts.join(':');
    
    if (!ivString || !encryptedString) return text;

    const iv = Buffer.from(ivString, 'hex');
    const encryptedText = Buffer.from(encryptedString, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error('Decryption failed:', error);
    return text; // Return original on failure
  }
}

/**
 * Recursively decrypts object fields. Safely handles non-object values.
 */
export function decryptObject(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  // Handle Dates which are technically objects
  if (obj instanceof Date) return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => decryptObject(item));
  }

  const decrypted: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && value.startsWith(PREFIX)) {
      decrypted[key] = decrypt(value);
    } else if (value !== null && typeof value === 'object') {
      decrypted[key] = decryptObject(value);
    } else {
      decrypted[key] = value;
    }
  }
  return decrypted;
}
