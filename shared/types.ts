export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export type VaultItemType = 'login' | 'card' | 'note' | 'passkey';
export interface PasskeyData {
  credentialId: string;
  publicKey: string;
  transports?: string[];
  signCount: number;
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
  passkeyData?: PasskeyData;
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