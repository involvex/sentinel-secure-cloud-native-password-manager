import { Hono } from "hono";
import type { Env } from './core-utils';
import { UserEntity, VaultItemEntity } from "./entities";
import { ok, bad, notFound } from './core-utils';
import type { VaultItem } from "@shared/types";
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // VAULT ENDPOINTS
  app.get('/api/vault', async (c) => {
    const page = await VaultItemEntity.list(c.env, c.req.query('cursor') ?? null, 100);
    return ok(c, page);
  });
  app.post('/api/vault', async (c) => {
    const data = await c.req.json() as VaultItem;
    if (!data.title) return bad(c, 'Title required');
    // Support legacy passkeyData or new passkeys array
    if (data.type === 'passkey') {
      const hasCreds = (data.passkeys && data.passkeys.length > 0);
      if (!hasCreds) return bad(c, 'At least one passkey credential is required');
    }
    const item = { ...data, id: crypto.randomUUID(), updatedAt: Date.now() };
    return ok(c, await VaultItemEntity.create(c.env, item));
  });
  // BULK IMPORT
  app.post('/api/vault/bulk', async (c) => {
    const items = await c.req.json() as VaultItem[];
    if (!Array.isArray(items)) return bad(c, 'Expected array of items');
    const results = await Promise.all(items.map(async (item) => {
      const sanitized = {
        ...item,
        id: item.id || crypto.randomUUID(),
        updatedAt: item.updatedAt || Date.now(),
        // Migrate legacy single passkey to array if needed
        passkeys: item.passkeys || []
      };
      return VaultItemEntity.create(c.env, sanitized);
    }));
    return ok(c, { count: results.length });
  });
  app.put('/api/vault/:id', async (c) => {
    const id = c.req.param('id');
    const data = await c.req.json() as Partial<VaultItem>;
    const entity = new VaultItemEntity(c.env, id);
    if (!await entity.exists()) return notFound(c);
    await entity.patch({ ...data, updatedAt: Date.now() });
    return ok(c, await entity.getState());
  });
  app.delete('/api/vault/:id', async (c) => {
    const id = c.req.param('id');
    return ok(c, { deleted: await VaultItemEntity.delete(c.env, id) });
  });
  // WEBAUTHN CHALLENGE
  app.post('/api/auth/challenge', async (c) => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const challenge = btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    return ok(c, { challenge });
  });
  // USERS
  app.get('/api/users', async (c) => {
    await UserEntity.ensureSeed(c.env);
    return ok(c, await UserEntity.list(c.env));
  });
}