import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb, ensureSchema, seed } from "./_lib/db.js";
import { ok, badRequest } from "./_lib/response.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureSchema();
  await seed();

  const { date, stylistId } = req.query as { date?: string; stylistId?: string };

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? ""))
    return badRequest(res, "Invalid date.");
  if (!stylistId)
    return badRequest(res, "stylistId is required.");

  const db = getDb();
  const result = await db.execute({
    sql: "SELECT time FROM appointments WHERE date = ? AND stylistId = ? AND status != 'cancelled'",
    args: [date!, stylistId!],
  });
  const bookedSlots = result.rows.map((r) => r.time as string);
  return ok(res, { bookedSlots });
}
