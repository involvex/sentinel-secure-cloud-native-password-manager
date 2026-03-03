import { authenticator } from 'otplib';
/**
 * Generates a TOTP code and returns the seconds remaining until refresh.
 */
export function generateTOTP(secret: string): { code: string; secondsRemaining: number } {
  try {
    // Basic validation of secret
    if (!secret || secret.length < 4) {
      return { code: '000000', secondsRemaining: 30 };
    }
    // otplib expects the secret in a standard format
    const code = authenticator.generate(secret);
    const step = 30; // Standard TOTP step
    const secondsRemaining = step - (Math.floor(Date.now() / 1000) % step);
    return { code, secondsRemaining };
  } catch (err) {
    console.error('TOTP Generation Error:', err);
    return { code: 'ERR', secondsRemaining: 30 };
  }
}
/**
 * Parses an otpauth:// URI to extract the secret.
 */
export function parseOtpAuthUri(uri: string): string | null {
  try {
    const url = new URL(uri);
    if (url.protocol !== 'otpauth:') return null;
    return url.searchParams.get('secret');
  } catch {
    // If not a URI, maybe it's just the raw secret
    return uri.trim() || null;
  }
}