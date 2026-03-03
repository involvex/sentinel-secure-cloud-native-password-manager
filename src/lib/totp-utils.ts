import { authenticator } from '@otplib/preset-default';
export interface OtpAuthInfo {
  secret: string;
  issuer?: string;
  account?: string;
  label?: string;
}
/**
 * Generates a TOTP code and returns the seconds remaining until refresh.
 */
export function generateTOTP(secret: string): { code: string; secondsRemaining: number } {
  try {
    const info = parseOtpAuthUri(secret);
    const rawSecret = info?.secret || secret;
    // Normalize secret: Remove spaces and force uppercase as per RFC 4648
    const cleanSecret = rawSecret?.replace(/\s+/g, '').toUpperCase().trim();
    if (!cleanSecret || cleanSecret.length < 4) {
      return { code: '------', secondsRemaining: 30 };
    }
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
 * Parses an otpauth:// URI to extract metadata.
 */
export function parseOtpAuthUri(uri: string): OtpAuthInfo | null {
  try {
    if (!uri) return null;
    const trimmed = uri.trim();
    if (trimmed.toLowerCase().startsWith('otpauth:')) {
      const url = new URL(trimmed);
      const secret = url.searchParams.get('secret');
      const issuer = url.searchParams.get('issuer');
      // Path usually looks like /totp/Issuer:Account or /totp/Account
      let pathname = decodeURIComponent(url.pathname);
      if (pathname.startsWith('/')) pathname = pathname.slice(1);
      // Standard format is totp/LABEL or totp/ISSUER:ACCOUNT
      const parts = pathname.split('/');
      const label = parts[parts.length - 1];
      let finalIssuer = issuer;
      let account = '';
      if (label.includes(':')) {
        const [lIssuer, lAccount] = label.split(':');
        finalIssuer = finalIssuer || lIssuer;
        account = lAccount;
      } else {
        account = label;
      }
      if (secret) {
        return { 
          secret, 
          issuer: finalIssuer || undefined, 
          account: account || undefined,
          label 
        };
      }
    }
    // Fallback for raw Base32
    if (/^[A-Z2-7=\s]+$/i.test(trimmed)) {
      return { secret: trimmed.replace(/\s+/g, '').toUpperCase() };
    }
    return null;
  } catch (e) {
    // Basic extraction if URL fails
    if (uri.includes('secret=')) {
      const match = uri.match(/secret=([^&]+)/);
      if (match) return { secret: match[1] };
    }
    return null;
  }
}