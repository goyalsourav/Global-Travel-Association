// Server-only Neon Postgres access. Every query goes over Neon's HTTP driver,
// so this works in any serverless/edge runtime without connection pooling.
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
    })().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  return { sql, ready: schemaReady };
}

export function requireAdmin(password: unknown): void {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    throw new Error("ADMIN_PASSWORD is not set on the server — add it to .env");
  }
  if (typeof password !== "string" || password !== expected) {
    throw new Error("Incorrect password");
  }
}
