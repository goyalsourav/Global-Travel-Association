import { useMemo, useState } from "react";
import {
  BadgeCheck,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  Search,
  Trash2,
  UserPlus,
} from "lucide-react";
import {
  addMember,
  approveApplication,
  deleteMember,
  updateApplicationStatus,
  updateMember,
  type ApplicationData,
  type ApplicationRecord,
} from "@/lib/api";
import {
  APPLICATION_STATUS_CLS,
  APPLICATION_STATUSES,
  applicationStatusLabel,
  type ApplicationStatus,
  type Member,
} from "@/data/members";
import { ErrorNote, inputCls, labelCls, SectionHeading } from "./editors";

const chipCls = (active: boolean) =>
  `whitespace-nowrap rounded-full border px-4 py-2 text-xs uppercase tracking-wider min-h-9 transition-colors ${
    active
      ? "border-gold bg-gold/15 text-ink font-semibold"
      : "border-ink/15 bg-white text-charcoal hover:border-gold/60"
  }`;

const selectCls =
  "bg-white border border-ink/15 focus:border-gold outline-none rounded-sm px-3 py-2 text-sm text-ink min-h-11";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* ================= Applications ================= */

export function ApplicationsManager({
  password,
  applications,
  setApplications,
  members,
  setMembers,
}: {
  password: string;
  applications: ApplicationRecord[];
  setApplications: (a: ApplicationRecord[]) => void;
  members: Member[];
  setMembers: (m: Member[]) => void;
}) {
  const [filter, setFilter] = useState<"all" | ApplicationStatus>("all");
  const [openId, setOpenId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const memberEmails = useMemo(
    () => new Set(members.map((m) => m.email.toLowerCase()).filter(Boolean)),
    [members],
  );

  const counts = useMemo(() => {
    const c = new Map<string, number>();
    for (const a of applications) c.set(a.status, (c.get(a.status) ?? 0) + 1);
    return c;
  }, [applications]);

  const visible = filter === "all" ? applications : applications.filter((a) => a.status === filter);

  async function changeStatus(app: ApplicationRecord, status: ApplicationStatus) {
    setBusyId(app.id);
    setError(null);
    try {
      await updateApplicationStatus({ data: { password, id: app.id, status } });
      setApplications(applications.map((a) => (a.id === app.id ? { ...a, status } : a)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setBusyId(null);
    }
  }

  async function approve(app: ApplicationRecord) {
    setBusyId(app.id);
    setError(null);
    try {
      const member = await approveApplication({ data: { password, applicationId: app.id } });
      if (!members.some((m) => m.id === member.id)) setMembers([...members, member]);
      if (app.status === "submitted") {
        setApplications(
          applications.map((a) => (a.id === app.id ? { ...a, status: "reviewed" } : a)),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve application");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <SectionHeading
        title={`Membership Applications (${applications.length})`}
        note="Track each application from submission through payment to completion."
      />

      {/* Status filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        <button onClick={() => setFilter("all")} className={chipCls(filter === "all")}>
          All ({applications.length})
        </button>
        {APPLICATION_STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => setFilter(s.value)}
            className={chipCls(filter === s.value)}
          >
            {s.label} ({counts.get(s.value) ?? 0})
          </button>
        ))}
      </div>

      <ErrorNote error={error} />

      {visible.length === 0 && (
        <p className="text-sm text-charcoal py-8">
          {applications.length === 0 ? "No applications yet." : "No applications with this status."}
        </p>
      )}

      <ul className="space-y-3">
        {visible.map((app) => {
          const isMember = memberEmails.has(app.email.toLowerCase());
          const busy = busyId === app.id;
          return (
            <li key={app.id} className="bg-white border border-ink/10 rounded-sm">
              <div className="flex flex-wrap items-center gap-3 p-4">
                <button
                  onClick={() => setOpenId(openId === app.id ? null : app.id)}
                  className="flex items-center gap-3 flex-1 min-w-52 text-left"
                >
                  {openId === app.id ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-charcoal" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-charcoal" />
                  )}
                  <span className="min-w-0">
                    <span className="block font-medium text-ink truncate">
                      {app.name || app.email}
                    </span>
                    <span className="block text-xs text-charcoal/70 truncate">
                      {app.email} · {fmtDate(app.createdAt)}
                    </span>
                  </span>
                </button>

                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs uppercase tracking-wider ${APPLICATION_STATUS_CLS[app.status]}`}
                >
                  {applicationStatusLabel(app.status)}
                </span>

                <select
                  value={app.status}
                  disabled={busy}
                  onChange={(e) => void changeStatus(app, e.target.value as ApplicationStatus)}
                  className={selectCls}
                  aria-label="Change application status"
                >
                  {APPLICATION_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>

                {isMember ? (
                  <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-green-700 px-3 py-2">
                    <BadgeCheck className="h-4 w-4" /> Member
                  </span>
                ) : (
                  <button
                    onClick={() => void approve(app)}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 min-h-11 px-4 bg-ink text-white text-sm font-medium rounded-sm hover:bg-charcoal transition-colors disabled:opacity-60"
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    Approve as Member
                  </button>
                )}
              </div>
              {openId === app.id && <ApplicationDetail data={app.data} />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ================= Members ================= */

export function MembersManager({
  password,
  members,
  setMembers,
  applications,
}: {
  password: string;
  members: Member[];
  setMembers: (m: Member[]) => void;
  applications: ApplicationRecord[];
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "paid" | "pending">("all");
  const [showAdd, setShowAdd] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      if (paymentFilter !== "all" && m.paymentStatus !== paymentFilter) return false;
      if (!q) return true;
      return [m.name, m.firmName, m.email, m.contact].some((v) => v.toLowerCase().includes(q));
    });
  }, [members, query, statusFilter, paymentFilter]);

  function appsFor(member: Member): ApplicationRecord[] {
    const email = member.email.toLowerCase();
    return applications.filter(
      (a) => a.id === member.applicationId || (email && a.email.toLowerCase() === email),
    );
  }

  async function patch(member: Member, patchData: Parameters<typeof updateMember>[0]["data"]) {
    setBusyId(member.id);
    setError(null);
    try {
      const updated = await updateMember({ data: patchData });
      setMembers(members.map((m) => (m.id === member.id ? updated : m)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update member");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(member: Member) {
    if (!window.confirm(`Remove ${member.name} from members? This cannot be undone.`)) return;
    setBusyId(member.id);
    setError(null);
    try {
      await deleteMember({ data: { password, id: member.id } });
      setMembers(members.filter((m) => m.id !== member.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setBusyId(null);
    }
  }

  const activeCount = members.filter((m) => m.status === "active").length;
  const paidCount = members.filter((m) => m.paymentStatus === "paid").length;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeading
          title={`Members (${members.length})`}
          note={`${activeCount} active · ${paidCount} paid. Active members appear on the public Members page.`}
        />
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="inline-flex items-center gap-2 min-h-12 px-6 bg-gold text-ink font-medium rounded-sm hover:bg-gold-soft transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Member
        </button>
      </div>

      {showAdd && (
        <AddMemberForm
          password={password}
          onAdded={(m) => {
            setMembers([...members, m]);
            setShowAdd(false);
          }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {/* Filters */}
      <div className="mt-2 mb-6 space-y-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal/50" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, firm, email or phone…"
            className={`${inputCls} pl-10`}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="self-center text-xs uppercase tracking-wider text-charcoal/60 mr-1">
            Status
          </span>
          {(["all", "active", "inactive"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setStatusFilter(v)}
              className={chipCls(statusFilter === v)}
            >
              {v === "all" ? "All" : v}
            </button>
          ))}
          <span className="self-center text-xs uppercase tracking-wider text-charcoal/60 ml-3 mr-1">
            Payment
          </span>
          {(["all", "paid", "pending"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setPaymentFilter(v)}
              className={chipCls(paymentFilter === v)}
            >
              {v === "all" ? "All" : v}
            </button>
          ))}
        </div>
      </div>

      <ErrorNote error={error} />

      {visible.length === 0 && (
        <p className="text-sm text-charcoal py-8">
          {members.length === 0 ? "No members yet — add the first one." : "No members match."}
        </p>
      )}

      <ul className="space-y-3">
        {visible.map((m) => {
          const busy = busyId === m.id;
          const linkedApps = appsFor(m);
          return (
            <li key={m.id} className="bg-white border border-ink/10 rounded-sm">
              <div className="flex flex-wrap items-center gap-3 p-4">
                <div className="flex-1 min-w-52">
                  <div className="font-medium text-ink">{m.name}</div>
                  <div className="text-sm text-charcoal">{m.firmName || "—"}</div>
                  <div className="mt-0.5 text-xs text-charcoal/70 break-all">
                    {[m.contact, m.email].filter(Boolean).join(" · ") || "—"}
                  </div>
                </div>

                {/* Active / inactive */}
                <button
                  onClick={() =>
                    void patch(m, {
                      password,
                      id: m.id,
                      status: m.status === "active" ? "inactive" : "active",
                    })
                  }
                  disabled={busy}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs uppercase tracking-wider min-h-9 transition-colors disabled:opacity-60 ${
                    m.status === "active"
                      ? "border-green-600/40 bg-green-600/10 text-green-700"
                      : "border-ink/20 bg-ink/5 text-charcoal"
                  }`}
                  title="Toggle active / inactive"
                >
                  <span
                    className={`h-2 w-2 rounded-full ${m.status === "active" ? "bg-green-600" : "bg-charcoal/40"}`}
                  />
                  {m.status}
                </button>

                {/* Payment */}
                <select
                  value={m.paymentStatus}
                  disabled={busy}
                  onChange={(e) =>
                    void patch(m, {
                      password,
                      id: m.id,
                      paymentStatus: e.target.value as "paid" | "pending",
                    })
                  }
                  className={selectCls}
                  aria-label="Payment status"
                >
                  <option value="pending">Payment pending</option>
                  <option value="paid">Paid</option>
                </select>
                {m.paymentStatus === "paid" && m.paidAt && (
                  <span className="text-xs text-charcoal/60">paid {fmtDate(m.paidAt)}</span>
                )}

                {linkedApps.length > 0 && (
                  <button
                    onClick={() => setOpenId(openId === m.id ? null : m.id)}
                    className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-ink underline underline-offset-4 hover:text-gold min-h-11 px-2"
                  >
                    {openId === m.id ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                    Application{linkedApps.length > 1 ? `s (${linkedApps.length})` : ""}
                  </button>
                )}

                <button
                  onClick={() => void remove(m)}
                  disabled={busy}
                  aria-label={`Remove ${m.name}`}
                  className="grid h-11 w-11 place-items-center text-charcoal/60 hover:text-destructive disabled:opacity-50"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>

              {openId === m.id && (
                <div className="border-t border-ink/10">
                  {linkedApps.map((a) => (
                    <div key={a.id} className="border-b border-ink/5 last:border-0">
                      <div className="flex items-center gap-3 px-4 pt-3">
                        <span className="text-xs text-charcoal/70">
                          Application #{a.id} · {fmtDate(a.createdAt)}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-wider ${APPLICATION_STATUS_CLS[a.status]}`}
                        >
                          {applicationStatusLabel(a.status)}
                        </span>
                      </div>
                      <ApplicationDetail data={a.data} />
                    </div>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function AddMemberForm({
  password,
  onAdded,
  onCancel,
}: {
  password: string;
  onAdded: (m: Member) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [firmName, setFirmName] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter the member's name.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const member = await addMember({ data: { password, name, firmName, contact, email } });
      onAdded(member);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mb-6 bg-white border border-gold/40 rounded-sm p-5">
      <div className="text-xs uppercase tracking-[0.22em] text-gold mb-4">New Member</div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Firm Name</label>
          <input
            value={firmName}
            onChange={(e) => setFirmName(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Contact</label>
          <input
            value={contact}
            inputMode="numeric"
            onChange={(e) => setContact(e.target.value.replace(/[^\d\s+-]/g, ""))}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Email ID</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
          />
        </div>
      </div>
      <div className="mt-5 flex items-center gap-4">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 min-h-12 px-6 bg-ink text-white font-medium rounded-sm hover:bg-charcoal transition-colors disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Add Member
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-charcoal underline underline-offset-4 hover:text-gold"
        >
          Cancel
        </button>
      </div>
      <ErrorNote error={error} />
    </form>
  );
}

/* ================= Shared application detail ================= */

export function ApplicationDetail({ data }: { data: ApplicationData }) {
  const values = data.values ?? {};
  const files = data.files ?? {};

  return (
    <div className="p-4">
      <dl className="space-y-1.5">
        {Object.entries(values).map(([key, val]) => {
          const text = Array.isArray(val) ? val.join(", ") : String(val ?? "");
          if (!text) return null;
          return (
            <div key={key} className="flex flex-col sm:flex-row sm:gap-4 text-sm">
              <dt className="text-xs uppercase tracking-wider text-charcoal/60 sm:w-44 shrink-0 pt-0.5">
                {key.replace(/([A-Z])/g, " $1")}
              </dt>
              <dd className="text-ink break-words">{text}</dd>
            </div>
          );
        })}
      </dl>
      {Object.keys(files).length > 0 && (
        <div className="mt-4">
          <div className="text-xs uppercase tracking-[0.22em] text-gold mb-2">Documents</div>
          <ul className="flex flex-wrap gap-2">
            {Object.entries(files).map(([key, f]) =>
              f?.url ? (
                <li key={key}>
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 border border-ink/15 rounded-sm text-sm text-ink hover:border-gold"
                  >
                    {key.replace(/([A-Z])/g, " $1")}
                  </a>
                </li>
              ) : null,
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
