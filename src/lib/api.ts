// Server functions (TanStack Start RPC). Public reads degrade gracefully when
// the blob store isn't configured yet so the site still renders with defaults.
import { createServerFn } from "@tanstack/react-start";
import { del } from "@vercel/blob";
import {
  isDbConfigured,
  requireAdmin,
  setAdminPassword,
  // site content
  getSiteContentRows,
  upsertSiteContent,
  // events
  getEventRows,
  insertEvent,
  updateEvent as updateEventInStore,
  reorderEvents as reorderEventsInStore,
  deleteEventRow,
  // founding members
  getFoundingMemberRows,
  insertFoundingMember,
  updateFoundingMember as updateFoundingMemberInStore,
  deleteFoundingMemberRow,
  // applications
  getApplicationRows,
  insertApplication,
  updateApplicationStatus as updateApplicationStatusInStore,
  getApplicationById,
  deleteApplicationRow,
  // members
  getMemberRows,
  getPublicMemberRows,
  insertMember,
  updateMemberRow,
  getMemberByEmail,
  deleteMemberRow,
  // payments
  getPaymentRows,
  insertPayment,
  deletePaymentRow,
  type EventRow,
  type FoundingMemberRow,
  type MemberRow,
  type PaymentRow,
} from "@/server/blob-store";
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

// ---------------------------------------------------------------------------
// Row → domain type converters
// ---------------------------------------------------------------------------

function rowToEvent(r: EventRow): GtaEvent {
  const gallery = Array.isArray(r.image_urls) ? r.image_urls.filter(Boolean) : [];
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    imageUrls: gallery.length > 0 ? gallery : r.image_url ? [r.image_url] : [],
    createdAt: new Date(r.created_at).toISOString(),
  };
}

