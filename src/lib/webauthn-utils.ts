/**
 * Utility for handling WebAuthn (Passkeys) binary-to-string conversions
 * and browser API interactions with support for platform vs roaming authenticators.
 */
export function bufferToBase64URL(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (const charCode of bytes) {
    str += String.fromCharCode(charCode);
  }
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
export function base64URLToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (base64.length % 4)) % 4;
  const str = atob(base64 + '='.repeat(padLen));
  const buffer = new ArrayBuffer(str.length);
  const byteView = new Uint8Array(buffer);
  for (let i = 0; i < str.length; i++) {
    byteView[i] = str.charCodeAt(i);
  }
  return buffer;
}
export async function checkPlatformAuthenticatorSupport(): Promise<boolean> {
  if (!window.PublicKeyCredential) return false;
  return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
}
export interface RegistrationOptions {
  title: string;
  challenge: string;
  attachment?: AuthenticatorAttachment;
  userVerification?: UserVerificationRequirement;
}
export async function registerPasskey({ 
  title, 
  challenge, 
  attachment, 
  userVerification = 'preferred' 
}: RegistrationOptions) {
  if (!window.navigator.credentials) {
    throw new Error('WebAuthn not supported in this browser');
  }
  const challengeBuffer = base64URLToBuffer(challenge);
  const userId = crypto.randomUUID();
  const userBuffer = new TextEncoder().encode(userId);
  const options: PublicKeyCredentialCreationOptions = {
    challenge: challengeBuffer,
    rp: {
      name: 'Sentinel Vault',
      id: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
    },
    user: {
      id: userBuffer,
      name: title,
      displayName: title,
    },
    pubKeyCredParams: [
      { alg: -7, type: 'public-key' }, // ES256
      { alg: -257, type: 'public-key' }, // RS256
    ],
    timeout: 60000,
    attestation: 'none',
    authenticatorSelection: {
      residentKey: 'required',
      requireResidentKey: true,
      userVerification,
      authenticatorAttachment: attachment,
    },
  };
  const credential = (await navigator.credentials.create({
    publicKey: options,
  })) as PublicKeyCredential;
  if (!credential) throw new Error('Failed to create credential');
  const response = credential.response as AuthenticatorAttestationResponse;
  return {
    credentialId: bufferToBase64URL(credential.rawId),
    publicKey: bufferToBase64URL(response.getPublicKey()),
    transports: (response.getTransports ? response.getTransports() : []) as any[],
    authenticatorType: attachment === 'platform' ? 'platform' : 'cross-platform',
  };
}
export async function authenticatePasskey(credentialIds: string[], challenge: string) {
  const challengeBuffer = base64URLToBuffer(challenge);
  const options: PublicKeyCredentialRequestOptions = {
    challenge: challengeBuffer,
    allowCredentials: credentialIds.map(id => ({
      id: base64URLToBuffer(id),
      type: 'public-key',
    })),
    userVerification: 'preferred',
    timeout: 60000,
  };
  const assertion = (await navigator.credentials.get({
    publicKey: options,
  })) as PublicKeyCredential;
  if (!assertion) throw new Error('Authentication failed');
  return {
    id: assertion.id,
    rawId: bufferToBase64URL(assertion.rawId),
  };
}