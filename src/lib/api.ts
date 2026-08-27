// Server functions (TanStack Start RPC). Public reads degrade gracefully when
// the database isn't configured yet so the site still renders with defaults.
import { createServerFn } from "@tanstack/react-start";
import { del } from "@vercel/blob";
import { getDb, isDbConfigured, requireAdmin, setAdminPassword } from "@/server/db";
import type {
  AboutContent,
  Bearer,
  ContactContent,
  FoundingMember,
  GtaEvent,
  PaymentContent,
  SiteContent,
} from "@/data/siteContent";
import { defaultSiteContent } from "@/data/siteContent";
import type {
  ApplicationStatus,
  Member,
  MemberPayment,
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
  image_urls: string[] | null;
  created_at: string;
};

function rowToEvent(r: EventRow): GtaEvent {
  // Rows created before the gallery existed fall back to the single image_url.
  const gallery = Array.isArray(r.image_urls) ? r.image_urls.filter(Boolean) : [];
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    imageUrls: gallery.length > 0 ? gallery : r.image_url ? [r.image_url] : [],
    createdAt: new Date(r.created_at).toISOString(),
  };
}

function validateImageUrls(imageUrls: unknown): string[] {
  if (!Array.isArray(imageUrls)) throw new Error("At least one image is required");
  const urls = imageUrls.filter((u): u is string => typeof u === "string" && u.trim() !== "");
  if (urls.length === 0) throw new Error("At least one image is required");
  return urls;
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
        SELECT id, title, description, image_url, image_urls, created_at
        FROM events ORDER BY sort_order ASC, id ASC
      `) as EventRow[];
      return rows.map(rowToEvent);
    } catch (err) {
      console.error("getEvents failed, returning none:", err);
      return [];
    }
  },
);

// ---------- Founding members ----------

type FoundingRow = {
  id: number;
  name: string;
  image_url: string;
  created_at: string;
};

function rowToFounding(r: FoundingRow): FoundingMember {
  return {
    id: r.id,
    name: r.name,
    imageUrl: r.image_url,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

export const getFoundingMembers = createServerFn({ method: "GET" }).handler(
  async (): Promise<FoundingMember[]> => {
    if (!isDbConfigured()) return [];
    try {
      const { sql, ready } = getDb();
      await ready;
      const rows = (await sql`
        SELECT id, name, image_url, created_at
        FROM founding_members ORDER BY sort_order ASC, id ASC
      `) as FoundingRow[];
      return rows.map(rowToFounding);
    } catch (err) {
      console.error("getFoundingMembers failed, returning none:", err);
      return [];
    }
  },
);

export const addFoundingMember = createServerFn({ method: "POST" })
  .validator((input: { password: string; name: string; imageUrl: string }) => {
    if (!input.name?.trim()) throw new Error("Name is required");
    return input;
  })
  .handler(async ({ data }): Promise<FoundingMember> => {
    await requireAdmin(data.password);
    const { sql, ready } = getDb();
    await ready;
    const rows = (await sql`
      INSERT INTO founding_members (name, image_url, sort_order)
      VALUES (${data.name.trim()}, ${data.imageUrl ?? ""},
              (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM founding_members))
      RETURNING id, name, image_url, created_at
    `) as FoundingRow[];
    return rowToFounding(rows[0]);
  });

export const updateFoundingMember = createServerFn({ method: "POST" })
  .validator((input: { password: string; id: number; name: string; imageUrl: string }) => {
    if (!input.name?.trim()) throw new Error("Name is required");
    return input;
  })
  .handler(async ({ data }): Promise<FoundingMember> => {
    await requireAdmin(data.password);
    const { sql, ready } = getDb();
    await ready;
    const rows = (await sql`
      UPDATE founding_members
      SET name = ${data.name.trim()}, image_url = ${data.imageUrl ?? ""}
      WHERE id = ${data.id}
      RETURNING id, name, image_url, created_at
    `) as FoundingRow[];
    if (!rows[0]) throw new Error("Founding member not found");
    return rowToFounding(rows[0]);
  });

export const deleteFoundingMember = createServerFn({ method: "POST" })
  .validator((input: { password: string; id: number }) => input)
  .handler(async ({ data }) => {
    await requireAdmin(data.password);
    const { sql, ready } = getDb();
    await ready;
    const rows = (await sql`
      DELETE FROM founding_members WHERE id = ${data.id} RETURNING image_url
    `) as { image_url: string }[];
    // Remove the uploaded photo from storage as well.
    await deleteBlobUrls(rows.map((r) => r.image_url).filter(Boolean));
    return { ok: true };
  });

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
    await requireAdmin(data.password);
    return { ok: true };
  });

// Best-effort removal of admin uploads from Vercel Blob. External URLs (e.g.
// the default Unsplash images) and failures are ignored so content operations
// never block on storage cleanup.
async function deleteBlobUrls(urls: string[]): Promise<void> {
  const blobUrls = urls.filter((u) => {
    try {
      return new URL(u).hostname.endsWith(".blob.vercel-storage.com");
    } catch {
      return false;
    }
  });
  if (blobUrls.length === 0) return;
  try {
    await del(blobUrls);
  } catch (err) {
    console.error("Blob cleanup failed:", err);
  }
}

// Called from the admin editors when an image is replaced or removed, so the
// old file doesn't linger in storage.
export const deleteUploadedFiles = createServerFn({ method: "POST" })
  .validator((input: { password: string; urls: string[] }) => {
    if (!Array.isArray(input.urls)) throw new Error("Invalid file list");
    return input;
  })
  .handler(async ({ data }) => {
    await requireAdmin(data.password);
    await deleteBlobUrls(data.urls.filter((u): u is string => typeof u === "string"));
    return { ok: true };
  });

export const changeAdminPassword = createServerFn({ method: "POST" })
  .validator((input: { password: string; newPassword: string }) => {
    if (typeof input.newPassword !== "string" || input.newPassword.trim().length < 8) {
      throw new Error("The new password must be at least 8 characters");
    }
    return input;
  })
  .handler(async ({ data }) => {
    await requireAdmin(data.password);
    await setAdminPassword(data.newPassword.trim());
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
    await requireAdmin(data.password);
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
    (input: { password: string; title: string; description: string; imageUrls: string[] }) => {
      if (!input.title?.trim()) throw new Error("Title is required");
      validateImageUrls(input.imageUrls);
      return input;
    },
  )
  .handler(async ({ data }) => {
    await requireAdmin(data.password);
    const urls = validateImageUrls(data.imageUrls);
    const { sql, ready } = getDb();
    await ready;
    // New events append at the end of the display order; admin can reorder.
    // image_url mirrors the first gallery image (the cover) for older readers.
    const rows = (await sql`
      INSERT INTO events (title, description, image_url, image_urls, sort_order)
      VALUES (${data.title.trim()}, ${data.description.trim()}, ${urls[0]},
              ${JSON.stringify(urls)},
              (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM events))
      RETURNING id, title, description, image_url, image_urls, created_at
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
    await requireAdmin(data.password);
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
      imageUrls: string[];
    }) => {
      if (!input.title?.trim()) throw new Error("Title is required");
      validateImageUrls(input.imageUrls);
      return input;
    },
  )
  .handler(async ({ data }) => {
    await requireAdmin(data.password);
    const urls = validateImageUrls(data.imageUrls);
    const { sql, ready } = getDb();
    await ready;
    await sql`
      UPDATE events
      SET title = ${data.title.trim()}, description = ${data.description.trim()},
          image_url = ${urls[0]}, image_urls = ${JSON.stringify(urls)}
      WHERE id = ${data.id}
    `;
    return { ok: true };
  });

