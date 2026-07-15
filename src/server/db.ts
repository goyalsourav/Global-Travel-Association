// Server-only Neon Postgres access. Every query goes over Neon's HTTP driver,
// so this works in any serverless/edge runtime without connection pooling.
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { neon } from "@neondatabase/serverless";

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

function sqlClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set — add it to .env (see .env.example)");
  }
  return neon(url);
}

// Create tables lazily on first use; memoized per server instance so the
// CREATE TABLE round-trips only happen once per cold start.
let schemaReady: Promise<void> | null = null;

export function getDb() {
  const sql = sqlClient();
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS site_content (
          key TEXT PRIMARY KEY,
          value JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS events (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          image_url TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0`;
      // Backfill any rows created before sort_order existed.
      await sql`UPDATE events SET sort_order = id WHERE sort_order = 0`;
      // Events can carry a gallery of images; image_url stays as the cover.
      await sql`
        ALTER TABLE events ADD COLUMN IF NOT EXISTS image_urls JSONB NOT NULL DEFAULT '[]'::jsonb
      `;
      await sql`
        UPDATE events SET image_urls = jsonb_build_array(image_url)
        WHERE image_urls = '[]'::jsonb AND image_url <> ''
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS membership_applications (
          id SERIAL PRIMARY KEY,
          email TEXT NOT NULL,
          name TEXT,
          data JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`
        ALTER TABLE membership_applications
        ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'submitted'
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS members (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          firm_name TEXT NOT NULL DEFAULT '',
          contact TEXT NOT NULL DEFAULT '',
          email TEXT NOT NULL DEFAULT '',
          status TEXT NOT NULL DEFAULT 'active',
          payment_status TEXT NOT NULL DEFAULT 'pending',
          paid_at TIMESTAMPTZ,
          application_id INTEGER,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS city TEXT NOT NULL DEFAULT ''`;
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
      await sql`
        CREATE TABLE IF NOT EXISTS founding_members (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          image_url TEXT NOT NULL DEFAULT '',
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS admin_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
    })().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  return { sql, ready: schemaReady };
}

// The admin password lives in admin_settings once it has been changed from the
// panel; until then the ADMIN_PASSWORD env var applies. Stored as salt:scrypt.
const ADMIN_PASSWORD_KEY = "admin_password";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const candidate = scryptSync(password, salt, 64);
  return expected.length === candidate.length && timingSafeEqual(candidate, expected);
}

export async function requireAdmin(password: unknown): Promise<void> {
  if (typeof password !== "string" || !password) {
    throw new Error("Incorrect password");
  }
  if (isDbConfigured()) {
    const { sql, ready } = getDb();
    await ready;
    const rows = (await sql`
      SELECT value FROM admin_settings WHERE key = ${ADMIN_PASSWORD_KEY}
    `) as { value: string }[];
    if (rows[0]) {
      if (!verifyPassword(password, rows[0].value)) throw new Error("Incorrect password");
      return;
    }
  }
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    throw new Error("ADMIN_PASSWORD is not set on the server — add it to .env");
  }
  if (password !== expected) {
    throw new Error("Incorrect password");
  }
}

export async function setAdminPassword(newPassword: string): Promise<void> {
  const { sql, ready } = getDb();
  await ready;
  await sql`
    INSERT INTO admin_settings (key, value, updated_at)
    VALUES (${ADMIN_PASSWORD_KEY}, ${hashPassword(newPassword)}, now())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
  `;
}
