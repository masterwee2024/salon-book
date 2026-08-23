import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb, ensureSchema } from "../../_lib/db.js";
import { normalizeMalaysianMobile } from "../../_lib/phone.js";
import { ok, badRequest, notFound, forbidden } from "../../_lib/response.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureSchema();

  if (req.method !== "PATCH")
    return badRequest(res, "Method not allowed.");

  const { id } = req.query as { id: string };
  const { clientPhone } = req.body ?? {};

  const db = getDb();
  const result = await db.execute({ sql: "SELECT * FROM appointments WHERE id = ?", args: [id] });
  const appt = result.rows[0] as unknown as { clientPhone: string } | undefined;

  if (!appt) return notFound(res);

  if (normalizeMalaysianMobile(clientPhone ?? "") !== appt.clientPhone)
    return forbidden(res, "Phone number does not match this booking.");

  await db.execute({ sql: "UPDATE appointments SET status = 'cancelled' WHERE id = ?", args: [id] });
  const updated = await db.execute({ sql: "SELECT * FROM appointments WHERE id = ?", args: [id] });

  return ok(res, { appointment: updated.rows[0] });
}
