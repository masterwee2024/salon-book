import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureSchema, seed } from "../lib/db.js";
import { handleHealth } from "../lib/routes/health.js";
import { handleServices, handleStylists, handleTimeSlots } from "../lib/routes/public.js";
import { handleAvailability } from "../lib/routes/availability.js";
import { handleAppointments } from "../lib/routes/appointments.js";
import { handleCancelAppointment } from "../lib/routes/cancel.js";
import { handleAdminLogin } from "../lib/routes/admin/login.js";
import { handleAdminChangePassword } from "../lib/routes/admin/change-password.js";
import { handleAdminResetPassword } from "../lib/routes/admin/reset-password.js";
import { handleAdminRecoveryKey } from "../lib/routes/admin/recovery-key.js";
import { handleAdminServices } from "../lib/routes/admin/services.js";
import { handleAdminStylists } from "../lib/routes/admin/stylists.js";
import { handleAdminTimeSlots } from "../lib/routes/admin/time-slots.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  await ensureSchema();
  await seed();

  const url = new URL(req.url ?? "/", `https://${req.headers.host}`);
  const path = url.pathname.replace(/^\/api/, "") || "/";
  const method = req.method ?? "GET";

  try {
    // Public routes
    if (path === "/health") return handleHealth(req, res);
    if (path === "/services" && method === "GET") return handleServices(req, res);
    if (path === "/stylists" && method === "GET") return handleStylists(req, res);
    if (path === "/time-slots" && method === "GET") return handleTimeSlots(req, res);
    if (path === "/availability" && method === "GET") return handleAvailability(req, res);
    if (path === "/appointments" && method === "GET") return handleAppointments(req, res);
    if (path === "/appointments" && method === "POST") return handleAppointments(req, res);
    if (path.match(/^\/appointments\/[^/]+\/cancel$/) && method === "PATCH") {
      const id = path.split("/")[2];
      return handleCancelAppointment(req, res, id);
    }

    // Admin routes
    if (path === "/admin/login" && method === "POST") return handleAdminLogin(req, res);
    if (path === "/admin/change-password" && method === "POST") return handleAdminChangePassword(req, res);
    if (path === "/admin/reset-password" && method === "POST") return handleAdminResetPassword(req, res);
    if (path === "/admin/recovery-key" && method === "GET") return handleAdminRecoveryKey(req, res);
    if (path === "/admin/services") return handleAdminServices(req, res);
    if (path.match(/^\/admin\/services\/[^/]+$/)) return handleAdminServices(req, res);
    if (path === "/admin/stylists") return handleAdminStylists(req, res);
    if (path.match(/^\/admin\/stylists\/[^/]+$/)) return handleAdminStylists(req, res);
    if (path === "/admin/time-slots") return handleAdminTimeSlots(req, res);
    if (path.match(/^\/admin\/time-slots\/[^/]+$/)) return handleAdminTimeSlots(req, res);

    return res.status(404).json({ error: "Not found." });
  } catch (e) {
    console.error("API error:", e);
    return res.status(500).json({ error: "Internal server error." });
  }
}
