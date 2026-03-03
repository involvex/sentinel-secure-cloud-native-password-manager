/**
 * Zero-Knowledge Cryptography Utilities
 * Uses the Web Crypto API for secure key derivation and AES-GCM encryption.
 */
const ITERATIONS = 100000;
const KEY_ALGO = 'AES-GCM';
const HASH_ALGO = 'SHA-256';
export async function deriveMasterKey(password: string, salt: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const saltBuffer = encoder.encode(salt);
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: ITERATIONS,
      hash: HASH_ALGO,
    },
    baseKey,
    { name: KEY_ALGO, length: 256 },
    false, // Key is not extractable for maximum security
    ['encrypt', 'decrypt']
  );
}
export async function encryptData(data: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedData = encoder.encode(data);
  const encrypted = await window.crypto.subtle.encrypt(
    { name: KEY_ALGO, iv },
    key,
    encodedData
  );
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
export async function decryptData(encryptedBase64: string, key: CryptoKey): Promise<string> {
  try {
    const binary = atob(encryptedBase64.replace(/-/g, '+').replace(/_/g, '/'));
    const combined = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) combined[i] = binary.charCodeAt(i);
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    const decrypted = await window.crypto.subtle.decrypt(
      { name: KEY_ALGO, iv },
      key,
      data
    );
    return new TextDecoder().decode(decrypted);
  } catch (err) {
    console.error('Decryption failed:', err);
    return '[Decryption Failed]';
  }
}
export function generateSalt(): string {
  const array = window.crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
export async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hash = await window.crypto.subtle.digest(HASH_ALGO, data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}