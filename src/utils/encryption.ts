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
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }
  
  /**
   * Encrypt data
   */
  static async encrypt(data: any, userId: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const salt = window.crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
      const iv = window.crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
      const key = await this.deriveKey(userId, salt);
      
      const encrypted = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoder.encode(JSON.stringify(data))
      );
      
      // Combine salt, iv, and encrypted data
      const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
      combined.set(salt, 0);
      combined.set(iv, salt.length);
      combined.set(new Uint8Array(encrypted), salt.length + iv.length);
      
      // Convert to base64 for storage
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }
  
  /**
   * Decrypt data
   */
  static async decrypt(encryptedData: string, userId: string): Promise<any> {
    try {
      // Convert from base64
      const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
      
      // Extract salt, iv, and encrypted data
      const salt = combined.slice(0, this.SALT_LENGTH);
      const iv = combined.slice(this.SALT_LENGTH, this.SALT_LENGTH + this.IV_LENGTH);
      const encrypted = combined.slice(this.SALT_LENGTH + this.IV_LENGTH);
      
      const key = await this.deriveKey(userId, salt);
      
      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      );
      
      const decoder = new TextDecoder();
      return JSON.parse(decoder.decode(decrypted));
    } catch (error) {
      console.error('Decryption error:', error);
      return null;
    }
  }
  
  /**
   * Store encrypted item in localStorage
   */
  static async setItem(key: string, value: any, userId: string): Promise<void> {
    try {
      const encrypted = await this.encrypt(value, userId);
      localStorage.setItem(`secure_${key}`, encrypted);
    } catch (error) {
      console.error('Failed to store encrypted item:', error);
      // Fallback to session storage for sensitive data
      sessionStorage.setItem(key, JSON.stringify(value));
    }
  }
  
  /**
   * Retrieve and decrypt item from localStorage
   */
  static async getItem(key: string, userId: string): Promise<any> {
    try {
      const encrypted = localStorage.getItem(`secure_${key}`);
      if (!encrypted) {
        // Check fallback session storage
        const sessionData = sessionStorage.getItem(key);
        return sessionData ? JSON.parse(sessionData) : null;
      }
      return await this.decrypt(encrypted, userId);
    } catch (error) {
      console.error('Failed to retrieve encrypted item:', error);
      return null;
    }
  }
  
  /**
   * Remove item from storage
   */
  static removeItem(key: string): void {
    localStorage.removeItem(`secure_${key}`);
    sessionStorage.removeItem(key);
  }
  
  /**
   * Clear all secure storage
   */
  static clear(): void {
    // Clear secure items
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('secure_')) {
        localStorage.removeItem(key);
      }
    });
    sessionStorage.clear();
  }
  
  /**
   * Check if Web Crypto API is available
   */
  static isSupported(): boolean {
    return !!(window.crypto && window.crypto.subtle);
  }
}