function rowToFounding(r: FoundingMemberRow): FoundingMember {
  return {
    id: r.id,
    name: r.name,
    imageUrl: r.image_url,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

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

function rowToPayment(r: PaymentRow): MemberPayment {
  return {
    id: r.id,
    memberId: r.member_id,
    amount: Number(r.amount),
    paidOn: String(r.paid_on).slice(0, 10),
    note: r.note,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

function validateImageUrls(imageUrls: unknown): string[] {
  if (!Array.isArray(imageUrls)) throw new Error("At least one image is required");
  const urls = imageUrls.filter((u): u is string => typeof u === "string" && u.trim() !== "");
  if (urls.length === 0) throw new Error("At least one image is required");
  return urls;
}

// ---------------------------------------------------------------------------
// Public reads
// ---------------------------------------------------------------------------

export const getSiteContent = createServerFn({ method: "GET" }).handler(
  async (): Promise<SiteContent> => {
    if (!isDbConfigured()) return defaultSiteContent;
    try {
      const rows = await getSiteContentRows();
      const byKey = Object.fromEntries(rows.map((r) => [r.key, r.value]));
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
      const rows = await getEventRows();
      return rows.map(rowToEvent);
    } catch (err) {
      console.error("getEvents failed, returning none:", err);
      return [];
    }
  },
);

// ---------------------------------------------------------------------------
// Founding members
// ---------------------------------------------------------------------------

export const getFoundingMembers = createServerFn({ method: "GET" }).handler(
  async (): Promise<FoundingMember[]> => {
    if (!isDbConfigured()) return [];
    try {
      const rows = await getFoundingMemberRows();
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
    const row = await insertFoundingMember(data.name.trim(), data.imageUrl ?? "");
    return rowToFounding(row);
  });

export const updateFoundingMember = createServerFn({ method: "POST" })
  .validator((input: { password: string; id: number; name: string; imageUrl: string }) => {
    if (!input.name?.trim()) throw new Error("Name is required");
    return input;
  })
  .handler(async ({ data }): Promise<FoundingMember> => {
    await requireAdmin(data.password);
    const row = await updateFoundingMemberInStore(data.id, data.name.trim(), data.imageUrl ?? "");
    return rowToFounding(row);
  });

export const deleteFoundingMember = createServerFn({ method: "POST" })
  .validator((input: { password: string; id: number }) => input)
  .handler(async ({ data }) => {
    await requireAdmin(data.password);
    const { image_url } = await deleteFoundingMemberRow(data.id);
    await deleteBlobUrls([image_url].filter(Boolean));
    return { ok: true };
  });

// ---------------------------------------------------------------------------
// Membership application
// ---------------------------------------------------------------------------

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
    return insertApplication(data.email, data.name || null, data.data);
  });

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export const adminVerify = createServerFn({ method: "POST" })
  .validator((input: { password: string }) => input)
  .handler(async ({ data }) => {
    await requireAdmin(data.password);
    return { ok: true };
  });

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
    await upsertSiteContent(data.key, data.value);
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
    const row = await insertEvent(data.title.trim(), data.description.trim(), urls[0], urls);
    return rowToEvent(row);
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
    await reorderEventsInStore(data.orderedIds);
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
    await updateEventInStore(data.id, data.title.trim(), data.description.trim(), urls[0], urls);
    return { ok: true };
  });

export const deleteEvent = createServerFn({ method: "POST" })
  .validator((input: { password: string; id: number }) => input)
  .handler(async ({ data }) => {
    await requireAdmin(data.password);
    const { image_url, image_urls } = await deleteEventRow(data.id);
    const urls = new Set<string>();
    if (image_url) urls.add(image_url);
    for (const u of image_urls ?? []) if (u) urls.add(u);
    await deleteBlobUrls([...urls]);
    return { ok: true };
  });

export const getApplications = createServerFn({ method: "POST" })
  .validator((input: { password: string }) => input)
  .handler(async ({ data }): Promise<ApplicationRecord[]> => {
    await requireAdmin(data.password);
    const rows = await getApplicationRows();
    return rows.map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      data: r.data as ApplicationData,
      status: r.status as ApplicationStatus,
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
    await updateApplicationStatusInStore(data.id, data.status);
    return { ok: true };
  });

export const deleteApplication = createServerFn({ method: "POST" })
  .validator((input: { password: string; id: number }) => {
    if (!input || typeof input.id !== "number") throw new Error("Invalid application id");
    return input;
  })
  .handler(async ({ data }) => {
    await requireAdmin(data.password);
    await deleteApplicationRow(data.id);
    return { ok: true };
  });

// ---------------------------------------------------------------------------
// Members
// ---------------------------------------------------------------------------

export const getPublicMembers = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicMember[]> => {
    if (!isDbConfigured()) return [];
    try {
      const rows = await getPublicMemberRows();
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
    const rows = await getMemberRows();
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
    const row = await insertMember(
      data.name.trim(),
      data.firmName.trim(),
      data.contact.trim(),
      data.email.trim(),
      data.city?.trim() ?? "",
    );
    return rowToMember(row);
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
    const patch: Partial<Omit<MemberRow, "id" | "created_at">> = {};
    if (data.status) patch.status = data.status;
    if (data.paymentStatus) {
      patch.payment_status = data.paymentStatus;
      patch.paid_at = data.paymentStatus === "paid" ? new Date().toISOString() : null;
    }
    if (data.name !== undefined) patch.name = data.name.trim();
    if (data.firmName !== undefined) patch.firm_name = data.firmName.trim();
    if (data.contact !== undefined) patch.contact = data.contact.trim();
    if (data.email !== undefined) patch.email = data.email.trim();
    if (data.city !== undefined) patch.city = data.city.trim();
    const row = await updateMemberRow(data.id, patch);
    return rowToMember(row);
  });

export const deleteMember = createServerFn({ method: "POST" })
  .validator((input: { password: string; id: number }) => input)
  .handler(async ({ data }) => {
    await requireAdmin(data.password);
    await deleteMemberRow(data.id);
    return { ok: true };
  });

// ---------------------------------------------------------------------------
// Member payment ledger
// ---------------------------------------------------------------------------

export const adminGetPayments = createServerFn({ method: "POST" })
  .validator((input: { password: string }) => input)
  .handler(async ({ data }): Promise<MemberPayment[]> => {
    await requireAdmin(data.password);
    const rows = await getPaymentRows();
    return rows.map(rowToPayment);
  });

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
    const paymentRow = await insertPayment(
      data.memberId,
      data.amount,
      data.paidOn,
      data.note?.trim() ?? "",
    );
    const memberRow = await updateMemberRow(data.memberId, {
      payment_status: "paid",
      paid_at: data.paidOn,
    });
    return { payment: rowToPayment(paymentRow), member: rowToMember(memberRow) };
  });

export const deleteMemberPayment = createServerFn({ method: "POST" })
  .validator((input: { password: string; id: number }) => input)
  .handler(async ({ data }) => {
    await requireAdmin(data.password);
    await deletePaymentRow(data.id);
    return { ok: true };
  });

export const approveApplication = createServerFn({ method: "POST" })
  .validator((input: { password: string; applicationId: number }) => input)
  .handler(async ({ data }): Promise<Member> => {
    await requireAdmin(data.password);
    const app = await getApplicationById(data.applicationId);
    if (!app) throw new Error("Application not found");

    const existing = await getMemberByEmail(app.email);
    if (existing) return rowToMember(existing);

    const appData = app.data as ApplicationData;
    const values = appData?.values ?? {};
    const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
    const name = str(values.name) || app.name || app.email;
    const firm = str(values.companyName);
    const contact = str(values.contactNumber);

    const memberRow = await insertMember(name, firm, contact, app.email, "", app.id);

    if (app.status === "submitted" || app.status === "reviewed") {
      await updateApplicationStatusInStore(app.id, "approved");
    }

    return rowToMember(memberRow);
  });
