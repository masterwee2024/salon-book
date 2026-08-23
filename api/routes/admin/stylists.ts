import type { VercelRequest, VercelResponse } from "@vercel/node";
import { randomUUID } from "crypto";
import { getDb } from "../../_lib/db.js";
import { verifyToken } from "../../_lib/auth.js";

export async function handleAdminStylists(req: VercelRequest, res: VercelResponse) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token || !(await verifyToken(token)))
    return res.status(401).json({ error: "Admin authentication required." });

  const db = getDb();
  const url = new URL(req.url ?? "/", `https://${req.headers.host}`);
  const path = url.pathname.replace(/^\/api/, "");
  const idMatch = path.match(/^\/admin\/stylists\/([^/]+)$/);
  const id = idMatch?.[1];

  if (req.method === "GET" && !id) {
    const result = await db.execute("SELECT * FROM stylists ORDER BY name ASC");
    return res.status(200).json({ stylists: result.rows });
  }

  if (req.method === "POST" && !id) {
    const { name, specialties } = req.body ?? {};
    if (!name) return res.status(400).json({ error: "name is required." });

    const newId = randomUUID();
    await db.execute({
      sql: "INSERT INTO stylists (id, name, specialties) VALUES (?, ?, ?)",
      args: [newId, name, specialties ?? ""],
    });
    const result = await db.execute({ sql: "SELECT * FROM stylists WHERE id = ?", args: [newId] });
    return res.status(201).json({ stylist: result.rows[0] });
  }

  if (req.method === "PUT" && id) {
    const existing = await db.execute({ sql: "SELECT * FROM stylists WHERE id = ?", args: [id] });
    if (existing.rows.length === 0) return res.status(404).json({ error: "Not found." });

    const ex = existing.rows[0] as Record<string, unknown>;
    const { name, specialties } = req.body ?? {};

    await db.execute({
      sql: "UPDATE stylists SET name = ?, specialties = ? WHERE id = ?",
      args: [name ?? ex.name, specialties ?? ex.specialties, id],
    });
    const result = await db.execute({ sql: "SELECT * FROM stylists WHERE id = ?", args: [id] });
    return res.status(200).json({ stylist: result.rows[0] });
  }

  if (req.method === "DELETE" && id) {
    await db.execute({ sql: "DELETE FROM stylists WHERE id = ?", args: [id] });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed." });
}
