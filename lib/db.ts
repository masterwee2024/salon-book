import { createClient, type Client } from "@libsql/client";
import { randomUUID, createHash } from "crypto";

let _db: Client | null = null;

export function getDb(): Client {
  if (!_db) {
    _db = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return _db;
}

export function hashPassword(pw: string): string {
  return createHash("sha256").update(pw).digest("hex");
}

let schemaReady = false;

export async function ensureSchema() {
  if (schemaReady) return;
  const db = getDb();

  await db.executeMultiple(`
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

  schemaReady = true;
}

export async function getConfig(key: string): Promise<string | undefined> {
  const db = getDb();
  const result = await db.execute({ sql: "SELECT value FROM admin_config WHERE key = ?", args: [key] });
  return result.rows[0]?.value as string | undefined;
}

export async function setConfig(key: string, value: string) {
  const db = getDb();
  await db.execute({ sql: "INSERT OR REPLACE INTO admin_config (key, value) VALUES (?, ?)", args: [key, value] });
}

let seeded = false;

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

export async function seed() {
  if (seeded) return;
  const db = getDb();

  const svcResult = await db.execute("SELECT COUNT(*) AS n FROM services");
  const svcCount = Number(svcResult.rows[0]?.n ?? 0);
  if (svcCount === 0) {
    for (const s of INITIAL_SERVICES) {
      await db.execute({
        sql: "INSERT INTO services (id, name, duration, price, description) VALUES (?, ?, ?, ?, ?)",
        args: [randomUUID(), s.name, s.duration, s.price, s.description],
      });
    }
  }

  const styResult = await db.execute("SELECT COUNT(*) AS n FROM stylists");
  const styCount = Number(styResult.rows[0]?.n ?? 0);
  if (styCount === 0) {
    for (const s of INITIAL_STYLISTS) {
      await db.execute({
        sql: "INSERT INTO stylists (id, name, specialties) VALUES (?, ?, ?)",
        args: [randomUUID(), s.name, s.specialties],
      });
    }
  }

  const slotResult = await db.execute("SELECT COUNT(*) AS n FROM time_slots");
  const slotCount = Number(slotResult.rows[0]?.n ?? 0);
  if (slotCount === 0) {
    for (const t of INITIAL_SLOTS) {
      await db.execute({
        sql: "INSERT INTO time_slots (id, time, enabled) VALUES (?, ?, 1)",
        args: [randomUUID(), t],
      });
    }
  }

  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  if (!(await getConfig("password_hash"))) {
    await setConfig("password_hash", hashPassword(adminPassword));
  }
  if (!(await getConfig("recovery_key"))) {
    await setConfig("recovery_key", randomUUID());
  }

  seeded = true;
}
