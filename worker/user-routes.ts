import { Hono } from "hono";
import type { Env } from './core-utils';
import { UserEntity, VaultItemEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
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
    const item = { ...data, id: crypto.randomUUID(), updatedAt: Date.now() };
    return ok(c, await VaultItemEntity.create(c.env, item));
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
  // USERS (legacy demo)
  app.get('/api/users', async (c) => {
    await UserEntity.ensureSeed(c.env);
    return ok(c, await UserEntity.list(c.env));
  });
}