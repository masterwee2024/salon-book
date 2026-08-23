import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb } from "../db.js";
import { normalizeMalaysianMobile } from "../phone.js";

export async function handleCancelAppointment(req: VercelRequest, res: VercelResponse, id: string) {
  const { clientPhone } = req.body ?? {};

  const db = getDb();
  const result = await db.execute({ sql: "SELECT * FROM appointments WHERE id = ?", args: [id] });
  const appt = result.rows[0] as unknown as { clientPhone: string } | undefined;

  if (!appt) return res.status(404).json({ error: "Not found." });

  if (normalizeMalaysianMobile(clientPhone ?? "") !== appt.clientPhone)
    return res.status(403).json({ error: "Phone number does not match this booking." });

  await db.execute({ sql: "UPDATE appointments SET status = 'cancelled' WHERE id = ?", args: [id] });
  const updated = await db.execute({ sql: "SELECT * FROM appointments WHERE id = ?", args: [id] });

  return res.status(200).json({ appointment: updated.rows[0] });
}
