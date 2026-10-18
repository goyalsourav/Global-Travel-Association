/**
 * @deprecated — The app no longer uses Postgres.
 * This file is kept only as a shim in case any external import still points here.
 * All DB logic has moved to src/server/blob-store.ts.
 */
export { isDbConfigured, requireAdmin, setAdminPassword } from "./blob-store";

// Stub getDb so TypeScript doesn't break if anything still imports it.
export function getDb(): never {
  throw new Error(
    "getDb() is no longer available — the app uses Vercel Blob JSON storage. " +
      "Import from @/server/blob-store instead.",
  );
}
