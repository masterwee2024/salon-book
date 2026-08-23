import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb, ensureSchema, seed } from "./_lib/db.js";
import { ok } from "./_lib/response.js";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  await ensureSchema();
  await seed();
  const db = getDb();
  const result = await db.execute("SELECT * FROM time_slots WHERE enabled = 1 ORDER BY time ASC");
  return ok(res, { slots: result.rows });
}
