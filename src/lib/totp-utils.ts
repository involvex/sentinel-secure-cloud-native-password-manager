import { authenticator } from 'otplib';
/**
 * Generates a TOTP code and returns the seconds remaining until refresh.
 * Standard TOTP (Time-based One-Time Password) follows RFC 6238.
 * It uses a 30-second window (step) to derive a 6-digit code from a Base32 secret.
 */
export function generateTOTP(secret: string): { code: string; secondsRemaining: number } {
  try {
    const cleanSecret = secret?.trim();
    if (!cleanSecret || cleanSecret.length < 4) {
      return { code: '------', secondsRemaining: 30 };
    }
    // otplib's authenticator is usually preferred for standard Google Authenticator style TOTPs
    const code = authenticator.generate(cleanSecret);
    const step = 30;
    const secondsRemaining = step - (Math.floor(Date.now() / 1000) % step);
    return { code, secondsRemaining };
  } catch (err) {
    console.error('TOTP Generation Error:', err);
    return { code: 'ERROR', secondsRemaining: 30 };
  }
}
/**
 * Parses an otpauth:// URI to extract the secret or returns raw string if already a secret.
 */
export function parseOtpAuthUri(uri: string): string | null {
  try {
    if (!uri) return null;
    const trimmed = uri.trim();
    if (trimmed.startsWith('otpauth:')) {
      const url = new URL(trimmed);
      return url.searchParams.get('secret');
    }
    return trimmed;
  } catch {
    return null;
  }
}