export const deleteEvent = createServerFn({ method: "POST" })
  .validator((input: { password: string; id: number }) => input)
  .handler(async ({ data }) => {
    await requireAdmin(data.password);
    const { sql, ready } = getDb();
    await ready;
    const rows = (await sql`
      DELETE FROM events WHERE id = ${data.id} RETURNING image_url, image_urls
    `) as { image_url: string; image_urls: string[] | null }[];
    // Remove the event's uploaded images from storage as well.
    const urls = new Set<string>();
    for (const r of rows) {
      if (r.image_url) urls.add(r.image_url);
      for (const u of r.image_urls ?? []) if (u) urls.add(u);
    }
    await deleteBlobUrls([...urls]);
    return { ok: true };
  });

export const getApplications = createServerFn({ method: "POST" })
  .validator((input: { password: string }) => input)
  .handler(async ({ data }): Promise<ApplicationRecord[]> => {
    await requireAdmin(data.password);
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
    await requireAdmin(data.password);
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
  city: string;
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
    city: r.city,
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
        SELECT id, name, firm_name, city FROM members
        WHERE status = 'active' ORDER BY lower(firm_name) ASC
      `) as { id: number; name: string; firm_name: string; city: string }[];
      return rows.map((r) => ({ id: r.id, name: r.name, firmName: r.firm_name, city: r.city }));
    } catch (err) {
      console.error("getPublicMembers failed, returning none:", err);
      return [];
    }
  },
);

export const adminGetMembers = createServerFn({ method: "POST" })
  .validator((input: { password: string }) => input)
  .handler(async ({ data }): Promise<Member[]> => {
    await requireAdmin(data.password);
    const { sql, ready } = getDb();
    await ready;
    const rows = (await sql`
      SELECT id, name, firm_name, contact, email, city, status, payment_status, paid_at,
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
      city?: string;
    }) => {
      if (!input.name?.trim()) throw new Error("Member name is required");
      return input;
    },
  )
  .handler(async ({ data }): Promise<Member> => {
    await requireAdmin(data.password);
    const { sql, ready } = getDb();
    await ready;
    const rows = (await sql`
      INSERT INTO members (name, firm_name, contact, email, city)
      VALUES (${data.name.trim()}, ${data.firmName.trim()}, ${data.contact.trim()},
              ${data.email.trim()}, ${data.city?.trim() ?? ""})
      RETURNING id, name, firm_name, contact, email, city, status, payment_status, paid_at,
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
      name?: string;
      firmName?: string;
      contact?: string;
      email?: string;
      city?: string;
    }) => {
      if (input.status && !["active", "inactive"].includes(input.status)) {
        throw new Error("Invalid member status");
      }
      if (input.paymentStatus && !["pending", "paid"].includes(input.paymentStatus)) {
        throw new Error("Invalid payment status");
      }
      if (input.name !== undefined && !input.name.trim()) {
        throw new Error("Member name is required");
      }
      return input;
    },
  )
  .handler(async ({ data }): Promise<Member> => {
    await requireAdmin(data.password);
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
    // Detail edits: undefined leaves a column untouched (COALESCE skips NULL),
    // while an empty string clears it.
    const norm = (v?: string) => (v === undefined ? null : v.trim());
    if (
      [data.name, data.firmName, data.contact, data.email, data.city].some((v) => v !== undefined)
    ) {
      await sql`
        UPDATE members
        SET name = COALESCE(${norm(data.name)}, name),
            firm_name = COALESCE(${norm(data.firmName)}, firm_name),
            contact = COALESCE(${norm(data.contact)}, contact),
            email = COALESCE(${norm(data.email)}, email),
            city = COALESCE(${norm(data.city)}, city)
        WHERE id = ${data.id}
      `;
    }
    const rows = (await sql`
      SELECT id, name, firm_name, contact, email, city, status, payment_status, paid_at,
             application_id, created_at
      FROM members WHERE id = ${data.id}
    `) as MemberRow[];
    if (!rows[0]) throw new Error("Member not found");
    return rowToMember(rows[0]);
  });

export const deleteMember = createServerFn({ method: "POST" })
  .validator((input: { password: string; id: number }) => input)
  .handler(async ({ data }) => {
    await requireAdmin(data.password);
    const { sql, ready } = getDb();
    await ready;
    await sql`DELETE FROM members WHERE id = ${data.id}`;
    return { ok: true };
  });

// ---------- Member payment ledger ----------

type PaymentRow = {
  id: number;
  member_id: number;
  amount: string | number;
  paid_on: string | Date;
  note: string;
  created_at: string;
};

function rowToPayment(r: PaymentRow): MemberPayment {
  const paidOn =
    r.paid_on instanceof Date
      ? r.paid_on.toISOString().slice(0, 10)
      : String(r.paid_on).slice(0, 10);
  return {
    id: r.id,
    memberId: r.member_id,
    amount: Number(r.amount),
    paidOn,
    note: r.note,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

export const adminGetPayments = createServerFn({ method: "POST" })
  .validator((input: { password: string }) => input)
  .handler(async ({ data }): Promise<MemberPayment[]> => {
    await requireAdmin(data.password);
    const { sql, ready } = getDb();
    await ready;
    const rows = (await sql`
      SELECT id, member_id, amount, paid_on, note, created_at
      FROM member_payments ORDER BY paid_on DESC, id DESC
    `) as PaymentRow[];
    return rows.map(rowToPayment);
  });

// Recording a payment also marks the member as paid (paid_at = payment date).
export const addMemberPayment = createServerFn({ method: "POST" })
  .validator(
    (input: {
      password: string;
      memberId: number;
      amount: number;
      paidOn: string;
      note?: string;
    }) => {
      if (!Number.isFinite(input.amount) || input.amount <= 0) {
        throw new Error("Enter a payment amount greater than zero");
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(input.paidOn)) {
        throw new Error("Enter a valid payment date");
      }
      return input;
    },
  )
  .handler(async ({ data }): Promise<{ payment: MemberPayment; member: Member }> => {
    await requireAdmin(data.password);
    const { sql, ready } = getDb();
    await ready;
    const rows = (await sql`
      INSERT INTO member_payments (member_id, amount, paid_on, note)
      VALUES (${data.memberId}, ${data.amount}, ${data.paidOn}, ${data.note?.trim() ?? ""})
      RETURNING id, member_id, amount, paid_on, note, created_at
    `) as PaymentRow[];
    const memberRows = (await sql`
      UPDATE members SET payment_status = 'paid', paid_at = ${data.paidOn}
      WHERE id = ${data.memberId}
      RETURNING id, name, firm_name, contact, email, city, status, payment_status, paid_at,
                application_id, created_at
    `) as MemberRow[];
    if (!memberRows[0]) throw new Error("Member not found");
    return { payment: rowToPayment(rows[0]), member: rowToMember(memberRows[0]) };
  });

export const deleteMemberPayment = createServerFn({ method: "POST" })
  .validator((input: { password: string; id: number }) => input)
  .handler(async ({ data }) => {
    await requireAdmin(data.password);
    const { sql, ready } = getDb();
    await ready;
    await sql`DELETE FROM member_payments WHERE id = ${data.id}`;
    return { ok: true };
  });

// Approve an application: create a member from the answers (if one with the
// same email doesn't already exist) and move the application to "reviewed".
export const approveApplication = createServerFn({ method: "POST" })
  .validator((input: { password: string; applicationId: number }) => input)
  .handler(async ({ data }): Promise<Member> => {
    await requireAdmin(data.password);
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
      SELECT id, name, firm_name, contact, email, city, status, payment_status, paid_at,
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
      RETURNING id, name, firm_name, contact, email, city, status, payment_status, paid_at,
                application_id, created_at
    `) as MemberRow[];
    if (app.status === "submitted") {
      await sql`UPDATE membership_applications SET status = 'reviewed' WHERE id = ${app.id}`;
    }
    return rowToMember(rows[0]);
  });
