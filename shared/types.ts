export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export type VaultItemType = 'login' | 'card' | 'note' | 'passkey';
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
  favorite: boolean;
  updatedAt: number;
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