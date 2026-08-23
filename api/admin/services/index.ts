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
    const result = await db.execute("SELECT * FROM services ORDER BY name ASC");
    return ok(res, { services: result.rows });
  }

  if (req.method === "POST") {
    const { name, duration, price, description } = req.body ?? {};
    if (!name || !duration || price == null)
      return badRequest(res, "name, duration, price are required.");

    const id = randomUUID();
    await db.execute({
      sql: "INSERT INTO services (id, name, duration, price, description) VALUES (?, ?, ?, ?, ?)",
      args: [id, name, duration, price, description ?? ""],
    });
    const result = await db.execute({ sql: "SELECT * FROM services WHERE id = ?", args: [id] });
    return created(res, { service: result.rows[0] });
  }

  return badRequest(res, "Method not allowed.");
}
