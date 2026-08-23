import type { VercelRequest, VercelResponse } from "@vercel/node";
import { randomUUID } from "crypto";
import { getDb, ensureSchema } from "../../_lib/db.js";
import { verifyToken } from "../../_lib/auth.js";
import { ok, created, badRequest, unauthorized } from "../../_lib/response.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureSchema();

  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token || !(await verifyToken(token)))
    return unauthorized(res);

  const db = getDb();

  if (req.method === "GET") {
    const result = await db.execute("SELECT * FROM stylists ORDER BY name ASC");
    return ok(res, { stylists: result.rows });
  }

  if (req.method === "POST") {
    const { name, specialties } = req.body ?? {};
    if (!name) return badRequest(res, "name is required.");

    const id = randomUUID();
    await db.execute({
      sql: "INSERT INTO stylists (id, name, specialties) VALUES (?, ?, ?)",
      args: [id, name, specialties ?? ""],
    });
    const result = await db.execute({ sql: "SELECT * FROM stylists WHERE id = ?", args: [id] });
    return created(res, { stylist: result.rows[0] });
  }

  return badRequest(res, "Method not allowed.");
}
