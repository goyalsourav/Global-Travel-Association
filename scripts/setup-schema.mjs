/**
 * One-time schema setup for Supabase.
 * Creates all tables needed by the app. Safe to re-run (IF NOT EXISTS).
 * Run: node scripts/setup-schema.mjs
 */
import { readFileSync } from "fs";
import postgres from "postgres";

const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
const match = env.match(/^DATABASE_URL=(.+)$/m);
if (!match) { console.error("DATABASE_URL not found in .env"); process.exit(1); }

const sql = postgres(match[1].trim(), { ssl: "require", prepare: false });

console.log("🔧 Setting up Supabase schema…");

await sql`
  CREATE TABLE IF NOT EXISTS site_content (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`;
console.log("  ✓ site_content");

await sql`
  CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    image_url TEXT NOT NULL DEFAULT '',
    image_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`;
console.log("  ✓ events");

await sql`
  CREATE TABLE IF NOT EXISTS founding_members (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    image_url TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`;
console.log("  ✓ founding_members");

await sql`
  CREATE TABLE IF NOT EXISTS members (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    firm_name TEXT NOT NULL DEFAULT '',
    contact TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    city TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active',
    payment_status TEXT NOT NULL DEFAULT 'pending',
    paid_at TIMESTAMPTZ,
    application_id INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`;
console.log("  ✓ members");

await sql`
  CREATE TABLE IF NOT EXISTS membership_applications (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT,
    data JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'submitted',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`;
console.log("  ✓ membership_applications");

await sql`
  CREATE TABLE IF NOT EXISTS member_payments (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    paid_on DATE NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`;
console.log("  ✓ member_payments");

await sql`
  CREATE TABLE IF NOT EXISTS admin_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`;
console.log("  ✓ admin_settings");

await sql.end();
console.log("\n✅ Schema ready on Supabase!");
console.log("👉 Next: run  node scripts/seed-members.mjs  to import your members.");
