/**
 * AES-256-GCM encryption/decryption for SMPP passwords stored in the database.
 * Uses SMPP_ENCRYPTION_KEY env var (min 32 chars, padded/truncated to 32 bytes).
 * Falls back to plaintext comparison when the key is not set.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32 // bytes for AES-256

function getKey(): Buffer {
  const raw = process.env.SMPP_ENCRYPTION_KEY || ''
  // Pad or truncate to exactly 32 bytes
  return Buffer.from(raw.padEnd(KEY_LENGTH, '0').slice(0, KEY_LENGTH), 'utf8')
}

/**
 * Encrypts a plaintext password.
 * Returns a Base64 string in the format: iv:authTag:ciphertext
 */
export function encryptPassword(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(12) // 96-bit IV for GCM
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return [
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted.toString('base64'),
  ].join(':')
}

/**
 * Decrypts a password encrypted with encryptPassword().
 * Returns null if decryption fails or the value is not in encrypted format.
 */
export function decryptPassword(stored: string): string | null {
  try {
    const parts = stored.split(':')
    if (parts.length !== 3) return stored // Legacy plaintext — return as-is
    const [ivB64, authTagB64, encryptedB64] = parts
    const key = getKey()
    const iv = Buffer.from(ivB64, 'base64')
    const authTag = Buffer.from(authTagB64, 'base64')
    const encrypted = Buffer.from(encryptedB64, 'base64')
    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
    return decrypted.toString('utf8')
  } catch {
    // If decryption fails, return null (auth will fail safely)
    return null
  }
}

/**
 * Compares an incoming plaintext password against the stored value,
 * handling both encrypted (AES-GCM) and legacy plaintext formats.
 */
export function verifyPassword(incoming: string, stored: string): boolean {
  if (!process.env.SMPP_ENCRYPTION_KEY) {
    // No encryption key configured — plaintext comparison
    return incoming === stored
  }
  const decoded = decryptPassword(stored)
  if (decoded === null) return false
  return incoming === decoded
}
