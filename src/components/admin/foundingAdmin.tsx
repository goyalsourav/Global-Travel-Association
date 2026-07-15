import { useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { addFoundingMember, deleteFoundingMember, updateFoundingMember } from "@/lib/api";
import type { FoundingMember } from "@/data/siteContent";
import { ErrorNote, ImagePicker, inputCls, labelCls, SectionHeading } from "./editors";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function FoundingMembersManager({
  password,
  founders,
  setFounders,
}: {
  password: string;
  founders: FoundingMember[];
  setFounders: (f: FoundingMember[]) => void;
}) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setEditingId(null);
    setName("");
    setImageUrl("");
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a name.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (editingId === null) {
        const created = await addFoundingMember({ data: { password, name, imageUrl } });
        setFounders([...founders, created]);
      } else {
        const updated = await updateFoundingMember({
          data: { password, id: editingId, name, imageUrl },
        });
        setFounders(founders.map((f) => (f.id === editingId ? updated : f)));
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save founding member");
    } finally {
      setBusy(false);
    }
  }

  async function remove(f: FoundingMember) {
    if (!window.confirm(`Remove ${f.name} from founding members? This cannot be undone.`)) return;
    setDeletingId(f.id);
    setError(null);
    try {
      await deleteFoundingMember({ data: { password, id: f.id } });
      setFounders(founders.filter((x) => x.id !== f.id));
      if (editingId === f.id) resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove founding member");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-10">
      <form onSubmit={submit} className="bg-white border border-ink/10 rounded-sm p-6 space-y-5">
        <SectionHeading
          title={editingId === null ? "Add a Founding Member" : "Edit Founding Member"}
          note="Shown as rotating cards in the “Founding Members” section on the homepage."
        />
        <div className="max-w-md">
          <label className={labelCls}>Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </div>
        <ImagePicker
          password={password}
          label="Photo (optional)"
          value={imageUrl}
          onChange={setImageUrl}
          aspect="aspect-square"
        />
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 min-h-12 px-8 bg-ink text-white font-medium rounded-sm hover:bg-charcoal transition-colors disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {editingId === null ? "Add Founding Member" : "Save Changes"}
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
        <h3 className="font-serif text-2xl text-ink mb-4">Founding members ({founders.length})</h3>
        {founders.length === 0 && (
          <p className="text-sm text-charcoal">
            None yet — until you add some, the homepage keeps showing the original list of names.
          </p>
        )}
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {founders.map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-4 bg-white border border-ink/10 rounded-sm p-4"
            >
              {f.imageUrl ? (
                <img
                  src={f.imageUrl}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-full object-cover border border-gold/40"
                />
              ) : (
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-ink text-gold font-serif text-lg border border-gold/40">
                  {initials(f.name)}
                </span>
              )}
              <span className="flex-1 min-w-0 font-medium text-ink truncate">{f.name}</span>
              <button
                onClick={() => {
                  setEditingId(f.id);
                  setName(f.name);
                  setImageUrl(f.imageUrl);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                aria-label={`Edit ${f.name}`}
                className="grid h-11 w-11 place-items-center text-charcoal/60 hover:text-gold"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => void remove(f)}
                disabled={deletingId === f.id}
                aria-label={`Delete ${f.name}`}
                className="grid h-11 w-11 place-items-center text-charcoal/60 hover:text-destructive disabled:opacity-50"
              >
                {deletingId === f.id ? (
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
