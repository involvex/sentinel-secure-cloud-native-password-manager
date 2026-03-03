import { Hono } from "hono";
import type { Env } from './core-utils';
import { UserEntity, VaultItemEntity } from "./entities";
import { ok, bad, notFound } from './core-utils';
import type { VaultItem, User } from "@shared/types";
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // AUTH ENDPOINTS
  app.post('/api/auth/signup', async (c) => {
    const { username, passwordHash, salt } = await c.req.json();
    if (!username || !passwordHash || !salt) return bad(c, 'Missing credentials');
    const users = await UserEntity.list(c.env);
    if (users.items.find(u => u.name === username)) return bad(c, 'User already exists');
    const userId = crypto.randomUUID();
    const user = await UserEntity.create(c.env, {
      id: userId,
      name: username,
      passwordHash,
      salt
    } as any);
    return ok(c, user);
  });
  app.get('/api/auth/salt/:username', async (c) => {
    const username = c.req.param('username');
    const users = await UserEntity.list(c.env);
    const user = users.items.find(u => u.name === username) as any;
    if (!user) return notFound(c, 'User not found');
    return ok(c, { salt: user.salt });
  });
  app.post('/api/auth/login', async (c) => {
    const { username, passwordHash } = await c.req.json();
    const users = await UserEntity.list(c.env);
    const user = users.items.find(u => u.name === username) as any;
    if (!user || user.passwordHash !== passwordHash) {
      return bad(c, 'Invalid credentials');
    }
    return ok(c, user);
  });
  // VAULT ENDPOINTS
  app.get('/api/vault', async (c) => {
    const userId = c.req.header('X-User-Id');
    if (!userId) return bad(c, 'Unauthorized');
    const page = await VaultItemEntity.list(c.env, c.req.query('cursor') ?? null, 100);
    const filtered = page.items.filter(item => (item as any).userId === userId);
    return ok(c, { items: filtered, next: page.next });
  });
  app.post('/api/vault', async (c) => {
    const userId = c.req.header('X-User-Id');
    if (!userId) return bad(c, 'Unauthorized');
    const data = await c.req.json() as VaultItem;
    if (!data.title) return bad(c, 'Title required');
    const item = {
      ...data,
      id: crypto.randomUUID(),
      userId,
      updatedAt: Date.now()
    };
    return ok(c, await VaultItemEntity.create(c.env, item));
  });
  app.post('/api/vault/bulk', async (c) => {
    const userId = c.req.header('X-User-Id');
    if (!userId) return bad(c, 'Unauthorized');
    const items = await c.req.json() as VaultItem[];
    if (!Array.isArray(items)) return bad(c, 'Expected array of items');
    const results = await Promise.all(items.map(item => {
      const newItem = {
        ...item,
        id: item.id || crypto.randomUUID(),
        userId,
        updatedAt: Date.now()
      };
      return VaultItemEntity.create(c.env, newItem as any);
    }));
    return ok(c, { count: results.length });
  });
  app.put('/api/vault/:id', async (c) => {
    const userId = c.req.header('X-User-Id');
    const id = c.req.param('id');
    const data = await c.req.json() as Partial<VaultItem>;
    const entity = new VaultItemEntity(c.env, id);
    const state = await entity.getState() as any;
    if (!state.id) return notFound(c);
    if (state.userId !== userId) return bad(c, 'Forbidden');
    await entity.patch({ ...data, updatedAt: Date.now() });
    return ok(c, await entity.getState());
  });
  app.delete('/api/vault/:id', async (c) => {
    const userId = c.req.header('X-User-Id');
    const id = c.req.param('id');
    const entity = new VaultItemEntity(c.env, id);
    const state = await entity.getState() as any;
    if (!state.id) return notFound(c);
    if (state.userId !== userId) return bad(c, 'Forbidden');
    return ok(c, { deleted: await VaultItemEntity.delete(c.env, id) });
  });
  app.post('/api/auth/challenge', async (c) => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const challenge = btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    return ok(c, { challenge });
  });
}