import type { VercelRequest, VercelResponse } from "@vercel/node";
import { randomUUID } from "crypto";
import { getDb, ensureSchema, seed } from "../_lib/db.js";
import { isValidMalaysianMobile, normalizeMalaysianMobile } from "../_lib/phone.js";
import { ok, created, badRequest, conflict } from "../_lib/response.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureSchema();
  await seed();

  if (req.method === "GET") {
    const phone = req.query.phone as string | undefined;
    if (!isValidMalaysianMobile(phone ?? ""))
      return badRequest(res, "A valid Malaysian mobile number is required.");

    const normalized = normalizeMalaysianMobile(phone!);
    const today = new Date().toISOString().split("T")[0];
    const scope = req.query.scope === "history" ? "history" : "upcoming";

    const db = getDb();
    const result = scope === "history"
      ? await db.execute({
          sql: "SELECT * FROM appointments WHERE clientPhone = ? AND date < ? ORDER BY date DESC, time DESC",
          args: [normalized, today],
        })
      : await db.execute({
          sql: "SELECT * FROM appointments WHERE clientPhone = ? AND date >= ? AND status != 'cancelled' ORDER BY date ASC, time ASC",
          args: [normalized, today],
        });

    return ok(res, { appointments: result.rows });
  }

  if (req.method === "POST") {
    const { clientName, clientPhone, serviceId, stylistId, date, time } = req.body ?? {};

    if (!isValidMalaysianMobile(clientPhone ?? ""))
      return badRequest(res, "A valid Malaysian mobile number is required.");

    const db = getDb();

    const svcResult = await db.execute({ sql: "SELECT * FROM services WHERE id = ?", args: [serviceId] });
    const service = svcResult.rows[0] as unknown as { id: string; name: string; duration: number; price: number } | undefined;
    if (!service) return badRequest(res, "Unknown service.");

    const styResult = await db.execute({ sql: "SELECT * FROM stylists WHERE id = ?", args: [stylistId] });
    const stylist = styResult.rows[0] as unknown as { id: string; name: string } | undefined;
    if (!stylist) return badRequest(res, "Unknown stylist.");

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? "") || !/^\d{2}:\d{2}$/.test(time ?? ""))
      return badRequest(res, "Invalid date or time.");

    const conflictResult = await db.execute({
      sql: "SELECT COUNT(*) AS n FROM appointments WHERE date = ? AND time = ? AND stylistId = ? AND status != 'cancelled'",
      args: [date, time, stylistId],
    });
    if (Number(conflictResult.rows[0]?.n ?? 0) > 0)
      return conflict(res, `${stylist.name} is already booked at ${time} on ${date}.`);

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
    return created(res, { appointment: apptResult.rows[0] });
  }

  return badRequest(res, "Method not allowed.");
}
