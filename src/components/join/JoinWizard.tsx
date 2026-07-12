import { useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Loader2, Pencil } from "lucide-react";
import { submitApplication } from "@/lib/api";
import type { UploadedFileMeta } from "@/lib/uploadFile";
import { defaultPayment, type PaymentContent } from "@/data/siteContent";
import { PaymentPanel } from "@/components/site/PaymentPanel";
import { FileUploadField } from "./FileUploadField";
import { useJoinDraft } from "./useJoinDraft";
import {
  ASSOCIATION_OPTIONS,
  countWords,
  firstInvalidStep,
  REASON_WORD_LIMIT,
  STEP_NAMES,
  trimToWordLimit,
  validateStep,
  type FieldErrors,
  type FileFieldKey,
  type JoinValues,
} from "./joinForm";

const inputCls =
  "w-full bg-white border border-ink/15 focus:border-gold outline-none rounded-sm px-4 py-3 text-ink transition-colors placeholder:text-charcoal/40";
const inputErrCls = "border-destructive/60";
const labelCls = "block text-xs uppercase tracking-[0.22em] text-charcoal mb-2";

function digitsOnly(v: string, max: number) {
  return v.replace(/\D/g, "").slice(0, max);
}

export function JoinWizard({ payment = defaultPayment }: { payment?: PaymentContent }) {
  const { values, setValues, files, setFiles, step, setStep, hydrated, justSaved, clearDraft } =
    useJoinDraft();
  const [attempted, setAttempted] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  function set<K extends keyof JoinValues>(key: K, v: JoinValues[K]) {
    setValues((s) => ({ ...s, [key]: v }));
  }

  function setFile(key: FileFieldKey, meta: UploadedFileMeta | undefined) {
    setFiles((s) => {
      const next = { ...s };
      if (meta) next[key] = meta;
      else delete next[key];
      return next;
    });
  }

  const errors: FieldErrors = useMemo(
    () => (attempted.has(step) ? validateStep(step, values, files) : {}),
    [attempted, step, values, files],
  );

  function goTo(next: number) {
    setStep(next);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleNext() {
    const errs = validateStep(step, values, files);
    if (Object.keys(errs).length > 0) {
      setAttempted((s) => new Set(s).add(step));
      return;
    }
    goTo(step + 1);
  }

  async function handleSubmit() {
    const invalid = firstInvalidStep(values, files);
    if (invalid !== null) {
      setAttempted(new Set([0, 1, 2, 3]));
      if (invalid !== step) goTo(invalid);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitApplication({
        data: { email: values.email.trim(), name: values.name.trim(), data: { values, files } },
      });
      clearDraft();
      setSubmitted(true);
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      setSubmitError(
        err instanceof Error && err.message
          ? err.message
          : "Something went wrong while submitting — your answers are still saved on this device. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div ref={topRef} className="max-w-2xl mx-auto">
        <div className="bg-secondary p-8 md:p-12 border-l-2 border-gold">
          <div className="flex items-center gap-3 text-gold">
            <CheckCircle2 className="h-7 w-7" />
            <span className="text-xs uppercase tracking-[0.22em]">Application received</span>
          </div>
          <h2 className="mt-4 font-serif text-3xl md:text-4xl text-ink">
            Thank you{values.name.trim() ? `, ${values.name.trim().split(" ")[0]}` : ""}.
          </h2>
          <p className="mt-4 text-charcoal leading-relaxed">
            Your membership application has been recorded. One last step — complete your membership
            payment below. Our team will confirm your membership within 24–48 hours of receiving
            your application and payment.
          </p>
        </div>

        {/* Membership payment — the final step of the application */}
        <div className="mt-8">
          <PaymentPanel payment={payment} />
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-8 py-4 border border-ink/20 text-ink font-medium rounded-sm hover:border-gold transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const pct = Math.round(((step + 1) / STEP_NAMES.length) * 100);

  return (
    <div ref={topRef} className="max-w-2xl mx-auto scroll-mt-28">
      {/* Progress */}
      <div className="mb-10">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-[0.22em] text-gold">
              Step {step + 1} of {STEP_NAMES.length}
            </span>
            <h2 className="mt-1 font-serif text-2xl md:text-3xl text-ink">{STEP_NAMES[step]}</h2>
          </div>
          <span className="text-sm text-charcoal shrink-0">{pct}%</span>
        </div>
        <div className="mt-4 h-1.5 w-full bg-ink/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gold rounded-full transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {!hydrated ? (
        <div className="flex items-center gap-2 text-charcoal py-16 justify-center">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading your draft…
        </div>
      ) : (
        <form
          className="space-y-8 pb-8"
          onSubmit={(e) => {
            e.preventDefault();
            if (step < STEP_NAMES.length - 1) handleNext();
            else void handleSubmit();
          }}
        >
          {step === 0 && (
            <>
              <TextField
                id="email"
                label="Email"
                required
                type="email"
                inputMode="email"
                autoComplete="email"
                value={values.email}
                onChange={(v) => set("email", v)}
                error={errors.email}
              />
              <TextField
                id="name"
                label="Name"
                autoComplete="name"
                value={values.name}
                onChange={(v) => set("name", v)}
              />
              <TextField
                id="contactNumber"
                label="Contact Number"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="10-digit mobile number"
                value={values.contactNumber}
                onChange={(v) => set("contactNumber", digitsOnly(v, 10))}
                error={errors.contactNumber}
              />
              <TextField
                id="designation"
                label="Designation"
                placeholder="e.g. Proprietor, Director"
                value={values.designation}
                onChange={(v) => set("designation", v)}
              />
              <FileUploadField
                id="profilePicture"
                label="Profile Picture"
                required
                accept="image"
                hint="Image (JPG/PNG), up to 10 MB"
                value={files.profilePicture}
                onChange={(m) => setFile("profilePicture", m)}
                error={errors.profilePicture}
              />
              <TextField
                id="socialLinks"
                label="Social Media Links (if any)"
                placeholder="Instagram / Facebook / LinkedIn URLs"
                value={values.socialLinks}
                onChange={(v) => set("socialLinks", v)}
              />
            </>
          )}

          {step === 1 && (
            <>
              <TextField
                id="companyName"
                label="Company Name"
                autoComplete="organization"
                value={values.companyName}
                onChange={(v) => set("companyName", v)}
              />
              <TextAreaField
                id="officeAddress"
                label="Office Address"
                rows={3}
                value={values.officeAddress}
                onChange={(v) => set("officeAddress", v)}
              />
              <TextField
                id="businessEmail"
                label="Email ID (business)"
                type="email"
                inputMode="email"
                value={values.businessEmail}
                onChange={(v) => set("businessEmail", v)}
                error={errors.businessEmail}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-5">
                <TextField
                  id="establishmentYear"
                  label="Establishment Year"
                  inputMode="numeric"
                  placeholder={`1950–${new Date().getFullYear()}`}
                  value={values.establishmentYear}
                  onChange={(v) => set("establishmentYear", digitsOnly(v, 4))}
                  error={errors.establishmentYear}
                />
                <TextField
                  id="yearsExperience"
                  label="Years of Experience in Travel Industry"
                  inputMode="numeric"
                  value={values.yearsExperience}
                  onChange={(v) => set("yearsExperience", digitsOnly(v, 2))}
                  error={errors.yearsExperience}
                />
              </div>
              <TextAreaField
                id="expertise"
                label="Expertise / USP"
                rows={3}
                placeholder="What does your agency do best?"
                value={values.expertise}
                onChange={(v) => set("expertise", v)}
              />
              <TextField
                id="otherBusiness"
                label="Is there any other business you are running?"
                value={values.otherBusiness}
                onChange={(v) => set("otherBusiness", v)}
              />
              <YesNoField
                label="Current Account for Business"
                required
                value={values.currentAccount}
                onChange={(v) => set("currentAccount", v)}
                error={errors.currentAccount}
              />
            </>
          )}

          {step === 2 && (
            <>
              <FileUploadField
                id="aadhar"
                label="Aadhar Card"
                required
                accept="image"
                hint="Image (JPG/PNG), up to 10 MB"
                value={files.aadhar}
                onChange={(m) => setFile("aadhar", m)}
                error={errors.aadhar}
              />
              <FileUploadField
                id="workspacePhoto"
                label="Workspace Photo"
                accept="image"
                hint="Image (JPG/PNG), up to 10 MB"
                value={files.workspacePhoto}
                onChange={(m) => setFile("workspacePhoto", m)}
              />
              <FileUploadField
                id="gstCertificate"
                label="GST Certificate"
                accept="pdf"
                hint="PDF, up to 10 MB"
                value={files.gstCertificate}
                onChange={(m) => setFile("gstCertificate", m)}
              />
              <FileUploadField
                id="msmeLicense"
                label="MSME / Trade License / Gomasta"
                required
                accept="pdf"
                hint="PDF, up to 10 MB"
                value={files.msmeLicense}
                onChange={(m) => setFile("msmeLicense", m)}
                error={errors.msmeLicense}
              />
              <FileUploadField
                id="visitingCard"
                label="Visiting Card"
                required
                accept="imageOrPdf"
                hint="Image or PDF, up to 10 MB"
                value={files.visitingCard}
                onChange={(m) => setFile("visitingCard", m)}
                error={errors.visitingCard}
              />
            </>
          )}

          {step === 3 && (
            <>
              <AssociationsField
                selected={values.associations}
                otherValue={values.associationOther}
                onToggle={(opt) =>
                  set(
                    "associations",
                    values.associations.includes(opt)
                      ? values.associations.filter((a) => a !== opt)
                      : [...values.associations, opt],
                  )
                }
                onOtherChange={(v) => set("associationOther", v)}
                error={errors.associations}
                otherError={errors.associationOther}
              />

              <fieldset>
                <legend className={labelCls}>
                  Any 2 references and their contact details from GTA
                  <span className="text-gold"> *</span>
                </legend>
                <div className="space-y-6 border-l-2 border-gold/40 pl-4 sm:pl-6">
                  {([1, 2] as const).map((n) => (
                    <div key={n} className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-5">
                      <TextField
                        id={`ref${n}Name`}
                        label={`Reference ${n} — Name`}
                        value={values[`ref${n}Name`]}
                        onChange={(v) => set(`ref${n}Name`, v)}
                        error={errors[`ref${n}Name`]}
                      />
                      <TextField
                        id={`ref${n}Phone`}
                        label={`Reference ${n} — Phone`}
                        type="tel"
                        inputMode="numeric"
                        placeholder="10-digit number"
                        value={values[`ref${n}Phone`]}
                        onChange={(v) => set(`ref${n}Phone`, digitsOnly(v, 10))}
                        error={errors[`ref${n}Phone`]}
                      />
                    </div>
                  ))}
                </div>
              </fieldset>

              <ReasonField
                value={values.reason}
                onChange={(v) => set("reason", trimToWordLimit(v, REASON_WORD_LIMIT))}
                error={errors.reason}
              />

              <ReviewSummary values={values} files={files} onEdit={goTo} />

              {submitError && (
                <p
                  role="alert"
                  className="text-sm text-destructive bg-destructive/5 border border-destructive/30 rounded-sm p-4"
                >
                  {submitError}
                </p>
              )}
            </>
          )}

          {/* Sticky navigation */}
          <div className="sticky bottom-0 -mx-5 sm:mx-0 bg-background/95 backdrop-blur border-t border-ink/10 px-5 sm:px-0 py-4">
            <div className="flex items-center gap-3">
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => goTo(step - 1)}
                  className="inline-flex items-center justify-center gap-2 min-h-12 px-6 border border-ink/20 text-ink font-medium rounded-sm hover:border-gold transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
              )}
              <span
                aria-live="polite"
                className={`ml-auto mr-3 inline-flex items-center gap-1 text-xs text-charcoal/70 transition-opacity duration-300 ${
                  justSaved ? "opacity-100" : "opacity-0"
                }`}
              >
                <Check className="h-3.5 w-3.5 text-green-600" /> Draft saved
              </span>
              {step < STEP_NAMES.length - 1 ? (
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 min-h-12 px-8 bg-ink text-white font-medium rounded-sm hover:bg-charcoal transition-colors"
                >
                  Next <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 min-h-12 px-8 bg-gold text-ink font-medium rounded-sm hover:bg-gold-soft transition-colors disabled:opacity-60"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? "Submitting…" : "Submit Application"}
                </button>
              )}
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

/* ---------- Field primitives ---------- */

function TextField({
  id,
  label,
  value,
  onChange,
  error,
  required = false,
  type = "text",
  inputMode,
  placeholder,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
  type?: string;
  inputMode?: "email" | "tel" | "numeric" | "text";
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelCls}>
        {label}
        {required && <span className="text-gold"> *</span>}
      </label>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        className={`${inputCls} ${error ? inputErrCls : ""}`}
      />
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function TextAreaField({
  id,
  label,
  value,
  onChange,
  error,
  required = false,
  rows = 4,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelCls}>
        {label}
        {required && <span className="text-gold"> *</span>}
      </label>
      <textarea
        id={id}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        className={`${inputCls} resize-none ${error ? inputErrCls : ""}`}
      />
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function YesNoField({
  label,
  value,
  onChange,
  error,
  required = false,
}: {
  label: string;
  value: "" | "Yes" | "No";
  onChange: (v: "Yes" | "No") => void;
  error?: string;
  required?: boolean;
}) {
  return (
    <fieldset>
      <legend className={labelCls}>
        {label}
        {required && <span className="text-gold"> *</span>}
      </legend>
      <div className="flex gap-3">
        {(["Yes", "No"] as const).map((opt) => (
          <label
            key={opt}
            className={`flex-1 sm:flex-none sm:min-w-32 cursor-pointer rounded-sm border px-6 py-3 text-center min-h-12 flex items-center justify-center gap-2 transition-colors ${
              value === opt
                ? "border-gold bg-gold/10 text-ink font-medium"
                : "border-ink/15 bg-white text-charcoal hover:border-gold/60"
            }`}
          >
            <input
              type="radio"
              name="currentAccount"
              value={opt}
              checked={value === opt}
              onChange={() => onChange(opt)}
              className="sr-only"
            />
            {value === opt && <Check className="h-4 w-4 text-gold" />}
            {opt}
          </label>
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  );
}

function AssociationsField({
  selected,
  otherValue,
  onToggle,
  onOtherChange,
  error,
  otherError,
}: {
  selected: string[];
  otherValue: string;
  onToggle: (opt: string) => void;
  onOtherChange: (v: string) => void;
  error?: string;
  otherError?: string;
}) {
  return (
    <fieldset>
      <legend className={labelCls}>
        Other associations you are associated with, and your role
        <span className="text-gold"> *</span>
      </legend>
      <div className="flex flex-wrap gap-2.5">
        {ASSOCIATION_OPTIONS.map((opt) => {
          const on = selected.includes(opt);
          return (
            <label
              key={opt}
              className={`cursor-pointer rounded-sm border px-4 py-2.5 min-h-11 inline-flex items-center gap-2 text-sm transition-colors ${
                on
                  ? "border-gold bg-gold/10 text-ink font-medium"
                  : "border-ink/15 bg-white text-charcoal hover:border-gold/60"
              }`}
            >
              <input
                type="checkbox"
                checked={on}
                onChange={() => onToggle(opt)}
                className="sr-only"
              />
              {on && <Check className="h-3.5 w-3.5 text-gold" />}
              {opt}
            </label>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
      {selected.includes("Other") && (
        <div className="mt-4">
          <TextField
            id="associationOther"
            label="Other association & your role"
            placeholder="e.g. XYZ Association — Committee Member"
            value={otherValue}
            onChange={onOtherChange}
            error={otherError}
          />
        </div>
      )}
    </fieldset>
  );
}

function ReasonField({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const words = countWords(value);
  const atLimit = words >= REASON_WORD_LIMIT;
  return (
    <div>
      <label htmlFor="reason" className={labelCls}>
        Reason to join GTA<span className="text-gold"> *</span>
      </label>
      <textarea
        id="reason"
        rows={5}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        className={`${inputCls} resize-none ${error ? inputErrCls : ""}`}
        placeholder="What do you hope to give to — and gain from — the association?"
      />
      <div className="mt-1.5 flex justify-between gap-4">
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : (
          <span />
        )}
        <span className={`text-xs shrink-0 ${atLimit ? "text-destructive" : "text-charcoal/70"}`}>
          {words} / {REASON_WORD_LIMIT} words
        </span>
      </div>
    </div>
  );
}

/* ---------- Review summary ---------- */

function ReviewSummary({
  values,
  files,
  onEdit,
}: {
  values: JoinValues;
  files: Partial<Record<FileFieldKey, { name: string }>>;
  onEdit: (step: number) => void;
}) {
  const fileLabel = (key: FileFieldKey) => files[key]?.name ?? "—";
  const sections: { title: string; step: number; rows: [string, string][] }[] = [
    {
      title: "Personal Details",
      step: 0,
      rows: [
        ["Email", values.email || "—"],
        ["Name", values.name || "—"],
        ["Contact Number", values.contactNumber || "—"],
        ["Designation", values.designation || "—"],
        ["Profile Picture", fileLabel("profilePicture")],
        ["Social Media", values.socialLinks || "—"],
      ],
    },
    {
      title: "Business Details",
      step: 1,
      rows: [
        ["Company Name", values.companyName || "—"],
        ["Office Address", values.officeAddress || "—"],
        ["Business Email", values.businessEmail || "—"],
        ["Establishment Year", values.establishmentYear || "—"],
        ["Years of Experience", values.yearsExperience || "—"],
        ["Expertise / USP", values.expertise || "—"],
        ["Other Business", values.otherBusiness || "—"],
        ["Current Account", values.currentAccount || "—"],
      ],
    },
    {
      title: "Documents",
      step: 2,
      rows: [
        ["Aadhar Card", fileLabel("aadhar")],
        ["Workspace Photo", fileLabel("workspacePhoto")],
        ["GST Certificate", fileLabel("gstCertificate")],
        ["MSME / Trade License", fileLabel("msmeLicense")],
        ["Visiting Card", fileLabel("visitingCard")],
      ],
    },
    {
      title: "Association",
      step: 3,
      rows: [
        [
          "Associations",
          values.associations.length
            ? values.associations
                .map((a) => (a === "Other" ? `Other: ${values.associationOther || "—"}` : a))
                .join(", ")
            : "—",
        ],
        ["Reference 1", [values.ref1Name, values.ref1Phone].filter(Boolean).join(" · ") || "—"],
        ["Reference 2", [values.ref2Name, values.ref2Phone].filter(Boolean).join(" · ") || "—"],
        ["Reason to Join", values.reason || "—"],
      ],
    },
  ];

  return (
    <section className="border-t border-ink/10 pt-8">
      <h3 className="font-serif text-2xl text-ink">Review your application</h3>
      <p className="mt-1 text-sm text-charcoal">
        Check everything below before submitting — tap Edit to change a section.
      </p>
      <div className="mt-6 space-y-5">
        {sections.map((s) => (
          <div key={s.title} className="bg-white border border-ink/10 rounded-sm p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs uppercase tracking-[0.22em] text-gold">{s.title}</span>
              <button
                type="button"
                onClick={() => onEdit(s.step)}
                className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-ink underline underline-offset-4 hover:text-gold min-h-8"
              >
                <Pencil className="h-3 w-3" /> Edit
              </button>
            </div>
            <dl className="mt-3 space-y-2">
              {s.rows.map(([label, val]) => (
                <div key={label} className="flex flex-col sm:flex-row sm:gap-4">
                  <dt className="text-xs uppercase tracking-wider text-charcoal/70 sm:w-44 shrink-0 pt-0.5">
                    {label}
                  </dt>
                  <dd className="text-sm text-ink break-words">{val}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}
