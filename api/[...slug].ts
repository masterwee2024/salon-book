import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureSchema, seed } from "./_lib/db.js";
import { handleHealth } from "./routes/health.js";
import { handleServices, handleStylists, handleTimeSlots } from "./routes/public.js";
import { handleAvailability } from "./routes/availability.js";
import { handleAppointments } from "./routes/appointments.js";
import { handleCancelAppointment } from "./routes/cancel.js";
import { handleAdminLogin } from "./routes/admin/login.js";
import { handleAdminChangePassword } from "./routes/admin/change-password.js";
import { handleAdminResetPassword } from "./routes/admin/reset-password.js";
import { handleAdminRecoveryKey } from "./routes/admin/recovery-key.js";
import { handleAdminServices } from "./routes/admin/services.js";
import { handleAdminStylists } from "./routes/admin/stylists.js";
import { handleAdminTimeSlots } from "./routes/admin/time-slots.js";

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
