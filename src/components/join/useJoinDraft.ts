// Draft persistence for the membership wizard: restores step, answers and
// uploaded-file metadata from localStorage on load, then autosaves (debounced)
// as the user types.
import { useCallback, useEffect, useRef, useState } from "react";
import {
  DRAFT_STORAGE_KEY,
  emptyValues,
  type JoinDraft,
  type JoinFiles,
  type JoinValues,
} from "./joinForm";

export function useJoinDraft() {
  const [values, setValues] = useState<JoinValues>(emptyValues);
  const [files, setFiles] = useState<JoinFiles>({});
  const [step, setStep] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // Restore once on the client (localStorage is unavailable during SSR).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as JoinDraft;
        setValues({ ...emptyValues, ...draft.values });
        setFiles(draft.files ?? {});
        setStep(Math.min(Math.max(draft.step ?? 0, 0), 3));
      }
    } catch {
      // Corrupt draft — start fresh.
    }
    setHydrated(true);
  }, []);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const indicatorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        const draft: JoinDraft = { step, values, files, updatedAt: Date.now() };
        window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
        setJustSaved(true);
        if (indicatorTimer.current) clearTimeout(indicatorTimer.current);
        indicatorTimer.current = setTimeout(() => setJustSaved(false), 2000);
      } catch {
        // Storage full/blocked — autosave is best-effort.
      }
    }, 600);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [values, files, step, hydrated]);

  useEffect(
    () => () => {
      if (indicatorTimer.current) clearTimeout(indicatorTimer.current);
    },
    [],
  );

  const clearDraft = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    try {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return { values, setValues, files, setFiles, step, setStep, hydrated, justSaved, clearDraft };
}
