import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb } from "../../db.js";
import { verifyToken } from "../../auth.js";

export async function handleAdminAppointments(req: VercelRequest, res: VercelResponse) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token || !(await verifyToken(token))) {
    return res.status(401).json({ error: "Admin authentication required." });
  }

  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed." });

  const from = typeof req.query.from === "string" ? req.query.from : "";
  const to = typeof req.query.to === "string" ? req.query.to : "";
  const stylistId = typeof req.query.stylistId === "string" ? req.query.stylistId : "";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return res.status(400).json({ error: "Valid from and to dates are required." });
  }

  const db = getDb();
  const result = await db.execute({
    sql: stylistId
      ? "SELECT * FROM appointments WHERE date BETWEEN ? AND ? AND stylistId = ? ORDER BY date ASC, time ASC"
      : "SELECT * FROM appointments WHERE date BETWEEN ? AND ? ORDER BY date ASC, time ASC",
    args: stylistId ? [from, to, stylistId] : [from, to],
  });

  return res.status(200).json({ appointments: result.rows });
}
