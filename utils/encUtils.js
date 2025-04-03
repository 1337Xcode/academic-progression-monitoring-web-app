const crypto = require('crypto');
require('dotenv').config();

const SECRET_KEY = process.env.ENCRYPTION_KEY;
const IV_LENGTH = 16; 

/**
 * Encrypt a message using AES-256-CBC
 */
exports.encrypt = (text) => {
  // Check if text is null or undefined
  if (!text) return text;
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(SECRET_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

/**
 * Decrypt a message using AES-256-CBC
 */
exports.decrypt = (text) => {
  // Check if text is null or undefined
  if (!text) return text;
  
  try {
    const textParts = text.split(':');
    // If the text doesn't have the expected format, it's probably not encrypted
    if (textParts.length !== 2) return text;
    
    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedText = Buffer.from(textParts[1], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(SECRET_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    // If decryption fails, return the original message (backward comp)
    console.error('Decryption failed:', error);
    return text;
  }
};
