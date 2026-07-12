// Server functions (TanStack Start RPC). Public reads degrade gracefully when
// the database isn't configured yet so the site still renders with defaults.
import { createServerFn } from "@tanstack/react-start";
import { getDb, isDbConfigured, requireAdmin } from "@/server/db";
import type {
  AboutContent,
  Bearer,
  ContactContent,
  GtaEvent,
  PaymentContent,
  SiteContent,
} from "@/data/siteContent";
import { defaultSiteContent } from "@/data/siteContent";
import type {
  ApplicationStatus,
  Member,
  MemberStatus,
  PaymentStatus,
  PublicMember,
} from "@/data/members";
import { APPLICATION_STATUSES } from "@/data/members";

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
      // Spread stored values over the defaults so rows saved before a field
      // existed (e.g. about.image) still pick up the default for it.
      return {
        about: { ...defaultSiteContent.about, ...((byKey.about as Partial<AboutContent>) ?? {}) },
        bearers: (byKey.bearers as Bearer[]) ?? defaultSiteContent.bearers,
        contact: {
          ...defaultSiteContent.contact,
          ...((byKey.contact as Partial<ContactContent>) ?? {}),
        },
        payment: {
          ...defaultSiteContent.payment,
          ...((byKey.payment as Partial<PaymentContent>) ?? {}),
        },
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
        FROM events ORDER BY sort_order ASC, id ASC
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
  status: ApplicationStatus;
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
    (input: {
      password: string;
      key: "about" | "bearers" | "contact" | "payment";
      value: unknown;
    }) => {
      if (!["about", "bearers", "contact", "payment"].includes(input.key)) {
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
    // New events append at the end of the display order; admin can reorder.
    const rows = (await sql`
      INSERT INTO events (title, description, image_url, sort_order)
      VALUES (${data.title.trim()}, ${data.description.trim()}, ${data.imageUrl},
              (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM events))
      RETURNING id, title, description, image_url, created_at
    `) as EventRow[];
    return rowToEvent(rows[0]);
  });

export const reorderEvents = createServerFn({ method: "POST" })
  .validator((input: { password: string; orderedIds: number[] }) => {
    if (!Array.isArray(input.orderedIds) || input.orderedIds.some((id) => !Number.isInteger(id))) {
      throw new Error("Invalid event order");
    }
    return input;
  })
  .handler(async ({ data }) => {
    requireAdmin(data.password);
    const { sql, ready } = getDb();
    await ready;
    await Promise.all(
      data.orderedIds.map(
        (id, index) => sql`UPDATE events SET sort_order = ${index + 1} WHERE id = ${id}`,
      ),
    );
    return { ok: true };
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
      SELECT id, email, name, data, status, created_at
      FROM membership_applications ORDER BY created_at DESC
    `) as {
      id: number;
      email: string;
      name: string | null;
      data: ApplicationData;
      status: ApplicationStatus;
      created_at: string;
    }[];
    return rows.map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      data: r.data,
      status: r.status,
      createdAt: new Date(r.created_at).toISOString(),
    }));
  });

export const updateApplicationStatus = createServerFn({ method: "POST" })
  .validator((input: { password: string; id: number; status: ApplicationStatus }) => {
    if (!APPLICATION_STATUSES.some((s) => s.value === input.status)) {
      throw new Error("Invalid application status");
    }
    return input;
  })
  .handler(async ({ data }) => {
    requireAdmin(data.password);
    const { sql, ready } = getDb();
    await ready;
    await sql`UPDATE membership_applications SET status = ${data.status} WHERE id = ${data.id}`;
    return { ok: true };
  });

// ---------- Members ----------

type MemberRow = {
  id: number;
  name: string;
  firm_name: string;
  contact: string;
  email: string;
  status: MemberStatus;
  payment_status: PaymentStatus;
  paid_at: string | null;
  application_id: number | null;
  created_at: string;
};

function rowToMember(r: MemberRow): Member {
  return {
    id: r.id,
    name: r.name,
    firmName: r.firm_name,
    contact: r.contact,
    email: r.email,
    status: r.status,
    paymentStatus: r.payment_status,
    paidAt: r.paid_at ? new Date(r.paid_at).toISOString() : null,
    applicationId: r.application_id,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

// Public directory: active members only, no contact details.
export const getPublicMembers = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicMember[]> => {
    if (!isDbConfigured()) return [];
    try {
      const { sql, ready } = getDb();
      await ready;
      const rows = (await sql`
        SELECT id, name, firm_name FROM members
        WHERE status = 'active' ORDER BY lower(name) ASC
      `) as { id: number; name: string; firm_name: string }[];
      return rows.map((r) => ({ id: r.id, name: r.name, firmName: r.firm_name }));
    } catch (err) {
      console.error("getPublicMembers failed, returning none:", err);
      return [];
    }
  },
);

export const adminGetMembers = createServerFn({ method: "POST" })
  .validator((input: { password: string }) => input)
  .handler(async ({ data }): Promise<Member[]> => {
    requireAdmin(data.password);
    const { sql, ready } = getDb();
    await ready;
    const rows = (await sql`
      SELECT id, name, firm_name, contact, email, status, payment_status, paid_at,
             application_id, created_at
      FROM members ORDER BY lower(name) ASC
    `) as MemberRow[];
    return rows.map(rowToMember);
  });

export const addMember = createServerFn({ method: "POST" })
  .validator(
    (input: {
      password: string;
      name: string;
      firmName: string;
      contact: string;
      email: string;
    }) => {
      if (!input.name?.trim()) throw new Error("Member name is required");
      return input;
    },
  )
  .handler(async ({ data }): Promise<Member> => {
    requireAdmin(data.password);
    const { sql, ready } = getDb();
    await ready;
    const rows = (await sql`
      INSERT INTO members (name, firm_name, contact, email)
      VALUES (${data.name.trim()}, ${data.firmName.trim()}, ${data.contact.trim()},
              ${data.email.trim()})
      RETURNING id, name, firm_name, contact, email, status, payment_status, paid_at,
                application_id, created_at
    `) as MemberRow[];
    return rowToMember(rows[0]);
  });

export const updateMember = createServerFn({ method: "POST" })
  .validator(
    (input: {
      password: string;
      id: number;
      status?: MemberStatus;
      paymentStatus?: PaymentStatus;
    }) => {
      if (input.status && !["active", "inactive"].includes(input.status)) {
        throw new Error("Invalid member status");
      }
      if (input.paymentStatus && !["pending", "paid"].includes(input.paymentStatus)) {
        throw new Error("Invalid payment status");
      }
      return input;
    },
  )
  .handler(async ({ data }): Promise<Member> => {
    requireAdmin(data.password);
    const { sql, ready } = getDb();
    await ready;
    if (data.status) {
      await sql`UPDATE members SET status = ${data.status} WHERE id = ${data.id}`;
    }
    if (data.paymentStatus) {
      await sql`
        UPDATE members
        SET payment_status = ${data.paymentStatus},
            paid_at = ${data.paymentStatus === "paid" ? new Date().toISOString() : null}
        WHERE id = ${data.id}
      `;
    }
    const rows = (await sql`
      SELECT id, name, firm_name, contact, email, status, payment_status, paid_at,
             application_id, created_at
      FROM members WHERE id = ${data.id}
    `) as MemberRow[];
    if (!rows[0]) throw new Error("Member not found");
    return rowToMember(rows[0]);
  });

export const deleteMember = createServerFn({ method: "POST" })
  .validator((input: { password: string; id: number }) => input)
  .handler(async ({ data }) => {
    requireAdmin(data.password);
    const { sql, ready } = getDb();
    await ready;
    await sql`DELETE FROM members WHERE id = ${data.id}`;
    return { ok: true };
  });

// Approve an application: create a member from the answers (if one with the
// same email doesn't already exist) and move the application to "reviewed".
export const approveApplication = createServerFn({ method: "POST" })
  .validator((input: { password: string; applicationId: number }) => input)
  .handler(async ({ data }): Promise<Member> => {
    requireAdmin(data.password);
    const { sql, ready } = getDb();
    await ready;
    const apps = (await sql`
      SELECT id, email, name, data, status FROM membership_applications
      WHERE id = ${data.applicationId}
    `) as {
      id: number;
      email: string;
      name: string | null;
      data: ApplicationData;
      status: string;
    }[];
    const app = apps[0];
    if (!app) throw new Error("Application not found");

    const existing = (await sql`
      SELECT id, name, firm_name, contact, email, status, payment_status, paid_at,
             application_id, created_at
      FROM members WHERE lower(email) = ${app.email.toLowerCase()} LIMIT 1
    `) as MemberRow[];
    if (existing[0]) return rowToMember(existing[0]);

    const values = app.data?.values ?? {};
    const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
    const name = str(values.name) || app.name || app.email;
    const firm = str(values.companyName);
    const contact = str(values.contactNumber);

    const rows = (await sql`
      INSERT INTO members (name, firm_name, contact, email, application_id)
      VALUES (${name}, ${firm}, ${contact}, ${app.email}, ${app.id})
      RETURNING id, name, firm_name, contact, email, status, payment_status, paid_at,
                application_id, created_at
    `) as MemberRow[];
    if (app.status === "submitted") {
      await sql`UPDATE membership_applications SET status = 'reviewed' WHERE id = ${app.id}`;
    }
    return rowToMember(rows[0]);
  });
