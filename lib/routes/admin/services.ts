import type { VercelRequest, VercelResponse } from "@vercel/node";
import { randomUUID } from "crypto";
import { getDb } from "../../db.js";
import { verifyToken } from "../../auth.js";

export async function handleAdminServices(req: VercelRequest, res: VercelResponse) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token || !(await verifyToken(token)))
    return res.status(401).json({ error: "Admin authentication required." });

  const db = getDb();
  const url = new URL(req.url ?? "/", `https://${req.headers.host}`);
  const path = url.pathname.replace(/^\/api/, "");
  const idMatch = path.match(/^\/admin\/services\/([^/]+)$/);
  const id = idMatch?.[1];

  if (req.method === "GET" && !id) {
    const result = await db.execute("SELECT * FROM services ORDER BY name ASC");
    return res.status(200).json({ services: result.rows });
  }

  if (req.method === "POST" && !id) {
    const { name, duration, price, description } = req.body ?? {};
    if (!name || !duration || price == null)
      return res.status(400).json({ error: "name, duration, price are required." });

    const newId = randomUUID();
    await db.execute({
      sql: "INSERT INTO services (id, name, duration, price, description) VALUES (?, ?, ?, ?, ?)",
      args: [newId, name, duration, price, description ?? ""],
    });
    const result = await db.execute({ sql: "SELECT * FROM services WHERE id = ?", args: [newId] });
    return res.status(201).json({ service: result.rows[0] });
  }

  if (req.method === "PUT" && id) {
    const existing = await db.execute({ sql: "SELECT * FROM services WHERE id = ?", args: [id] });
    if (existing.rows.length === 0) return res.status(404).json({ error: "Not found." });

    const ex = existing.rows[0] as Record<string, unknown>;
    const { name, duration, price, description } = req.body ?? {};

    await db.execute({
      sql: "UPDATE services SET name = ?, duration = ?, price = ?, description = ? WHERE id = ?",
      args: [name ?? ex.name, duration ?? ex.duration, price ?? ex.price, description ?? ex.description, id],
    });
    const result = await db.execute({ sql: "SELECT * FROM services WHERE id = ?", args: [id] });
    return res.status(200).json({ service: result.rows[0] });
  }

  if (req.method === "DELETE" && id) {
    await db.execute({ sql: "DELETE FROM services WHERE id = ?", args: [id] });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed." });
}
