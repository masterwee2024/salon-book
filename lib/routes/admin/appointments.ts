import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb } from "../../db.js";
import { verifyToken } from "../../auth.js";

export async function handleAdminAppointments(req: VercelRequest, res: VercelResponse) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token || !(await verifyToken(token))) {
    return res.status(401).json({ error: "Admin authentication required." });
  }

  const db = getDb();
  const url = new URL(req.url ?? "/", `https://${req.headers.host}`);
  const path = url.pathname.replace(/^\/api/, "");
  const idMatch = path.match(/^\/admin\/appointments\/([^/]+)$/);
  const id = idMatch?.[1];

  if (req.method === "GET" && !id) {
    const from = typeof req.query.from === "string" ? req.query.from : "";
    const to = typeof req.query.to === "string" ? req.query.to : "";
    const stylistId = typeof req.query.stylistId === "string" ? req.query.stylistId : "";

    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      return res.status(400).json({ error: "Valid from and to dates are required." });
    }

    const result = await db.execute({
      sql: stylistId
        ? "SELECT * FROM appointments WHERE date BETWEEN ? AND ? AND stylistId = ? ORDER BY date ASC, time ASC"
        : "SELECT * FROM appointments WHERE date BETWEEN ? AND ? ORDER BY date ASC, time ASC",
      args: stylistId ? [from, to, stylistId] : [from, to],
    });

    return res.status(200).json({ appointments: result.rows });
  }

  if ((req.method === "PATCH" || req.method === "PUT") && id) {
    const existing = await db.execute({ sql: "SELECT * FROM appointments WHERE id = ?", args: [id] });
    if (existing.rows.length === 0) return res.status(404).json({ error: "Not found." });
    const appt = existing.rows[0] as Record<string, unknown>;

    const { status, stylistId } = req.body ?? {};
    const validStatuses = ["pending", "confirmed", "cancelled", "completed"] as const;

    let nextStatus = appt.status as string;
    if (status !== undefined) {
      if (!validStatuses.includes(status)) return res.status(400).json({ error: "Invalid status." });
      nextStatus = status;
    }

    let nextStylistId = appt.stylistId as string;
    let nextStylistName = appt.stylistName as string;
    if (stylistId !== undefined && stylistId !== appt.stylistId) {
      const sty = await db.execute({ sql: "SELECT * FROM stylists WHERE id = ?", args: [stylistId] });
      if (sty.rows.length === 0) return res.status(400).json({ error: "Unknown stylist." });
      const nextStylist = sty.rows[0] as Record<string, unknown>;
      // conflict check for new stylist at same date/time
      if (nextStatus !== "cancelled") {
        const conflict = await db.execute({
          sql: "SELECT COUNT(*) as n FROM appointments WHERE date = ? AND time = ? AND stylistId = ? AND status != 'cancelled' AND id != ?",
          args: [appt.date as string, appt.time as string, stylistId, id],
        });
        if (Number((conflict.rows[0] as Record<string, unknown>).n ?? 0) > 0) {
          return res.status(409).json({ error: `${nextStylist.name} is already booked at ${appt.time} on ${appt.date}.` });
        }
      }
      nextStylistId = stylistId;
      nextStylistName = nextStylist.name as string;
    }

    await db.execute({
      sql: "UPDATE appointments SET status = ?, stylistId = ?, stylistName = ? WHERE id = ?",
      args: [nextStatus, nextStylistId, nextStylistName, id],
    });
    const updated = await db.execute({ sql: "SELECT * FROM appointments WHERE id = ?", args: [id] });
    return res.status(200).json({ appointment: updated.rows[0] });
  }

  return res.status(405).json({ error: "Method not allowed." });
}
