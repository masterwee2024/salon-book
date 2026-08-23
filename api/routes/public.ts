import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb } from "../_lib/db.js";

export async function handleServices(_req: VercelRequest, res: VercelResponse) {
  const db = getDb();
  const result = await db.execute("SELECT * FROM services ORDER BY name ASC");
  return res.status(200).json({ services: result.rows });
}

export async function handleStylists(_req: VercelRequest, res: VercelResponse) {
  const db = getDb();
  const result = await db.execute("SELECT * FROM stylists ORDER BY name ASC");
  return res.status(200).json({ stylists: result.rows });
}

export async function handleTimeSlots(_req: VercelRequest, res: VercelResponse) {
  const db = getDb();
  const result = await db.execute("SELECT * FROM time_slots WHERE enabled = 1 ORDER BY time ASC");
  return res.status(200).json({ slots: result.rows });
}
