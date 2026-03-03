import { ApiResponse, VaultItem } from "../../shared/types"
import { useAuthStore } from "./auth-store"
import { encryptData, decryptData } from "./crypto-utils"
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const auth = useAuthStore.getState();
  const headers = new Headers(init?.headers);
  if (auth.user?.id) {
    headers.set('X-User-Id', auth.user.id);
  }
  headers.set('Content-Type', 'application/json');
  let body = init?.body;
  // Handle transparent encryption for outgoing vault updates
  const isVaultMutation = path.startsWith('/api/vault') && (init?.method === 'POST' || init?.method === 'PUT');
  if (isVaultMutation && auth.masterKey && body) {
    try {
      const data = JSON.parse(body as string);
      const encryptedData = { ...data };
      if (data.password) encryptedData.password = await encryptData(data.password, auth.masterKey);
      if (data.totpSecret) encryptedData.totpSecret = await encryptData(data.totpSecret, auth.masterKey);
      if (data.notes) encryptedData.notes = await encryptData(data.notes, auth.masterKey);
      body = JSON.stringify(encryptedData);
    } catch (e) {
      console.error("Encryption failed for request", e);
    }
  }
  const res = await fetch(path, { ...init, headers, body });
  const json = (await res.json()) as ApiResponse<T>;
  if (!res.ok || !json.success || json.data === undefined) {
    throw new Error(json.error || 'Request failed');
  }
  // Handle transparent decryption for incoming vault data
  const isVaultFetch = path === '/api/vault' || path.startsWith('/api/vault/');
  if (isVaultFetch && auth.masterKey && json.data) {
    // Decrypt List
    if ((json.data as any).items && Array.isArray((json.data as any).items)) {
      const items = (json.data as any).items as VaultItem[];
      (json.data as any).items = await Promise.all(items.map(i => decryptVaultItem(i, auth.masterKey!)));
    } 
    // Decrypt Single Item
    else if ((json.data as any).id) {
      json.data = await decryptVaultItem(json.data as unknown as VaultItem, auth.masterKey!) as unknown as T;
    }
    // Decrypt Bulk Results (if returned as objects)
    else if ((json.data as any).results && Array.isArray((json.data as any).results)) {
       const results = (json.data as any).results as VaultItem[];
       (json.data as any).results = await Promise.all(results.map(i => decryptVaultItem(i, auth.masterKey!)));
    }
  }
  return json.data;
}
async function decryptVaultItem(item: VaultItem, key: CryptoKey): Promise<VaultItem> {
  const decrypted = { ...item };
  try {
    if (item.password) decrypted.password = await decryptData(item.password, key);
    if (item.totpSecret) decrypted.totpSecret = await decryptData(item.totpSecret, key);
    if (item.notes) decrypted.notes = await decryptData(item.notes, key);
  } catch (e) {
    console.error("Decryption failed for item", item.id, e);
  }
  return decrypted;
}