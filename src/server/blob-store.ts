/**
 * Vercel Blob JSON store — replaces the Postgres/`postgres` client.
 *
 * Each "table" is a single JSON file stored in Vercel Blob under the key
 * `gta/<collection>.json`. Reads are cached per server instance so the same
 * cold-start doesn't re-fetch on every request. Writes always invalidate the
 * in-process cache and push the new JSON to Blob.
 *
 * This is a great trade-off for a landing page: reads are extremely frequent,
 * writes are rare (admin-only), and we have no concurrent write contention.
 */
import { put, head } from "@vercel/blob";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// ---------------------------------------------------------------------------
// Types mirroring the old Postgres schema
// ---------------------------------------------------------------------------

export type SiteContentRow = { key: string; value: unknown; updated_at: string };
export type EventRow = {
  id: number;
  title: string;
  description: string;
  image_url: string;
  image_urls: string[];
  sort_order: number;
  created_at: string;
};
export type FoundingMemberRow = {
  id: number;
  name: string;
  image_url: string;
  sort_order: number;
  created_at: string;
};
export type MemberRow = {
  id: number;
  name: string;
  firm_name: string;
  contact: string;
  email: string;
  city: string;
  status: "active" | "inactive";
  payment_status: "pending" | "paid";
  paid_at: string | null;
  application_id: number | null;
  created_at: string;
};
export type ApplicationRow = {
  id: number;
  email: string;
  name: string | null;
  data: unknown;
  status: string;
  created_at: string;
};
export type PaymentRow = {
  id: number;
  member_id: number;
  amount: number;
  paid_on: string;
  note: string;
  created_at: string;
};
export type AdminSettingRow = { key: string; value: string; updated_at: string };

type StoreMap = {
  site_content: SiteContentRow[];
  events: EventRow[];
  founding_members: FoundingMemberRow[];
  members: MemberRow[];
  applications: ApplicationRow[];
  payments: PaymentRow[];
  admin_settings: AdminSettingRow[];
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const BLOB_PREFIX = "gta/";
const blobKey = (name: string) => `${BLOB_PREFIX}${name}.json`;

// Per-process cache so we only fetch each collection once per cold start.
const _cache = new Map<string, unknown[]>();

async function readCollection<K extends keyof StoreMap>(name: K): Promise<StoreMap[K]> {
  if (_cache.has(name)) return _cache.get(name) as StoreMap[K];

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return [] as unknown as StoreMap[K];

  try {
    const key = blobKey(name);
    // head() throws when the blob doesn't exist yet (new deployment).
    const meta = await head(key, { token });
    const res = await fetch(meta.url);
    if (!res.ok) return [] as unknown as StoreMap[K];
    const data = (await res.json()) as StoreMap[K];
    _cache.set(name, data);
    return data;
  } catch {
    // Blob doesn't exist yet — return empty and let writes create it.
    return [] as unknown as StoreMap[K];
  }
}

async function writeCollection<K extends keyof StoreMap>(
  name: K,
  data: StoreMap[K],
): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error("BLOB_READ_WRITE_TOKEN is not set");

  const key = blobKey(name);
  await put(key, JSON.stringify(data, null, 2), {
    access: "public",
    contentType: "application/json",
    token,
    addRandomSuffix: false, // deterministic key so we always overwrite the same file
    allowOverwrite: true,
  });
  // Invalidate cache so the next read reflects the new data.
  _cache.set(name, data);
}

function nextId(rows: { id: number }[]): number {
  return rows.length === 0 ? 1 : Math.max(...rows.map((r) => r.id)) + 1;
}

