
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const ALGORITHM = 'aes-256-gcm';
// Key should be 32 bytes (256 bits)
// If key in env is hex, parse it. If string, use directly (ensure length).
// For simplicity, we assume a 32-char string or use a hashing fallback.
const SECRET_KEY = process.env.ENCRYPTION_KEY
    ? (process.env.ENCRYPTION_KEY.length >= 32 ? process.env.ENCRYPTION_KEY.substring(0, 32) : crypto.createHash('sha256').update(String(process.env.ENCRYPTION_KEY)).digest().slice(0, 32))
    : crypto.createHash('sha256').update('fallback-secret-key-CHANGE_ME_IN_PROD').digest().slice(0, 32);

const IV_LENGTH = 16; // For AES, this is always 16

export const encryptData = (text) => {
    if (!text) return text;
    if (typeof text !== 'string') text = String(text);

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);

    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Return format: IV:AuthTag:EncryptedData
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
};

export const decryptData = (text) => {
    if (!text) return text;
    // Check format
    const parts = text.split(':');
    if (parts.length !== 3) return text; // Not encrypted or invalid format

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedText = Buffer.from(parts[2], 'hex');

    try {
        const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted.toString();
    } catch (err) {
        console.error('Decryption failed:', err);
        return null; // Or throw error based on security policy
    }
};

// Masking PII for display
export const maskData = (text, visibleChars = 4) => {
    if (!text) return '';
    const len = text.length;
    if (len <= visibleChars) return text;
    return '*'.repeat(len - visibleChars) + text.slice(-visibleChars);
};
