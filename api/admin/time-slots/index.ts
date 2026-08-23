import type { VercelRequest, VercelResponse } from "@vercel/node";
import { randomUUID } from "crypto";
import { getDb, ensureSchema } from "../../_lib/db.js";
import { verifyToken } from "../../_lib/auth.js";
import { ok, created, badRequest, unauthorized, conflict } from "../../_lib/response.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureSchema();

  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token || !(await verifyToken(token)))
    return unauthorized(res);

  const db = getDb();

  if (req.method === "GET") {
    const result = await db.execute("SELECT * FROM time_slots ORDER BY time ASC");
    return ok(res, { slots: result.rows });
  }

  if (req.method === "POST") {
    const { time, enabled } = req.body ?? {};
    if (!time || !/^\d{2}:\d{2}$/.test(time))
      return badRequest(res, "A valid time (HH:mm) is required.");

    const existing = await db.execute({ sql: "SELECT id FROM time_slots WHERE time = ?", args: [time] });
    if (existing.rows.length > 0)
      return conflict(res, "Time slot already exists.");

    const id = randomUUID();
    await db.execute({
      sql: "INSERT INTO time_slots (id, time, enabled) VALUES (?, ?, ?)",
      args: [id, time, enabled !== false ? 1 : 0],
    });
    const result = await db.execute({ sql: "SELECT * FROM time_slots WHERE id = ?", args: [id] });
    return created(res, { slot: result.rows[0] });
  }

  return badRequest(res, "Method not allowed.");
}
