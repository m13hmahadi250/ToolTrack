/**
 * Comprehensive Runtime Polyfills for PDF Engines (pdfjs-dist and pdf-lib)
 * Polyfills ECMAScript 2024/2025 methods required by pdfjs-dist v4/v5/v6:
 * - Promise.try
 * - Uint8Array.prototype.toHex
 * - Uint8Array.fromHex
 * - Uint8Array.prototype.toBase64
 */

// 1. Promise.try polyfill
if (typeof (Promise as any).try !== 'function') {
  (Promise as any).try = function <T>(
    fn: (...args: any[]) => T | PromiseLike<T>,
    ...args: any[]
  ): Promise<T> {
    return new Promise((resolve) => resolve(fn(...args)));
  };
}

// 2. Uint8Array.prototype.toHex polyfill
if (typeof (Uint8Array.prototype as any).toHex !== 'function') {
  (Uint8Array.prototype as any).toHex = function (): string {
    const bytes = this as Uint8Array;
    let hex = '';
    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i];
      hex += (b < 16 ? '0' : '') + b.toString(16);
    }
    return hex;
  };
}

// 3. Uint8Array.fromHex polyfill
if (typeof (Uint8Array as any).fromHex !== 'function') {
  (Uint8Array as any).fromHex = function (hexString: string): Uint8Array {
    if (typeof hexString !== 'string' || hexString.length % 2 !== 0) {
      throw new TypeError('Invalid hex string');
    }
    const len = hexString.length / 2;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = parseInt(hexString.substr(i * 2, 2), 16);
    }
    return bytes;
  };
}

// 4. Uint8Array.prototype.toBase64 polyfill
if (typeof (Uint8Array.prototype as any).toBase64 !== 'function') {
  (Uint8Array.prototype as any).toBase64 = function (): string {
    const bytes = this as Uint8Array;
    let binary = '';
    const len = bytes.length;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    if (typeof btoa === 'function') {
      return btoa(binary);
    }
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(bytes).toString('base64');
    }
    return '';
  };
}

export {};
