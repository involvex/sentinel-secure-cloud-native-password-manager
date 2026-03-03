import { authenticator } from '@otplib/preset-default';
/**
 * Generates a TOTP code and returns the seconds remaining until refresh.
 * Standard TOTP (Time-based One-Time Password) follows RFC 6238.
 * It uses a 30-second window (step) to derive a 6-digit code from a Base32 secret.
 */
export function generateTOTP(secret: string): { code: string; secondsRemaining: number } {
  try {
    const rawSecret = parseOtpAuthUri(secret) || secret;
    // Normalize secret: Remove spaces and force uppercase as per RFC 4648 / RFC 6238
    const cleanSecret = rawSecret?.replace(/\s+/g, '').toUpperCase().trim();
    if (!cleanSecret || cleanSecret.length < 4) {
      return { code: '------', secondsRemaining: 30 };
    }
    // @otplib/preset-default authenticator produces standard TOTP (Google Authenticator compatible)
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
 * Handles complex URIs provided by services like Google, GitHub, and Discord.
 */
export function parseOtpAuthUri(uri: string): string | null {
  try {
    if (!uri) return null;
    const trimmed = uri.trim();
    // Check if it's a URI
    if (trimmed.toLowerCase().startsWith('otpauth:')) {
      const url = new URL(trimmed);
      // The secret is stored in the 'secret' query parameter
      const secret = url.searchParams.get('secret');
      return secret;
    }
    // If it contains characters often found in Base32 but not a full URI
    // we return the trimmed string to be cleaned by generateTOTP
    return trimmed;
  } catch (e) {
    // If URL parsing fails but it starts with otpauth, try manual split
    if (uri.includes('secret=')) {
      const parts = uri.split('secret=');
      if (parts[1]) {
        return parts[1].split('&')[0];
      }
    }
    return null;
  }
}