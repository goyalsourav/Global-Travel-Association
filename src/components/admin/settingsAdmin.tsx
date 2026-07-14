import { useState } from "react";
import { Check, KeyRound, Loader2 } from "lucide-react";
import { changeAdminPassword } from "@/lib/api";
import { ErrorNote, inputCls, labelCls, SectionHeading } from "./editors";

export function SettingsManager({
  password,
  onPasswordChanged,
}: {
  password: string;
  onPasswordChanged: (pw: string) => void;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    setError(null);
    if (current !== password) {
      setError("The current password is incorrect.");
      return;
    }
    if (next.trim().length < 8) {
      setError("The new password must be at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      setError("The new passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      await changeAdminPassword({ data: { password, newPassword: next } });
      onPasswordChanged(next.trim());
      setCurrent("");
      setNext("");
      setConfirm("");
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <SectionHeading
        title="Settings"
        note="Change the password used to unlock this admin panel."
      />

      <form onSubmit={submit} className="max-w-md bg-white border border-ink/10 rounded-sm p-6">
        <div className="flex items-center gap-2 text-gold mb-5">
          <KeyRound className="h-4 w-4" />
          <span className="text-xs uppercase tracking-[0.22em]">Change Password</span>
        </div>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Current password</label>
            <input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              autoComplete="current-password"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>New password</label>
            <input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Confirm new password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              className={inputCls}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={busy || !current || !next || !confirm}
          className="mt-6 inline-flex items-center justify-center gap-2 min-h-12 px-8 bg-ink text-white font-medium rounded-sm hover:bg-charcoal transition-colors disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {saved && !busy && <Check className="h-4 w-4 text-gold" />}
          {busy ? "Saving…" : saved ? "Password changed" : "Change password"}
        </button>
        <ErrorNote error={error} />
        {saved && (
          <p className="mt-3 text-sm text-green-700">
            Password updated — use the new password the next time you log in.
          </p>
        )}
      </form>
    </div>
  );
}
