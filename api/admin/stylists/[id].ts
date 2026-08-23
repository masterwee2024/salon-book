import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb, ensureSchema } from "../../_lib/db.js";
import { verifyToken } from "../../_lib/auth.js";
import { ok, badRequest, unauthorized, notFound } from "../../_lib/response.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureSchema();

  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token || !(await verifyToken(token)))
    return unauthorized(res);

  const { id } = req.query as { id: string };
  const db = getDb();

  if (req.method === "PUT") {
    const existing = await db.execute({ sql: "SELECT * FROM stylists WHERE id = ?", args: [id] });
    if (existing.rows.length === 0) return notFound(res);

    const ex = existing.rows[0] as Record<string, unknown>;
    const { name, specialties } = req.body ?? {};

    await db.execute({
      sql: "UPDATE stylists SET name = ?, specialties = ? WHERE id = ?",
      args: [name ?? ex.name, specialties ?? ex.specialties, id],
    });
    const result = await db.execute({ sql: "SELECT * FROM stylists WHERE id = ?", args: [id] });
    return ok(res, { stylist: result.rows[0] });
  }

  if (req.method === "DELETE") {
    await db.execute({ sql: "DELETE FROM stylists WHERE id = ?", args: [id] });
    return ok(res, { ok: true });
  }

  return badRequest(res, "Method not allowed.");
}
