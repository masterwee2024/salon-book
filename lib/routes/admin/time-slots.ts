import type { VercelRequest, VercelResponse } from "@vercel/node";
import { randomUUID } from "crypto";
import { getDb } from "../../db.js";
import { verifyToken } from "../../auth.js";

export async function handleAdminTimeSlots(req: VercelRequest, res: VercelResponse) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token || !(await verifyToken(token)))
    return res.status(401).json({ error: "Admin authentication required." });

  const db = getDb();
  const url = new URL(req.url ?? "/", `https://${req.headers.host}`);
  const path = url.pathname.replace(/^\/api/, "");
  const idMatch = path.match(/^\/admin\/time-slots\/([^/]+)$/);
  const id = idMatch?.[1];

  if (req.method === "GET" && !id) {
    const result = await db.execute("SELECT * FROM time_slots ORDER BY time ASC");
    return res.status(200).json({ slots: result.rows });
  }

  if (req.method === "POST" && !id) {
    const { time, enabled } = req.body ?? {};
    if (!time || !/^\d{2}:\d{2}$/.test(time))
      return res.status(400).json({ error: "A valid time (HH:mm) is required." });

    const existing = await db.execute({ sql: "SELECT id FROM time_slots WHERE time = ?", args: [time] });
    if (existing.rows.length > 0)
      return res.status(409).json({ error: "Time slot already exists." });

    const newId = randomUUID();
    await db.execute({
      sql: "INSERT INTO time_slots (id, time, enabled) VALUES (?, ?, ?)",
      args: [newId, time, enabled !== false ? 1 : 0],
    });
    const result = await db.execute({ sql: "SELECT * FROM time_slots WHERE id = ?", args: [newId] });
    return res.status(201).json({ slot: result.rows[0] });
  }

  if (req.method === "PUT" && id) {
    const existing = await db.execute({ sql: "SELECT * FROM time_slots WHERE id = ?", args: [id] });
    if (existing.rows.length === 0) return res.status(404).json({ error: "Not found." });

    const ex = existing.rows[0] as Record<string, unknown>;
    const { time, enabled } = req.body ?? {};

    await db.execute({
      sql: "UPDATE time_slots SET time = ?, enabled = ? WHERE id = ?",
      args: [time ?? ex.time, enabled !== undefined ? (enabled ? 1 : 0) : ex.enabled, id],
    });
    const result = await db.execute({ sql: "SELECT * FROM time_slots WHERE id = ?", args: [id] });
    return res.status(200).json({ slot: result.rows[0] });
  }

  if (req.method === "DELETE" && id) {
    await db.execute({ sql: "DELETE FROM time_slots WHERE id = ?", args: [id] });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed." });
}