function now(): string {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function isDbConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

// ---------- Site content ----------

export async function getSiteContentRows(): Promise<SiteContentRow[]> {
  return readCollection("site_content");
}

export async function upsertSiteContent(key: string, value: unknown): Promise<void> {
  const rows = await readCollection("site_content");
  const idx = rows.findIndex((r) => r.key === key);
  const entry: SiteContentRow = { key, value, updated_at: now() };
  if (idx >= 0) rows[idx] = entry;
  else rows.push(entry);
  await writeCollection("site_content", rows);
}

// ---------- Events ----------

export async function getEventRows(): Promise<EventRow[]> {
  const rows = await readCollection("events");
  return [...rows].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
}

export async function insertEvent(
  title: string,
  description: string,
  image_url: string,
  image_urls: string[],
): Promise<EventRow> {
  const rows = await readCollection("events");
  const maxOrder = rows.length === 0 ? 0 : Math.max(...rows.map((r) => r.sort_order));
  const row: EventRow = {
    id: nextId(rows),
    title,
    description,
    image_url,
    image_urls,
    sort_order: maxOrder + 1,
    created_at: now(),
  };
  rows.push(row);
  await writeCollection("events", rows);
  return row;
}

export async function updateEvent(
  id: number,
  title: string,
  description: string,
  image_url: string,
  image_urls: string[],
): Promise<void> {
  const rows = await readCollection("events");
  const idx = rows.findIndex((r) => r.id === id);
  if (idx < 0) throw new Error("Event not found");
  rows[idx] = { ...rows[idx], title, description, image_url, image_urls };
  await writeCollection("events", rows);
}

export async function reorderEvents(orderedIds: number[]): Promise<void> {
  const rows = await readCollection("events");
  orderedIds.forEach((id, index) => {
    const r = rows.find((r) => r.id === id);
    if (r) r.sort_order = index + 1;
  });
  await writeCollection("events", rows);
}

export async function deleteEventRow(
  id: number,
): Promise<{ image_url: string; image_urls: string[] }> {
  const rows = await readCollection("events");
  const idx = rows.findIndex((r) => r.id === id);
  if (idx < 0) throw new Error("Event not found");
  const [deleted] = rows.splice(idx, 1);
  await writeCollection("events", rows);
  return { image_url: deleted.image_url, image_urls: deleted.image_urls };
}

// ---------- Founding members ----------

export async function getFoundingMemberRows(): Promise<FoundingMemberRow[]> {
  const rows = await readCollection("founding_members");
  return [...rows].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
}

export async function insertFoundingMember(
  name: string,
  image_url: string,
): Promise<FoundingMemberRow> {
  const rows = await readCollection("founding_members");
  const maxOrder = rows.length === 0 ? 0 : Math.max(...rows.map((r) => r.sort_order));
  const row: FoundingMemberRow = {
    id: nextId(rows),
    name,
    image_url,
    sort_order: maxOrder + 1,
    created_at: now(),
  };
  rows.push(row);
  await writeCollection("founding_members", rows);
  return row;
}

export async function updateFoundingMember(
  id: number,
  name: string,
  image_url: string,
): Promise<FoundingMemberRow> {
  const rows = await readCollection("founding_members");
  const idx = rows.findIndex((r) => r.id === id);
  if (idx < 0) throw new Error("Founding member not found");
  rows[idx] = { ...rows[idx], name, image_url };
  await writeCollection("founding_members", rows);
  return rows[idx];
}

export async function deleteFoundingMemberRow(id: number): Promise<{ image_url: string }> {
  const rows = await readCollection("founding_members");
  const idx = rows.findIndex((r) => r.id === id);
  if (idx < 0) throw new Error("Founding member not found");
  const [deleted] = rows.splice(idx, 1);
  await writeCollection("founding_members", rows);
  return { image_url: deleted.image_url };
}

// ---------- Membership applications ----------

export async function getApplicationRows(): Promise<ApplicationRow[]> {
  const rows = await readCollection("applications");
  return [...rows].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export async function insertApplication(
  email: string,
  name: string | null,
  data: unknown,
): Promise<{ id: number }> {
  const rows = await readCollection("applications");
  const row: ApplicationRow = {
    id: nextId(rows),
    email,
    name,
    data,
    status: "submitted",
    created_at: now(),
  };
  rows.push(row);
  await writeCollection("applications", rows);
  return { id: row.id };
}

export async function updateApplicationStatus(id: number, status: string): Promise<void> {
  const rows = await readCollection("applications");
  const idx = rows.findIndex((r) => r.id === id);
  if (idx < 0) throw new Error("Application not found");
  rows[idx] = { ...rows[idx], status };
  await writeCollection("applications", rows);
}

export async function getApplicationById(id: number): Promise<ApplicationRow | undefined> {
  const rows = await readCollection("applications");
  return rows.find((r) => r.id === id);
}

export async function deleteApplicationRow(id: number): Promise<void> {
  const rows = await readCollection("applications");
  const idx = rows.findIndex((r) => r.id === id);
  if (idx < 0) throw new Error("Application not found");
  rows.splice(idx, 1);
  await writeCollection("applications", rows);
}

// ---------- Members ----------

export async function getMemberRows(): Promise<MemberRow[]> {
  const rows = await readCollection("members");
  return [...rows].sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
  );
}

export async function getPublicMemberRows(): Promise<
  Pick<MemberRow, "id" | "name" | "firm_name" | "city">[]
> {
  const rows = await readCollection("members");
  return rows
    .filter((r) => r.status === "active")
    .map(({ id, name, firm_name, city }) => ({ id, name, firm_name, city }))
    .sort((a, b) => a.firm_name.toLowerCase().localeCompare(b.firm_name.toLowerCase()));
}

export async function insertMember(
  name: string,
  firm_name: string,
  contact: string,
  email: string,
  city: string,
  application_id?: number | null,
): Promise<MemberRow> {
  const rows = await readCollection("members");
  const row: MemberRow = {
    id: nextId(rows),
    name,
    firm_name,
    contact,
    email,
    city,
    status: "active",
    payment_status: "pending",
    paid_at: null,
    application_id: application_id ?? null,
    created_at: now(),
  };
  rows.push(row);
  await writeCollection("members", rows);
  return row;
}

export async function updateMemberRow(
  id: number,
  patch: Partial<Omit<MemberRow, "id" | "created_at">>,
): Promise<MemberRow> {
  const rows = await readCollection("members");
  const idx = rows.findIndex((r) => r.id === id);
  if (idx < 0) throw new Error("Member not found");
  rows[idx] = { ...rows[idx], ...patch };
  await writeCollection("members", rows);
  return rows[idx];
}

export async function getMemberById(id: number): Promise<MemberRow | undefined> {
  const rows = await readCollection("members");
  return rows.find((r) => r.id === id);
}

export async function getMemberByEmail(email: string): Promise<MemberRow | undefined> {
  const rows = await readCollection("members");
  return rows.find((r) => r.email.toLowerCase() === email.toLowerCase());
}

export async function deleteMemberRow(id: number): Promise<void> {
  const rows = await readCollection("members");
  const idx = rows.findIndex((r) => r.id === id);
  if (idx < 0) throw new Error("Member not found");
  rows.splice(idx, 1);
  await writeCollection("members", rows);
}

// ---------- Payment ledger ----------

export async function getPaymentRows(): Promise<PaymentRow[]> {
  const rows = await readCollection("payments");
  return [...rows].sort(
    (a, b) =>
      new Date(b.paid_on).getTime() - new Date(a.paid_on).getTime() || b.id - a.id,
  );
}

export async function insertPayment(
  member_id: number,
  amount: number,
  paid_on: string,
  note: string,
): Promise<PaymentRow> {
  const rows = await readCollection("payments");
  const row: PaymentRow = {
    id: nextId(rows),
    member_id,
    amount,
    paid_on,
    note,
    created_at: now(),
  };
  rows.push(row);
  await writeCollection("payments", rows);
  return row;
}

export async function deletePaymentRow(id: number): Promise<void> {
  const rows = await readCollection("payments");
  const idx = rows.findIndex((r) => r.id === id);
  if (idx < 0) throw new Error("Payment not found");
  rows.splice(idx, 1);
  await writeCollection("payments", rows);
}

// ---------- Admin password ----------

const ADMIN_PASSWORD_KEY = "admin_password";

async function getAdminSettings(): Promise<AdminSettingRow[]> {
  return readCollection("admin_settings");
}

async function setAdminSetting(key: string, value: string): Promise<void> {
  const rows = await readCollection("admin_settings");
  const idx = rows.findIndex((r) => r.key === key);
  const entry: AdminSettingRow = { key, value, updated_at: now() };
  if (idx >= 0) rows[idx] = entry;
  else rows.push(entry);
  await writeCollection("admin_settings", rows);
}

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
  if (typeof password !== "string" || !password) throw new Error("Incorrect password");

  if (isDbConfigured()) {
    const settings = await getAdminSettings();
    const stored = settings.find((r) => r.key === ADMIN_PASSWORD_KEY);
    if (stored) {
      if (!verifyPassword(password, stored.value)) throw new Error("Incorrect password");
      return;
    }
  }

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error("ADMIN_PASSWORD is not set on the server — add it to .env");
  if (password !== expected) throw new Error("Incorrect password");
}

export async function setAdminPassword(newPassword: string): Promise<void> {
  await setAdminSetting(ADMIN_PASSWORD_KEY, hashPassword(newPassword));
}
