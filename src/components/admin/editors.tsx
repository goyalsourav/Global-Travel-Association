import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  GripVertical,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { createEvent, deleteEvent, reorderEvents, saveSiteContent, updateEvent } from "@/lib/api";
import { formatBytes, MAX_FILE_BYTES, uploadFile } from "@/lib/uploadFile";
import type {
  AboutContent,
  Bearer,
  ContactContent,
  GtaEvent,
  PaymentContent,
} from "@/data/siteContent";

export const inputCls =
  "w-full bg-white border border-ink/15 focus:border-gold outline-none rounded-sm px-4 py-3 text-ink transition-colors placeholder:text-charcoal/40";
export const labelCls = "block text-xs uppercase tracking-[0.22em] text-charcoal mb-2";

export function SectionHeading({ title, note }: { title: string; note: string }) {
  return (
    <div className="mb-8">
      <h2 className="font-serif text-3xl text-ink">{title}</h2>
      <p className="mt-1 text-sm text-charcoal">{note}</p>
    </div>
  );
}

function SaveButton({
  busy,
  saved,
  label = "Save changes",
}: {
  busy: boolean;
  saved: boolean;
  label?: string;
}) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="inline-flex items-center justify-center gap-2 min-h-12 px-8 bg-ink text-white font-medium rounded-sm hover:bg-charcoal transition-colors disabled:opacity-60"
    >
      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
      {saved && !busy && <Check className="h-4 w-4 text-gold" />}
      {busy ? "Saving…" : saved ? "Saved" : label}
    </button>
  );
}

