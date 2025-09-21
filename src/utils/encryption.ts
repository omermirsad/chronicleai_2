// src/utils/encryption.ts

/**
 * Secure storage utility using Web Crypto API
 * Note: For production, consider using a library like crypto-js for broader browser support
 */
export class SecureStorage {
  private static readonly SALT_LENGTH = 16;
  private static readonly IV_LENGTH = 12;
  private static readonly ITERATIONS = 100000;
  
  /**
   * Derive an encryption key from user ID and password
   */
  private static async deriveKey(userId: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(userId + (import.meta.env.VITE_ENCRYPTION_SECRET || 'chronicle-ai-2024')),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    
    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: this.ITERATIONS,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'A
