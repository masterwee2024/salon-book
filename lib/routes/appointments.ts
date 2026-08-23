import type { VercelRequest, VercelResponse } from "@vercel/node";
import { randomUUID } from "crypto";
import { getDb } from "../db.js";
import { isValidMalaysianMobile, normalizeMalaysianMobile } from "../phone.js";

export async function handleAppointments(req: VercelRequest, res: VercelResponse) {
  const db = getDb();

  if (req.method === "GET") {
    const phone = req.query.phone as string | undefined;
    if (!isValidMalaysianMobile(phone ?? ""))
      return res.status(400).json({ error: "A valid Malaysian mobile number is required." });

    const normalized = normalizeMalaysianMobile(phone!);
    const today = new Date().toISOString().split("T")[0];
    const scope = req.query.scope === "history" ? "history" : "upcoming";

    const result = scope === "history"
      ? await db.execute({
          sql: "SELECT * FROM appointments WHERE clientPhone = ? AND date < ? ORDER BY date DESC, time DESC",
          args: [normalized, today],
        })
      : await db.execute({
          sql: "SELECT * FROM appointments WHERE clientPhone = ? AND date >= ? AND status != 'cancelled' ORDER BY date ASC, time ASC",
          args: [normalized, today],
        });

    return res.status(200).json({ appointments: result.rows });
  }

  if (req.method === "POST") {
    const { clientName, clientPhone, serviceId, stylistId, date, time } = req.body ?? {};

    if (!isValidMalaysianMobile(clientPhone ?? ""))
      return res.status(400).json({ error: "A valid Malaysian mobile number is required." });

    const svcResult = await db.execute({ sql: "SELECT * FROM services WHERE id = ?", args: [serviceId] });
    const service = svcResult.rows[0] as unknown as { id: string; name: string; duration: number; price: number } | undefined;
    if (!service) return res.status(400).json({ error: "Unknown service." });

    const styResult = await db.execute({ sql: "SELECT * FROM stylists WHERE id = ?", args: [stylistId] });
    const stylist = styResult.rows[0] as unknown as { id: string; name: string } | undefined;
    if (!stylist) return res.status(400).json({ error: "Unknown stylist." });

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? "") || !/^\d{2}:\d{2}$/.test(time ?? ""))
      return res.status(400).json({ error: "Invalid date or time." });

    const conflictResult = await db.execute({
      sql: "SELECT COUNT(*) AS n FROM appointments WHERE date = ? AND time = ? AND stylistId = ? AND status != 'cancelled'",
      args: [date, time, stylistId],
    });
    if (Number(conflictResult.rows[0]?.n ?? 0) > 0)
      return res.status(409).json({ error: `${stylist.name} is already booked at ${time} on ${date}.` });

    const id = randomUUID();
    await db.execute({
      sql: `INSERT INTO appointments (id, clientName, clientPhone, serviceId, serviceName, stylistId, stylistName, date, time, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      args: [
        id,
        (clientName ?? "").trim() || "Guest",
        normalizeMalaysianMobile(clientPhone),
        service.id,
        service.name,
        stylist.id,
        stylist.name,
        date,
        time,
        new Date().toISOString(),
      ],
    });

    const apptResult = await db.execute({ sql: "SELECT * FROM appointments WHERE id = ?", args: [id] });
    return res.status(201).json({ appointment: apptResult.rows[0] });
  }

  return res.status(405).json({ error: "Method not allowed." });
}
