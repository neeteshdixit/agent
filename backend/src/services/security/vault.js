import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const SALT_LENGTH = 64;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;
const DIGEST = 'sha256';

export const vaultService = {
  /**
   * Encrypts plain text using AES-256-GCM with a key derived from the user's master key.
   * @param {string} text - Plain text credential to encrypt.
   * @param {string} userMasterKey - User's master key / passkey (used to derive encryption key).
   * @returns {object} Object containing encrypted metadata.
   */
  encrypt: (text, userMasterKey) => {
    if (!text || !userMasterKey) {
      throw new Error('Text and master key are required for encryption');
    }
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);

    // Derive key using PBKDF2
    const key = crypto.pbkdf2Sync(userMasterKey, salt, ITERATIONS, KEY_LENGTH, DIGEST);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return {
      iv: iv.toString('hex'),
      salt: salt.toString('hex'),
      authTag,
      encryptedData: encrypted,
    };
  },

  /**
   * Decrypts AES-256-GCM encrypted payload using the user's master key.
   * @param {object} encryptedObject - Payload containing iv, salt, authTag, and encryptedData.
   * @param {string} userMasterKey - User's master key / passkey.
   * @returns {string} Decrypted original text.
   */
  decrypt: (encryptedObject, userMasterKey) => {
    if (!encryptedObject || !userMasterKey) {
      throw new Error('Encrypted payload and master key are required for decryption');
    }
    const { iv, salt, authTag, encryptedData } = encryptedObject;
    if (!iv || !salt || !authTag || !encryptedData) {
      throw new Error('Invalid encrypted payload structure');
    }

    const ivBuf = Buffer.from(iv, 'hex');
    const saltBuf = Buffer.from(salt, 'hex');
    const authTagBuf = Buffer.from(authTag, 'hex');

    const key = crypto.pbkdf2Sync(userMasterKey, saltBuf, ITERATIONS, KEY_LENGTH, DIGEST);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuf);
    decipher.setAuthTag(authTagBuf);

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  },
};
