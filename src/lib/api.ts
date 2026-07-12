// Server functions (TanStack Start RPC). Public reads degrade gracefully when
// the database isn't configured yet so the site still renders with defaults.
import { createServerFn } from "@tanstack/react-start";
import { getDb, isDbConfigured, requireAdmin } from "@/server/db";
import type {
  AboutContent,
  Bearer,
  ContactContent,
  GtaEvent,
  SiteContent,
} from "@/data/siteContent";
import { defaultSiteContent } from "@/data/siteContent";

type EventRow = {
  id: number;
  title: string;
  description: string;
  image_url: string;
  created_at: string;
};

function rowToEvent(r: EventRow): GtaEvent {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    imageUrl: r.image_url,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

// ---------- Public reads ----------

export const getSiteContent = createServerFn({ method: "GET" }).handler(
  async (): Promise<SiteContent> => {
    if (!isDbConfigured()) return defaultSiteContent;
    try {
      const { sql, ready } = getDb();
      await ready;
      const rows = (await sql`SELECT key, value FROM site_content`) as {
        key: string;
        value: unknown;
      }[];
      const byKey = Object.fromEntries(rows.map((r) => [r.key, r.value]));
      return {
        about: (byKey.about as AboutContent) ?? defaultSiteContent.about,
        bearers: (byKey.bearers as Bearer[]) ?? defaultSiteContent.bearers,
        contact: (byKey.contact as ContactContent) ?? defaultSiteContent.contact,
      };
    } catch (err) {
      console.error("getSiteContent failed, using defaults:", err);
      return defaultSiteContent;
    }
  },
);

export const getEvents = createServerFn({ method: "GET" }).handler(
  async (): Promise<GtaEvent[]> => {
    if (!isDbConfigured()) return [];
    try {
      const { sql, ready } = getDb();
      await ready;
      const rows = (await sql`
        SELECT id, title, description, image_url, created_at
        FROM events ORDER BY created_at DESC, id DESC
      `) as EventRow[];
      return rows.map(rowToEvent);
    } catch (err) {
      console.error("getEvents failed, returning none:", err);
      return [];
    }
  },
);

// ---------- Membership application ----------

export type ApplicationFileMeta = { url: string; name: string; size: number; type: string };

export type ApplicationData = {
  values: Record<string, string | string[]>;
  files: Partial<Record<string, ApplicationFileMeta>>;
};

export type ApplicationRecord = {
  id: number;
  email: string;
  name: string | null;
  data: ApplicationData;
  createdAt: string;
};

export const submitApplication = createServerFn({ method: "POST" })
  .validator((input: { email: string; name: string; data: ApplicationData }) => {
    if (!input || typeof input.email !== "string" || !input.email.includes("@")) {
      throw new Error("A valid email is required");
    }
    return input;
  })
  .handler(async ({ data }) => {
    const { sql, ready } = getDb();
    await ready;
    const rows = (await sql`
      INSERT INTO membership_applications (email, name, data)
      VALUES (${data.email}, ${data.name || null}, ${JSON.stringify(data.data)})
      RETURNING id
    `) as { id: number }[];
    return { id: rows[0].id };
  });

// ---------- Admin ----------

export const adminVerify = createServerFn({ method: "POST" })
  .validator((input: { password: string }) => input)
  .handler(async ({ data }) => {
    requireAdmin(data.password);
    return { ok: true };
  });

export const saveSiteContent = createServerFn({ method: "POST" })
  .validator(
    (input: { password: string; key: "about" | "bearers" | "contact"; value: unknown }) => {
      if (!["about", "bearers", "contact"].includes(input.key)) {
        throw new Error("Invalid content key");
      }
      return input;
    },
  )
  .handler(async ({ data }) => {
    requireAdmin(data.password);
    const { sql, ready } = getDb();
    await ready;
    await sql`
      INSERT INTO site_content (key, value, updated_at)
      VALUES (${data.key}, ${JSON.stringify(data.value)}, now())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
    `;
    return { ok: true };
  });

export const createEvent = createServerFn({ method: "POST" })
  .validator(
    (input: { password: string; title: string; description: string; imageUrl: string }) => {
      if (!input.title?.trim()) throw new Error("Title is required");
      if (!input.imageUrl?.trim()) throw new Error("An image is required");
      return input;
    },
  )
  .handler(async ({ data }) => {
    requireAdmin(data.password);
    const { sql, ready } = getDb();
    await ready;
    const rows = (await sql`
      INSERT INTO events (title, description, image_url)
      VALUES (${data.title.trim()}, ${data.description.trim()}, ${data.imageUrl})
      RETURNING id, title, description, image_url, created_at
    `) as EventRow[];
    return rowToEvent(rows[0]);
  });

export const updateEvent = createServerFn({ method: "POST" })
  .validator(
    (input: {
      password: string;
      id: number;
      title: string;
      description: string;
      imageUrl: string;
    }) => {
      if (!input.title?.trim()) throw new Error("Title is required");
      return input;
    },
  )
  .handler(async ({ data }) => {
    requireAdmin(data.password);
    const { sql, ready } = getDb();
    await ready;
    await sql`
      UPDATE events
      SET title = ${data.title.trim()}, description = ${data.description.trim()},
          image_url = ${data.imageUrl}
      WHERE id = ${data.id}
    `;
    return { ok: true };
  });

export const deleteEvent = createServerFn({ method: "POST" })
  .validator((input: { password: string; id: number }) => input)
  .handler(async ({ data }) => {
    requireAdmin(data.password);
    const { sql, ready } = getDb();
    await ready;
    await sql`DELETE FROM events WHERE id = ${data.id}`;
    return { ok: true };
  });

export const getApplications = createServerFn({ method: "POST" })
  .validator((input: { password: string }) => input)
  .handler(async ({ data }): Promise<ApplicationRecord[]> => {
    requireAdmin(data.password);
    const { sql, ready } = getDb();
    await ready;
    const rows = (await sql`
      SELECT id, email, name, data, created_at
      FROM membership_applications ORDER BY created_at DESC
    `) as {
      id: number;
      email: string;
      name: string | null;
      data: ApplicationData;
      created_at: string;
    }[];
    return rows.map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      data: r.data,
      createdAt: new Date(r.created_at).toISOString(),
    }));
  });
