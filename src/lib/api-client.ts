import { ApiResponse, VaultItem } from "../../shared/types"
import { useAuthStore } from "./auth-store"
import { encryptData, decryptData } from "./crypto-utils"
const SECRET_FIELDS = [
  'password',
  'totpSecret',
  'notes',
  'wifiPassword',
  'sshKey',
  'passportNumber',
  'address',
  'phone',
  'cardNumber',
  'cvv',
  'identityName'
];
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const auth = useAuthStore.getState();
  const headers = new Headers(init?.headers);
  if (auth.user?.id) {
    headers.set('X-User-Id', auth.user.id);
  }
  headers.set('Content-Type', 'application/json');
  let body = init?.body;
  const isVaultMutation = path.startsWith('/api/vault') && (init?.method === 'POST' || init?.method === 'PUT');
  if (isVaultMutation && auth.masterKey && body) {
    try {
      const data = JSON.parse(body as string);
      const encryptedData = { ...data };
      for (const field of SECRET_FIELDS) {
        if (data[field] && typeof data[field] === 'string' && data[field].length > 0) {
          encryptedData[field] = await encryptData(data[field], auth.masterKey);
        }
      }
      body = JSON.stringify(encryptedData);
    } catch (e) {
      console.error("[SENTINEL] Encryption failed for vault mutation", e);
    }
  }
  const res = await fetch(path, { ...init, headers, body });
  const json = (await res.json()) as ApiResponse<T>;
  if (!res.ok || !json.success || json.data === undefined) {
    throw new Error(json.error || 'Sentinel API request failed');
  }
  const isVaultFetch = path === '/api/vault' || path.startsWith('/api/vault/');
  if (isVaultFetch && auth.masterKey && json.data) {
    if ((json.data as any).items && Array.isArray((json.data as any).items)) {
      (json.data as any).items = await Promise.all(((json.data as any).items as VaultItem[]).map(i => decryptVaultItem(i, auth.masterKey!)));
    } else if ((json.data as any).id) {
      json.data = await decryptVaultItem(json.data as unknown as VaultItem, auth.masterKey!) as unknown as T;
    }
  }
  return json.data;
}
async function decryptVaultItem(item: VaultItem, key: CryptoKey): Promise<VaultItem> {
  const decrypted = { ...item };
  try {
    for (const field of SECRET_FIELDS) {
      const val = (item as any)[field];
      // Decryption heuristic: Encrypted blobs in our system are base64-ish and typically > 20 chars
      if (val && typeof val === 'string' && val.length > 20) {
        try {
          (decrypted as any)[field] = await decryptData(val, key);
        } catch (innerErr) {
          // If decryption fails, it might be legacy plaintext or corrupted; keep as is
          console.warn(`[SENTINEL] Could not decrypt field ${field} for item ${item.id}`);
        }
      }
    }
  } catch (e) {
    console.error("[SENTINEL] Critical failure in item decryption logic", item.id, e);
  }
  return decrypted;
}