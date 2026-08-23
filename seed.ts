import "dotenv/config";
import { ensureSchema, seed, getDb } from "./api/_lib/db.js";

async function main() {
  console.log("Connecting to Turso...");
  await ensureSchema();
  console.log("Schema ready.");

  console.log("Seeding...");
  await seed();
  console.log("Seed complete.");

  const db = getDb();
  const services = await db.execute("SELECT name FROM services");
  const stylists = await db.execute("SELECT name FROM stylists");
  const slots = await db.execute("SELECT time FROM time_slots WHERE enabled = 1");

  console.log(`  Services: ${services.rows.map(r => r.name).join(", ")}`);
  console.log(`  Stylists: ${stylists.rows.map(r => r.name).join(", ")}`);
  console.log(`  Time slots: ${slots.rows.map(r => r.time).join(", ")}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
