import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb } from "../db.js";

export async function handleAvailability(req: VercelRequest, res: VercelResponse) {
  const { date, stylistId } = req.query as { date?: string; stylistId?: string };

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? ""))
    return res.status(400).json({ error: "Invalid date." });
  if (!stylistId)
    return res.status(400).json({ error: "stylistId is required." });

  const db = getDb();
  const result = await db.execute({
    sql: "SELECT time FROM appointments WHERE date = ? AND stylistId = ? AND status != 'cancelled'",
    args: [date!, stylistId!],
  });
  const bookedSlots = result.rows.map((r) => r.time as string);
  return res.status(200).json({ bookedSlots });
}
