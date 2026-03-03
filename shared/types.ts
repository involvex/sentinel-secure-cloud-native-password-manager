export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export interface SecurityStats {
  healthScore: number;
  weakCount: number;
  reusedCount: number;
  breachedCount: number;
  twoFactorPercentage: number;
}
export type VaultItemType = 'login' | 'card' | 'note' | 'passkey' | 'alias' | 'identity' | 'wifi' | 'ssh' | 'passport' | 'monitor';
export type AuthenticatorTransport = 'usb' | 'nfc' | 'ble' | 'internal' | 'hybrid';
export type AuthenticatorType = 'platform' | 'cross-platform';
export interface PasskeyData {
  id: string;
  label: string;
  credentialId: string;
  publicKey: string;
  transports: AuthenticatorTransport[];
  authenticatorType: AuthenticatorType;
  lastUsedAt?: number;
  createdAt: number;
}
export interface CustomField {
  id: string;
  label: string;
  value: string;
  isSecret: boolean;
  isSecret: boolean;
}
export type CardType = 'visa' | 'mastercard' | 'amex' | 'discover' | 'jcb' | 'other';
export interface CreditCardData {
  number: string;
  holderName: string;
  expiryDate: string; // MM/YY
  cvv: string;
  cardType: CardType;
}
export interface PassportData {
  number: string;
  issuingCountry: string;
  expiryDate: string;
  type: string;
}
export interface VaultItem {
  id: string;
  type: VaultItemType;
  title: string;
  username?: string;
  password?: string;
  url?: string;
  notes?: string;
  folder?: string;
  tags?: string[];
  totpSecret?: string;
  passkeys?: PasskeyData[];
  isBreached?: boolean;
  breachDate?: number;
  favorite: boolean;
  updatedAt: number;
  // Type-specific fields
  aliasEmail?: string;
  cardDetails?: CreditCardData;
  passportDetails?: PassportData;
  identityName?: string;
  address?: string;
  dob?: string;
  phone?: string;
  ssid?: string;
  wifiPassword?: string;
  sshHost?: string;
  sshKey?: string;
  passportNumber?: string;
  customFields?: CustomField[];
}
export interface User {
  id: string;
  name: string;
}
export interface Chat {
  id: string;
  title: string;
}
export interface ChatMessage {
  id: string;
  chatId: string;
  userId: string;
  text: string;
  ts: number;
}