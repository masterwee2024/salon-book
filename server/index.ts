import { Database } from "bun:sqlite";
import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID, createHash } from "crypto";
import { isValidMalaysianMobile, normalizeMalaysianMobile } from "../src/lib/phone";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3001);
const DB_PATH = process.env.DB_PATH || path.join(__dirname, "..", "salon.db");
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

function hashPassword(pw: string): string {
  return createHash("sha256").update(pw).digest("hex");
}

const db = new Database(DB_PATH);
db.exec("PRAGMA journal_mode = WAL;");

// ── schema ──────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    duration INTEGER NOT NULL,
    price INTEGER NOT NULL,
    description TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS stylists (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    specialties TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS time_slots (
    id TEXT PRIMARY KEY,
    time TEXT NOT NULL UNIQUE,
    enabled INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    clientName TEXT NOT NULL,
    clientPhone TEXT NOT NULL,
    serviceId TEXT NOT NULL,
    serviceName TEXT NOT NULL,
    stylistId TEXT NOT NULL,
    stylistName TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS admin_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_appointments_phone ON appointments(clientPhone);
  CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
  CREATE INDEX IF NOT EXISTS idx_appointments_stylist ON appointments(stylistId, date, time);
`);

// ── seed ────────────────────────────────────────────────────────────

const INITIAL_SERVICES = [
  { name: "Women's Haircut", duration: 60, price: 80, description: "Includes wash, cut, and blowout styling." },
  { name: "Men's Haircut", duration: 45, price: 45, description: "Classic or modern cut with hot towel finish." },
  { name: "Balayage", duration: 180, price: 220, description: "Hand-painted highlights for a natural look." },
  { name: "Root Touch-up", duration: 90, price: 95, description: "Color application to the regrowth area only." },
];

const INITIAL_STYLISTS = [
  { name: "Siti", specialties: "Women's Haircut, Balayage, Root Touch-up" },
  { name: "Wei Ming", specialties: "Men's Haircut, Women's Haircut" },
  { name: "Priya", specialties: "Balayage, Root Touch-up, Women's Haircut" },
];

const INITIAL_SLOTS = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];

function getConfig(key: string): string | undefined {
  const row = db.query("SELECT value FROM admin_config WHERE key = ?").get(key) as { value: string } | undefined;
  return row?.value;
}

function setConfig(key: string, value: string) {
  db.query("INSERT OR REPLACE INTO admin_config (key, value) VALUES (?, ?)").run(key, value);
}

function seed() {
  const svcCount = (db.query("SELECT COUNT(*) AS n FROM services").get() as { n: number }).n;
  if (svcCount === 0) {
    const ins = db.query("INSERT INTO services (id, name, duration, price, description) VALUES (?, ?, ?, ?, ?)");
    db.transaction(() => { for (const s of INITIAL_SERVICES) ins.run(randomUUID(), s.name, s.duration, s.price, s.description); })();
  }

  const styCount = (db.query("SELECT COUNT(*) AS n FROM stylists").get() as { n: number }).n;
  if (styCount === 0) {
    const ins = db.query("INSERT INTO stylists (id, name, specialties) VALUES (?, ?, ?)");
    db.transaction(() => { for (const s of INITIAL_STYLISTS) ins.run(randomUUID(), s.name, s.specialties); })();
  }

  const slotCount = (db.query("SELECT COUNT(*) AS n FROM time_slots").get() as { n: number }).n;
  if (slotCount === 0) {
    const ins = db.query("INSERT INTO time_slots (id, time, enabled) VALUES (?, ?, 1)");
    db.transaction(() => { for (const t of INITIAL_SLOTS) ins.run(randomUUID(), t); })();
  }

  // admin password + recovery key
  if (!getConfig("password_hash")) {
    setConfig("password_hash", hashPassword(ADMIN_PASSWORD));
    console.log(`[admin] Default password seeded from ADMIN_PASSWORD env.`);
  }
  if (!getConfig("recovery_key")) {
    const key = randomUUID();
    setConfig("recovery_key", key);
    console.log(`[admin] Recovery key: ${key}`);
    console.log(`[admin] Save this key — it is the only way to reset a forgotten password.`);
  }
}
seed();

// ── admin auth ──────────────────────────────────────────────────────

const adminTokens = new Set<string>();

function adminAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token || !adminTokens.has(token)) {
    return res.status(401).json({ error: "Admin authentication required." });
  }
  next();
}

// ── public API ──────────────────────────────────────────────────────

const app = express();
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/services", (_req, res) => {
  const services = db.query("SELECT * FROM services ORDER BY name ASC").all();
  res.json({ services });
});

app.get("/api/stylists", (_req, res) => {
  const stylists = db.query("SELECT * FROM stylists ORDER BY name ASC").all();
  res.json({ stylists });
});

app.get("/api/time-slots", (_req, res) => {
  const slots = db.query("SELECT * FROM time_slots WHERE enabled = 1 ORDER BY time ASC").all();
  res.json({ slots });
});

app.get("/api/availability", (req, res) => {
  const { date, stylistId } = req.query as { date?: string; stylistId?: string };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? "")) return res.status(400).json({ error: "Invalid date." });
  if (!stylistId) return res.status(400).json({ error: "stylistId is required." });
  const booked = db.query(
    "SELECT time FROM appointments WHERE date = ? AND stylistId = ? AND status != 'cancelled'"
  ).all(date, stylistId) as { time: string }[];
  res.json({ bookedSlots: booked.map((b) => b.time) });
});

app.post("/api/appointments", (req, res) => {
  const { clientName, clientPhone, serviceId, stylistId, date, time } = req.body ?? {};

  if (!isValidMalaysianMobile(clientPhone ?? ""))
    return res.status(400).json({ error: "A valid Malaysian mobile number is required." });

  const service = db.query("SELECT * FROM services WHERE id = ?").get(serviceId) as
    | { id: string; name: string; duration: number; price: number } | undefined;
  if (!service) return res.status(400).json({ error: "Unknown service." });

  const stylist = db.query("SELECT * FROM stylists WHERE id = ?").get(stylistId) as
    | { id: string; name: string } | undefined;
  if (!stylist) return res.status(400).json({ error: "Unknown stylist." });

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? "") || !/^\d{2}:\d{2}$/.test(time ?? ""))
    return res.status(400).json({ error: "Invalid date or time." });

  const conflict = db.query(
    "SELECT COUNT(*) AS n FROM appointments WHERE date = ? AND time = ? AND stylistId = ? AND status != 'cancelled'"
  ).get(date, time, stylistId) as { n: number };
  if (conflict.n > 0)
    return res.status(409).json({ error: `${stylist.name} is already booked at ${time} on ${date}.` });

  const id = randomUUID();
  db.query(
    `INSERT INTO appointments
     (id, clientName, clientPhone, serviceId, serviceName, stylistId, stylistName, date, time, status, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`
  ).run(id, (clientName ?? "").trim() || "Guest", normalizeMalaysianMobile(clientPhone),
    service.id, service.name, stylist.id, stylist.name, date, time, new Date().toISOString());

  const appointment = db.query("SELECT * FROM appointments WHERE id = ?").get(id);
  res.status(201).json({ appointment });
});

app.get("/api/appointments", (req, res) => {
  const phone = req.query.phone as string | undefined;
  if (!isValidMalaysianMobile(phone ?? ""))
    return res.status(400).json({ error: "A valid Malaysian mobile number is required." });
  const normalized = normalizeMalaysianMobile(phone!);
  const today = new Date().toISOString().split("T")[0];
  const scope = req.query.scope === "history" ? "history" : "upcoming";
  const rows = scope === "history"
    ? db.query("SELECT * FROM appointments WHERE clientPhone = ? AND date < ? ORDER BY date DESC, time DESC").all(normalized, today)
    : db.query("SELECT * FROM appointments WHERE clientPhone = ? AND date >= ? AND status != 'cancelled' ORDER BY date ASC, time ASC").all(normalized, today);
  res.json({ appointments: rows });
});

app.patch("/api/appointments/:id/cancel", (req, res) => {
  const { clientPhone } = req.body ?? {};
  const appt = db.query("SELECT * FROM appointments WHERE id = ?").get(req.params.id) as
    | { clientPhone: string } | undefined;
  if (!appt) return res.status(404).json({ error: "Not found." });
  if (normalizeMalaysianMobile(clientPhone ?? "") !== appt.clientPhone)
    return res.status(403).json({ error: "Phone number does not match this booking." });
  db.query("UPDATE appointments SET status = 'cancelled' WHERE id = ?").run(req.params.id);
  const updated = db.query("SELECT * FROM appointments WHERE id = ?").get(req.params.id);
  res.json({ appointment: updated });
});

// ── admin API ───────────────────────────────────────────────────────

app.post("/api/admin/login", (req, res) => {
  const { password } = req.body ?? {};
  const storedHash = getConfig("password_hash");
  if (!storedHash || hashPassword(password ?? "") !== storedHash)
    return res.status(403).json({ error: "Invalid password." });
  const token = randomUUID();
  adminTokens.add(token);
  res.json({ token });
});

app.post("/api/admin/change-password", adminAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body ?? {};
  if (!currentPassword || !newPassword)
    return res.status(400).json({ error: "currentPassword and newPassword are required." });
  if (newPassword.length < 4)
    return res.status(400).json({ error: "New password must be at least 4 characters." });
  const storedHash = getConfig("password_hash");
  if (!storedHash || hashPassword(currentPassword) !== storedHash)
    return res.status(403).json({ error: "Current password is incorrect." });
  setConfig("password_hash", hashPassword(newPassword));
  res.json({ ok: true });
});

app.post("/api/admin/reset-password", (req, res) => {
  const { recoveryKey, newPassword } = req.body ?? {};
  if (!recoveryKey || !newPassword)
    return res.status(400).json({ error: "recoveryKey and newPassword are required." });
  if (newPassword.length < 4)
    return res.status(400).json({ error: "New password must be at least 4 characters." });
  const storedKey = getConfig("recovery_key");
  if (!storedKey || recoveryKey !== storedKey)
    return res.status(403).json({ error: "Invalid recovery key." });
  setConfig("password_hash", hashPassword(newPassword));
  res.json({ ok: true });
});

app.get("/api/admin/recovery-key", adminAuth, (_req, res) => {
  const key = getConfig("recovery_key");
  res.json({ recoveryKey: key });
});

// Services CRUD
app.get("/api/admin/services", adminAuth, (_req, res) => {
  const services = db.query("SELECT * FROM services ORDER BY name ASC").all();
  res.json({ services });
});

app.post("/api/admin/services", adminAuth, (req, res) => {
  const { name, duration, price, description } = req.body ?? {};
  if (!name || !duration || price == null) return res.status(400).json({ error: "name, duration, price are required." });
  const id = randomUUID();
  db.query("INSERT INTO services (id, name, duration, price, description) VALUES (?, ?, ?, ?, ?)")
    .run(id, name, duration, price, description ?? "");
  const service = db.query("SELECT * FROM services WHERE id = ?").get(id);
  res.status(201).json({ service });
});

app.put("/api/admin/services/:id", adminAuth, (req, res) => {
  const { name, duration, price, description } = req.body ?? {};
  const existing = db.query("SELECT * FROM services WHERE id = ?").get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: "Not found." });
  db.query("UPDATE services SET name = ?, duration = ?, price = ?, description = ? WHERE id = ?")
    .run(name ?? existing.name, duration ?? existing.duration, price ?? existing.price, description ?? existing.description, req.params.id);
  const service = db.query("SELECT * FROM services WHERE id = ?").get(req.params.id);
  res.json({ service });
});

app.delete("/api/admin/services/:id", adminAuth, (req, res) => {
  db.query("DELETE FROM services WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// Stylists CRUD
app.get("/api/admin/stylists", adminAuth, (_req, res) => {
  const stylists = db.query("SELECT * FROM stylists ORDER BY name ASC").all();
  res.json({ stylists });
});

app.post("/api/admin/stylists", adminAuth, (req, res) => {
  const { name, specialties } = req.body ?? {};
  if (!name) return res.status(400).json({ error: "name is required." });
  const id = randomUUID();
  db.query("INSERT INTO stylists (id, name, specialties) VALUES (?, ?, ?)").run(id, name, specialties ?? "");
  const stylist = db.query("SELECT * FROM stylists WHERE id = ?").get(id);
  res.status(201).json({ stylist });
});

app.put("/api/admin/stylists/:id", adminAuth, (req, res) => {
  const { name, specialties } = req.body ?? {};
  const existing = db.query("SELECT * FROM stylists WHERE id = ?").get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: "Not found." });
  db.query("UPDATE stylists SET name = ?, specialties = ? WHERE id = ?")
    .run(name ?? existing.name, specialties ?? existing.specialties, req.params.id);
  const stylist = db.query("SELECT * FROM stylists WHERE id = ?").get(req.params.id);
  res.json({ stylist });
});

app.delete("/api/admin/stylists/:id", adminAuth, (req, res) => {
  db.query("DELETE FROM stylists WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// Time Slots CRUD
app.get("/api/admin/time-slots", adminAuth, (_req, res) => {
  const slots = db.query("SELECT * FROM time_slots ORDER BY time ASC").all();
  res.json({ slots });
});

app.post("/api/admin/time-slots", adminAuth, (req, res) => {
  const { time, enabled } = req.body ?? {};
  if (!time || !/^\d{2}:\d{2}$/.test(time)) return res.status(400).json({ error: "A valid time (HH:mm) is required." });
  const existing = db.query("SELECT id FROM time_slots WHERE time = ?").get(time);
  if (existing) return res.status(409).json({ error: "Time slot already exists." });
  const id = randomUUID();
  db.query("INSERT INTO time_slots (id, time, enabled) VALUES (?, ?, ?)").run(id, time, enabled !== false ? 1 : 0);
  const slot = db.query("SELECT * FROM time_slots WHERE id = ?").get(id);
  res.status(201).json({ slot });
});

app.put("/api/admin/time-slots/:id", adminAuth, (req, res) => {
  const { time, enabled } = req.body ?? {};
  const existing = db.query("SELECT * FROM time_slots WHERE id = ?").get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: "Not found." });
  db.query("UPDATE time_slots SET time = ?, enabled = ? WHERE id = ?")
    .run(time ?? existing.time, enabled !== undefined ? (enabled ? 1 : 0) : existing.enabled, req.params.id);
  const slot = db.query("SELECT * FROM time_slots WHERE id = ?").get(req.params.id);
  res.json({ slot });
});

app.delete("/api/admin/time-slots/:id", adminAuth, (req, res) => {
  db.query("DELETE FROM time_slots WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// ── serve SPA ───────────────────────────────────────────────────────

const DIST = path.join(__dirname, "..", "dist");
app.use(express.static(DIST));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(DIST, "index.html"), (err) => { if (err) next(); });
});

app.listen(PORT, () => {
  console.log(`Salon Book server running at http://localhost:${PORT}`);
});
