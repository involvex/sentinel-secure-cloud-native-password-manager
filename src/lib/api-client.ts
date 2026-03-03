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
  // Handle transparent encryption for vault items
  if (path.startsWith('/api/vault') && auth.masterKey && (init?.method === 'POST' || init?.method === 'PUT')) {
    const data = JSON.parse(body as string);
    const encryptedData = { ...data };
    if (data.password) encryptedData.password = await encryptData(data.password, auth.masterKey);
    if (data.totpSecret) encryptedData.totpSecret = await encryptData(data.totpSecret, auth.masterKey);
    if (data.notes) encryptedData.notes = await encryptData(data.notes, auth.masterKey);
    body = JSON.stringify(encryptedData);
  }
  const res = await fetch(path, { ...init, headers, body });
  const json = (await res.json()) as ApiResponse<T>;
  if (!res.ok || !json.success || json.data === undefined) {
    throw new Error(json.error || 'Request failed');
  }
  // Handle transparent decryption for vault items
  if (path === '/api/vault' && auth.masterKey && json.data && (json.data as any).items) {
    const items = (json.data as any).items as VaultItem[];
    const decryptedItems = await Promise.all(items.map(async (item) => {
      const decrypted = { ...item };
      if (item.password) decrypted.password = await decryptData(item.password, auth.masterKey!);
      if (item.totpSecret) decrypted.totpSecret = await decryptData(item.totpSecret, auth.masterKey!);
      if (item.notes) decrypted.notes = await decryptData(item.notes, auth.masterKey!);
      return decrypted;
    }));
    (json.data as any).items = decryptedItems;
  }
  return json.data;
}