function useSaver<T>(save: (value: T) => Promise<void>) {
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  async function run(value: T) {
    setBusy(true);
    setError(null);
    try {
      await save(value);
      setSaved(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  return { busy, saved, error, run };
}

export function ErrorNote({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p role="alert" className="mt-3 text-sm text-destructive">
      {error}
    </p>
  );
}

/* ---------- Image picker (admin uploads) ---------- */

function ImagePicker({
  label,
  value,
  onChange,
  aspect = "aspect-[4/5]",
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  aspect?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Only image files are accepted.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError(`This file is ${formatBytes(file.size)} — the limit is 10 MB.`);
      return;
    }
    setProgress(0);
    try {
      const meta = await uploadFile(file, "site", setProgress);
      onChange(meta.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed — try again.");
    } finally {
      setProgress(null);
    }
  }

  return (
    <div>
      <span className={labelCls}>{label}</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void handleFile(f);
        }}
      />
      <div
        className={`relative ${aspect} w-full max-w-52 bg-ink/5 rounded-sm overflow-hidden border border-ink/10`}
      >
        {value ? (
          <img src={value} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span className="absolute inset-0 grid place-items-center text-xs text-charcoal/50">
            No image
          </span>
        )}
        {progress !== null && (
          <span className="absolute inset-0 grid place-items-center bg-ink/70 text-white text-sm">
            {Math.round(progress)}%
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={progress !== null}
        className="mt-3 inline-flex items-center gap-2 min-h-11 px-4 border border-ink/20 text-ink text-sm font-medium rounded-sm hover:border-gold transition-colors disabled:opacity-60"
      >
        <Upload className="h-4 w-4" /> {value ? "Replace image" : "Upload image"}
      </button>
      <ErrorNote error={error} />
    </div>
  );
}

/* ---------- About ---------- */

export function AboutEditor({
  password,
  initial,
  onSaved,
}: {
  password: string;
  initial: AboutContent;
  onSaved: (v: AboutContent) => void;
}) {
  const [about, setAbout] = useState(initial);
  const saver = useSaver(async (v: AboutContent) => {
    await saveSiteContent({ data: { password, key: "about", value: v } });
    onSaved(v);
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void saver.run(about);
      }}
      className="space-y-6"
    >
      <SectionHeading
        title="About the Association"
        note="This copy appears in the “About the Association” section on the homepage."
      />
      <div>
        <label className={labelCls}>Introduction</label>
        <textarea
          rows={4}
          value={about.intro}
          onChange={(e) => setAbout({ ...about, intro: e.target.value })}
          className={`${inputCls} resize-none`}
        />
      </div>
      <div>
        <label className={labelCls}>Our Vision</label>
        <textarea
          rows={4}
          value={about.vision}
          onChange={(e) => setAbout({ ...about, vision: e.target.value })}
          className={`${inputCls} resize-none`}
        />
      </div>
      <div>
        <label className={labelCls}>Our Mission</label>
        <textarea
          rows={5}
          value={about.mission}
          onChange={(e) => setAbout({ ...about, mission: e.target.value })}
          className={`${inputCls} resize-none`}
        />
      </div>
      <SaveButton busy={saver.busy} saved={saver.saved} />
      <ErrorNote error={saver.error} />
    </form>
  );
}

/* ---------- Office bearers ---------- */

export function BearersEditor({
  password,
  initial,
  onSaved,
}: {
  password: string;
  initial: Bearer[];
  onSaved: (v: Bearer[]) => void;
}) {
  const [bearers, setBearers] = useState(initial);
  const saver = useSaver(async (v: Bearer[]) => {
    await saveSiteContent({ data: { password, key: "bearers", value: v } });
    onSaved(v);
  });

  function setBearer(i: number, patch: Partial<Bearer>) {
    setBearers((s) => s.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void saver.run(bearers);
      }}
      className="space-y-8"
    >
      <SectionHeading
        title="Office Bearers"
        note="The three leaders shown in the “Our Office Bearers” section on the homepage."
      />
      <div className="grid gap-8 md:grid-cols-3">
        {bearers.map((b, i) => (
          <div key={i} className="bg-white border border-ink/10 rounded-sm p-5 space-y-4">
            <ImagePicker
              label={`Photo — ${b.role}`}
              value={b.image}
              onChange={(url) => setBearer(i, { image: url })}
            />
            <div>
              <label className={labelCls}>Name</label>
              <input
                value={b.name}
                onChange={(e) => setBearer(i, { name: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Role</label>
              <input
                value={b.role}
                onChange={(e) => setBearer(i, { role: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>
        ))}
      </div>
      <SaveButton busy={saver.busy} saved={saver.saved} />
      <ErrorNote error={saver.error} />
    </form>
  );
}

/* ---------- Events ---------- */

export function EventsEditor({
  password,
  events,
  setEvents,
}: {
  password: string;
  events: GtaEvent[];
  setEvents: (e: GtaEvent[]) => void;
}) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  // Optimistically apply a new order, persist it, and roll back on failure.
  async function applyOrder(next: GtaEvent[]) {
    const previous = events;
    setEvents(next);
    setSavingOrder(true);
    setError(null);
    try {
      await reorderEvents({ data: { password, orderedIds: next.map((ev) => ev.id) } });
    } catch (err) {
      setEvents(previous);
      setError(err instanceof Error ? err.message : "Failed to save the new order");
    } finally {
      setSavingOrder(false);
    }
  }

  function moveEvent(from: number, to: number) {
    if (savingOrder) return;
    if (from === to || from < 0 || to < 0 || from >= events.length || to >= events.length) return;
    const next = [...events];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    void applyOrder(next);
  }

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setImageUrl("");
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a title.");
      return;
    }
    if (!imageUrl) {
      setError("Please upload an image for the event.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (editingId === null) {
        const created = await createEvent({ data: { password, title, description, imageUrl } });
        setEvents([...events, created]);
      } else {
        await updateEvent({ data: { password, id: editingId, title, description, imageUrl } });
        setEvents(
          events.map((ev) =>
            ev.id === editingId
              ? { ...ev, title: title.trim(), description: description.trim(), imageUrl }
              : ev,
          ),
        );
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save event");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    if (!window.confirm("Delete this event? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await deleteEvent({ data: { password, id } });
      setEvents(events.filter((ev) => ev.id !== id));
      if (editingId === id) resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-10">
      <form onSubmit={submit} className="bg-white border border-ink/10 rounded-sm p-6 space-y-5">
        <SectionHeading
          title={editingId === null ? "Create a GTA Event" : "Edit Event"}
          note="New events join the end of the grid — drag the list below to change the order shown on the site."
        />
        <div>
          <label className={labelCls}>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${inputCls} resize-none`}
          />
        </div>
        <ImagePicker
          label="Event image"
          value={imageUrl}
          onChange={setImageUrl}
          aspect="aspect-[16/10]"
        />
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 min-h-12 px-8 bg-ink text-white font-medium rounded-sm hover:bg-charcoal transition-colors disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {editingId === null ? "Create Event" : "Update Event"}
          </button>
          {editingId !== null && (
            <button
              type="button"
              onClick={resetForm}
              className="text-sm text-charcoal underline underline-offset-4 hover:text-gold"
            >
              Cancel editing
            </button>
          )}
        </div>
        <ErrorNote error={error} />
      </form>

      <div>
        <div className="flex items-baseline justify-between gap-4 mb-1">
          <h3 className="font-serif text-2xl text-ink">Published events ({events.length})</h3>
          {savingOrder && (
            <span className="inline-flex items-center gap-1.5 text-xs text-charcoal/70">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving order…
            </span>
          )}
        </div>
        <p className="text-sm text-charcoal mb-4">
          This is the order shown on the site — drag a row (or use the arrows) to rearrange.
        </p>
        {events.length === 0 && (
          <p className="text-sm text-charcoal">No events yet — create the first one above.</p>
        )}
        <ul className="space-y-3">
          {events.map((ev, i) => (
            <li
              key={ev.id}
              draggable={!savingOrder}
              onDragStart={(e) => {
                setDragIndex(i);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (overIndex !== i) setOverIndex(i);
              }}
              onDragLeave={() => {
                if (overIndex === i) setOverIndex(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIndex !== null) moveEvent(dragIndex, i);
                setDragIndex(null);
                setOverIndex(null);
              }}
              onDragEnd={() => {
                setDragIndex(null);
                setOverIndex(null);
              }}
              className={`flex items-center gap-3 bg-white border rounded-sm p-4 transition-colors ${
                overIndex === i && dragIndex !== null && dragIndex !== i
                  ? "border-gold bg-gold/5"
                  : "border-ink/10"
              } ${dragIndex === i ? "opacity-50" : ""}`}
            >
              <span
                className="hidden sm:grid h-11 w-8 place-items-center text-charcoal/40 cursor-grab active:cursor-grabbing shrink-0"
                title="Drag to reorder"
              >
                <GripVertical className="h-5 w-5" />
              </span>
              <span className="w-6 shrink-0 text-center text-xs text-charcoal/50 font-mono">
                {i + 1}
              </span>
              <img
                src={ev.imageUrl}
                alt=""
                className="h-16 w-24 shrink-0 object-cover rounded-sm border border-ink/10"
              />
              <div className="min-w-0 flex-1">
                <div className="font-medium text-ink truncate">{ev.title}</div>
                <div className="text-xs text-charcoal/70 truncate">{ev.description}</div>
                <div className="mt-0.5 text-xs text-charcoal/50">
                  {new Date(ev.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>
              <span className="flex flex-col shrink-0">
                <button
                  onClick={() => moveEvent(i, i - 1)}
                  disabled={i === 0 || savingOrder}
                  aria-label={`Move ${ev.title} up`}
                  className="grid h-8 w-9 place-items-center text-charcoal/60 hover:text-gold disabled:opacity-25"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => moveEvent(i, i + 1)}
                  disabled={i === events.length - 1 || savingOrder}
                  aria-label={`Move ${ev.title} down`}
                  className="grid h-8 w-9 place-items-center text-charcoal/60 hover:text-gold disabled:opacity-25"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              </span>
              <button
                onClick={() => {
                  setEditingId(ev.id);
                  setTitle(ev.title);
                  setDescription(ev.description);
                  setImageUrl(ev.imageUrl);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="text-xs uppercase tracking-wider text-ink underline underline-offset-4 hover:text-gold min-h-11 px-2"
              >
                Edit
              </button>
              <button
                onClick={() => void remove(ev.id)}
                disabled={deletingId === ev.id}
                aria-label={`Delete ${ev.title}`}
                className="grid h-11 w-11 place-items-center text-charcoal hover:text-destructive disabled:opacity-50"
              >
                {deletingId === ev.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ---------- Contact ---------- */

export function ContactEditor({
  password,
  initial,
  onSaved,
}: {
  password: string;
  initial: ContactContent;
  onSaved: (v: ContactContent) => void;
}) {
  const [contact, setContact] = useState(initial);
  const saver = useSaver(async (v: ContactContent) => {
    await saveSiteContent({ data: { password, key: "contact", value: v } });
    onSaved(v);
  });

  const fields: { key: keyof ContactContent; label: string; type?: string }[] = [
    { key: "email", label: "Email", type: "email" },
    { key: "phone", label: "Phone" },
    { key: "address", label: "Address" },
    { key: "website", label: "Website URL" },
    { key: "instagram", label: "Instagram URL" },
  ];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void saver.run(contact);
      }}
      className="space-y-6"
    >
      <SectionHeading
        title="Contact Options"
        note="Shown in the Contact section on the homepage."
      />
      {fields.map((f) => (
        <div key={f.key}>
          <label className={labelCls}>{f.label}</label>
          <input
            type={f.type ?? "text"}
            value={contact[f.key]}
            onChange={(e) => setContact({ ...contact, [f.key]: e.target.value })}
            className={inputCls}
          />
        </div>
      ))}
      <SaveButton busy={saver.busy} saved={saver.saved} />
      <ErrorNote error={saver.error} />
    </form>
  );
}

/* ---------- Payment ---------- */

export function PaymentEditor({
  password,
  initial,
  onSaved,
}: {
  password: string;
  initial: PaymentContent;
  onSaved: (v: PaymentContent) => void;
}) {
  const [payment, setPayment] = useState(initial);
  const saver = useSaver(async (v: PaymentContent) => {
    await saveSiteContent({ data: { password, key: "payment", value: v } });
    onSaved(v);
  });

  const fields: { key: keyof PaymentContent; label: string; placeholder?: string }[] = [
    { key: "upiId", label: "UPI ID", placeholder: "e.g. gta@upi" },
    { key: "accountName", label: "Account Name" },
    { key: "accountNumber", label: "Account Number" },
    { key: "ifsc", label: "IFSC Code" },
    { key: "bankName", label: "Bank Name" },
    { key: "branch", label: "Branch" },
  ];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void saver.run(payment);
      }}
      className="space-y-6"
    >
      <SectionHeading
        title="Membership Payment"
        note="The UPI QR and bank details shown on the homepage and at the end of the membership application."
      />
      <ImagePicker
        label="UPI QR Code image"
        value={payment.qrImage}
        onChange={(url) => setPayment({ ...payment, qrImage: url })}
        aspect="aspect-square"
      />
      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.key}>
            <label className={labelCls}>{f.label}</label>
            <input
              value={payment[f.key]}
              placeholder={f.placeholder}
              onChange={(e) => setPayment({ ...payment, [f.key]: e.target.value })}
              className={inputCls}
            />
          </div>
        ))}
      </div>
      <SaveButton busy={saver.busy} saved={saver.saved} />
      <ErrorNote error={saver.error} />
    </form>
  );
}

// (Applications and Members management live in membersAdmin.tsx.)
