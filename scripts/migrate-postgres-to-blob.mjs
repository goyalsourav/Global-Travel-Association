/**
 * migrate-postgres-to-blob.mjs
 *
 * One-time migration: reads all data from Neon/Supabase Postgres and writes
 * it as JSON files to Vercel Blob so the app can run without a DB.
 *
 * Prerequisites:
 *   - DATABASE_URL still set in .env (old Postgres)
 *   - BLOB_READ_WRITE_TOKEN set in .env (Vercel Blob)
 *
 * Run:
 *   node scripts/migrate-postgres-to-blob.mjs
 *
 * After a successful run you can remove DATABASE_URL from .env.
 */

import { readFileSync } from "fs";
import { put } from "@vercel/blob";

// --- Load .env manually (no dotenv dependency needed) ---
const envRaw = readFileSync(new URL("../.env", import.meta.url), "utf8");
const env = Object.fromEntries(
  envRaw
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => l.split("=").map((p, i) => (i === 0 ? p.trim() : l.slice(l.indexOf("=") + 1).trim().replace(/^["']|["']$/g, ""))))
    .filter(([k]) => k)
);

const DATABASE_URL = env.DATABASE_URL;
const BLOB_TOKEN = env.BLOB_READ_WRITE_TOKEN;

if (!DATABASE_URL) { console.error("❌  DATABASE_URL not in .env — nothing to migrate from"); process.exit(1); }
if (!BLOB_TOKEN)   { console.error("❌  BLOB_READ_WRITE_TOKEN not in .env — nowhere to write"); process.exit(1); }

// Dynamic import so the script still works even if postgres is already removed
// (we'll catch the error below).
let postgres;
try {
  ({ default: postgres } = await import("postgres"));
} catch {
  console.error("❌  The `postgres` package is not installed. Re-install it temporarily:");
  console.error("    npm install postgres");
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { ssl: "require", prepare: false });

async function fetchTable(query) {
  try {
    return await sql.unsafe(query);
  } catch (err) {
    if (err.message?.includes("does not exist")) {
      console.warn(`   ⚠  Table doesn't exist, skipping (${err.message.split('"')[1] ?? "?"})`);
      return [];
    }
    throw err;
  }
}

async function uploadJson(name, data) {
  const key = `gta/${name}.json`;
  const res = await put(key, JSON.stringify(data, null, 2), {
    access: "public",
    contentType: "application/json",
    token: BLOB_TOKEN,
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  console.log(`  ✓  ${name}.json  (${data.length} rows) → ${res.url}`);
}

console.log("🔄  Starting Postgres → Vercel Blob migration…\n");

const [
  site_content,
  events,
  founding_members,
  members,
  applications,
  payments,
  admin_settings,
] = await Promise.all([
  fetchTable("SELECT key, value, updated_at FROM site_content"),
  fetchTable("SELECT id, title, description, image_url, image_urls, sort_order, created_at FROM events ORDER BY id"),
  fetchTable("SELECT id, name, image_url, sort_order, created_at FROM founding_members ORDER BY id"),
  fetchTable("SELECT id, name, firm_name, contact, email, city, status, payment_status, paid_at, application_id, created_at FROM members ORDER BY id"),
  fetchTable("SELECT id, email, name, data, status, created_at FROM membership_applications ORDER BY id"),
  fetchTable("SELECT id, member_id, amount, paid_on, note, created_at FROM member_payments ORDER BY id"),
  fetchTable("SELECT key, value, updated_at FROM admin_settings"),
]);

await sql.end();

// Normalise postgres.js result objects into plain arrays.
const toPlain = (rows) => rows.map((r) => ({ ...r }));

await uploadJson("site_content",    toPlain(site_content));
await uploadJson("events",          toPlain(events).map(r => ({ ...r, image_urls: Array.isArray(r.image_urls) ? r.image_urls : [] })));
await uploadJson("founding_members",toPlain(founding_members));
await uploadJson("members",         toPlain(members).map(r => ({ ...r, paid_at: r.paid_at ? new Date(r.paid_at).toISOString() : null })));
await uploadJson("applications",    toPlain(applications));
await uploadJson("payments",        toPlain(payments).map(r => ({ ...r, amount: Number(r.amount), paid_on: String(r.paid_on).slice(0, 10) })));
await uploadJson("admin_settings",  toPlain(admin_settings));

console.log("\n✅  Migration complete!");
console.log("👉  You can now remove DATABASE_URL from your .env and Vercel environment variables.");
