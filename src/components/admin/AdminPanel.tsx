import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, Lock, LogOut } from "lucide-react";
import {
  adminGetMembers,
  adminVerify,
  getApplications,
  getEvents,
  getSiteContent,
  type ApplicationRecord,
} from "@/lib/api";
import type { GtaEvent, SiteContent } from "@/data/siteContent";
import type { Member } from "@/data/members";
import { AboutEditor, BearersEditor, ContactEditor, EventsEditor } from "./editors";
import { ApplicationsManager, MembersManager } from "./membersAdmin";

const AUTH_KEY = "gta-admin-auth";

const TABS = ["Applications", "Members", "Events", "About", "Office Bearers", "Contact"] as const;
type Tab = (typeof TABS)[number];

export function AdminPanel() {
  const [password, setPassword] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const stored = window.sessionStorage.getItem(AUTH_KEY);
    if (!stored) {
      setChecking(false);
      return;
    }
    adminVerify({ data: { password: stored } })
      .then(() => setPassword(stored))
      .catch(() => window.sessionStorage.removeItem(AUTH_KEY))
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-ink text-white grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }

  if (!password) {
    return (
      <PasswordGate
        onSuccess={(pw) => {
          window.sessionStorage.setItem(AUTH_KEY, pw);
          setPassword(pw);
        }}
      />
    );
  }

  return (
    <Dashboard
      password={password}
      onLogout={() => {
        window.sessionStorage.removeItem(AUTH_KEY);
        setPassword(null);
      }}
    />
  );
}

function PasswordGate({ onSuccess }: { onSuccess: (pw: string) => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!value) return;
    setBusy(true);
    setError(null);
    try {
      await adminVerify({ data: { password: value } });
      onSuccess(value);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Incorrect password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink text-white flex items-center justify-center px-5">
      <form onSubmit={submit} className="w-full max-w-sm">
        <div className="flex items-center gap-3 text-gold">
          <Lock className="h-5 w-5" />
          <span className="text-xs uppercase tracking-[0.22em]">GTA Admin</span>
        </div>
        <h1 className="mt-3 font-serif text-3xl">Enter the admin password.</h1>
        <input
          type="password"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Password"
          className="mt-6 w-full bg-white/5 border border-white/15 focus:border-gold outline-none rounded-sm px-4 py-3 text-white placeholder:text-white/40 transition-colors"
        />
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-400">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy || !value}
          className="mt-5 w-full inline-flex items-center justify-center gap-2 min-h-12 bg-gold text-ink font-medium rounded-sm hover:bg-gold-soft transition-colors disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Unlock
        </button>
        <Link to="/" className="mt-6 block text-center text-sm text-white/50 hover:text-gold">
          ← Back to site
        </Link>
      </form>
    </div>
  );
}

function Dashboard({ password, onLogout }: { password: string; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("Applications");
  const [content, setContent] = useState<SiteContent | null>(null);
  const [events, setEvents] = useState<GtaEvent[] | null>(null);
  const [members, setMembers] = useState<Member[] | null>(null);
  const [applications, setApplications] = useState<ApplicationRecord[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getSiteContent(),
      getEvents(),
      adminGetMembers({ data: { password } }),
      getApplications({ data: { password } }),
    ])
      .then(([c, e, m, a]) => {
        setContent(c);
        setEvents(e);
        setMembers(m);
        setApplications(a);
      })
      .catch((err) =>
        setLoadError(err instanceof Error ? err.message : "Failed to load site content"),
      );
  }, [password]);

  return (
    <div className="min-h-screen bg-secondary">
      <header className="bg-ink text-white">
        <div className="container-page flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="GTA" className="h-9 w-auto object-contain" />
            <span className="text-xs uppercase tracking-[0.22em] text-gold">Admin Panel</span>
          </div>
          <div className="flex items-center gap-5">
            <Link to="/" className="text-sm text-white/70 hover:text-gold">
              View site
            </Link>
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-gold"
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        </div>
      </header>

      <nav className="bg-ink border-t border-white/10 sticky top-0 z-40">
        <div className="container-page flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`whitespace-nowrap px-4 py-3 text-sm border-b-2 transition-colors ${
                tab === t
                  ? "border-gold text-gold"
                  : "border-transparent text-white/60 hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </nav>

      <main className="container-page py-10 max-w-5xl">
        {loadError && (
          <p
            role="alert"
            className="mb-6 text-sm text-destructive bg-destructive/5 border border-destructive/30 rounded-sm p-4"
          >
            {loadError} — check that DATABASE_URL is configured.
          </p>
        )}
        {!content || !events || !members || !applications ? (
          <div className="flex items-center gap-2 text-charcoal py-16 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading content…
          </div>
        ) : (
          <>
            {tab === "Applications" && (
              <ApplicationsManager
                password={password}
                applications={applications}
                setApplications={setApplications}
                members={members}
                setMembers={setMembers}
              />
            )}
            {tab === "Members" && (
              <MembersManager
                password={password}
                members={members}
                setMembers={setMembers}
                applications={applications}
              />
            )}
            {tab === "About" && (
              <AboutEditor
                password={password}
                initial={content.about}
                onSaved={(about) => setContent({ ...content, about })}
              />
            )}
            {tab === "Office Bearers" && (
              <BearersEditor
                password={password}
                initial={content.bearers}
                onSaved={(bearers) => setContent({ ...content, bearers })}
              />
            )}
            {tab === "Events" && (
              <EventsEditor password={password} events={events} setEvents={setEvents} />
            )}
            {tab === "Contact" && (
              <ContactEditor
                password={password}
                initial={content.contact}
                onSaved={(contact) => setContent({ ...content, contact })}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
