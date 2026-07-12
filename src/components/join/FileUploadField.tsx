import { useEffect, useRef, useState } from "react";
import { CheckCircle2, FileText, Loader2, UploadCloud, X } from "lucide-react";
import { formatBytes, MAX_FILE_BYTES, uploadFile, type UploadedFileMeta } from "@/lib/uploadFile";

type AcceptKind = "image" | "pdf" | "imageOrPdf";

const ACCEPT_ATTR: Record<AcceptKind, string> = {
  image: "image/*",
  pdf: "application/pdf,.pdf",
  imageOrPdf: "image/*,application/pdf,.pdf",
};

function typeAllowed(kind: AcceptKind, file: File): boolean {
  const isImage = file.type.startsWith("image/");
  const isPdf = file.type === "application/pdf";
  if (kind === "image") return isImage;
  if (kind === "pdf") return isPdf;
  return isImage || isPdf;
}

const TYPE_MESSAGE: Record<AcceptKind, string> = {
  image: "Only image files (JPG, PNG…) are accepted here.",
  pdf: "Only PDF files are accepted here.",
  imageOrPdf: "Only image or PDF files are accepted here.",
};

export function FileUploadField({
  id,
  label,
  hint,
  accept,
  required = false,
  value,
  onChange,
  error,
}: {
  id: string;
  label: string;
  hint: string;
  accept: AcceptKind;
  required?: boolean;
  value: UploadedFileMeta | undefined;
  onChange: (meta: UploadedFileMeta | undefined) => void;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function handleFile(file: File) {
    setLocalError(null);
    if (!typeAllowed(accept, file)) {
      setLocalError(TYPE_MESSAGE[accept]);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setLocalError(`This file is ${formatBytes(file.size)} — the limit is 10 MB.`);
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setProgress(0);
    try {
      const meta = await uploadFile(file, "applications", setProgress, controller.signal);
      onChange(meta);
    } catch (err) {
      if (!controller.signal.aborted) {
        setLocalError(
          err instanceof Error && err.message
            ? `Upload failed: ${err.message}`
            : "Upload failed — please check your connection and try again.",
        );
      }
    } finally {
      setProgress(null);
      abortRef.current = null;
    }
  }

  function openPicker() {
    inputRef.current?.click();
  }

  const shownError = localError ?? error;
  const uploading = progress !== null;
  const isImage = value?.type.startsWith("image/");

  return (
    <div>
      <span className="block text-xs uppercase tracking-[0.22em] text-charcoal mb-2">
        {label}
        {required && <span className="text-gold"> *</span>}
      </span>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={ACCEPT_ATTR[accept]}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void handleFile(file);
        }}
      />

      {!value && !uploading && (
        <button
          type="button"
          onClick={openPicker}
          className={`w-full min-h-28 flex flex-col items-center justify-center gap-2 border border-dashed rounded-sm px-4 py-6 text-center transition-colors hover:border-gold hover:bg-secondary ${
            shownError ? "border-destructive/60 bg-destructive/5" : "border-ink/25 bg-white"
          }`}
        >
          <UploadCloud className="h-6 w-6 text-gold" />
          <span className="text-sm font-medium text-ink">Tap to upload</span>
          <span className="text-xs text-charcoal/70">{hint}</span>
        </button>
      )}

      {uploading && (
        <div className="w-full min-h-28 flex flex-col justify-center gap-3 border border-ink/15 rounded-sm px-5 py-6 bg-white">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm text-ink">
              <Loader2 className="h-4 w-4 animate-spin text-gold" />
              Uploading… {Math.round(progress ?? 0)}%
            </span>
            <button
              type="button"
              onClick={() => abortRef.current?.abort()}
              className="inline-flex items-center gap-1 text-xs uppercase tracking-wider text-charcoal hover:text-destructive min-h-11 px-2"
            >
              <X className="h-4 w-4" /> Cancel
            </button>
          </div>
          <div className="h-1.5 w-full bg-ink/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gold transition-[width] duration-200"
              style={{ width: `${progress ?? 0}%` }}
            />
          </div>
        </div>
      )}

      {value && !uploading && (
        <div className="w-full flex items-center gap-4 border border-ink/15 rounded-sm p-4 bg-white">
          {isImage ? (
            <img
              src={value.url}
              alt={value.name}
              className="h-14 w-14 shrink-0 object-cover rounded-sm border border-ink/10"
            />
          ) : (
            <span className="grid h-14 w-14 shrink-0 place-items-center bg-secondary rounded-sm">
              <FileText className="h-7 w-7 text-charcoal" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 text-sm font-medium text-ink">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
              <span className="truncate">{value.name}</span>
            </span>
            <span className="mt-0.5 block text-xs text-charcoal/70">{formatBytes(value.size)}</span>
            <span className="mt-2 flex gap-4">
              <button
                type="button"
                onClick={openPicker}
                className="text-xs uppercase tracking-wider text-ink underline underline-offset-4 hover:text-gold min-h-6"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => {
                  setLocalError(null);
                  onChange(undefined);
                }}
                className="text-xs uppercase tracking-wider text-charcoal hover:text-destructive min-h-6"
              >
                Remove
              </button>
            </span>
          </div>
        </div>
      )}

      {shownError && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {shownError}
        </p>
      )}
    </div>
  );
}
