import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { EntrySource, Item, MealSlot } from '../domain/types';

/** Comida en revisión antes de guardarla. `entryId` cuando se está editando una entrada existente. */
export type Draft = {
  date: string;
  slot: MealSlot;
  name: string;
  items: Item[];
  source: EntrySource;
  steps?: string[];
  entryId?: string;
};

type DraftApi = {
  draft?: Draft;
  setDraft: (d: Draft) => void;
  clear: () => void;
  /** Último texto escrito en "Escribir", para no perderlo al volver desde revisión o tras un error. */
  text: string;
  setText: (t: string) => void;
};

const Ctx = createContext<DraftApi>({ setDraft: () => {}, clear: () => {}, text: '', setText: () => {} });

export function DraftProvider({ children, initialDraft }: { children: ReactNode; initialDraft?: Draft }) {
  const [draft, setDraftState] = useState<Draft | undefined>(initialDraft);
  const [text, setText] = useState('');
  const api = useMemo<DraftApi>(
    () => ({ draft, setDraft: setDraftState, clear: () => setDraftState(undefined), text, setText }),
    [draft, text],
  );
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useDraft(): DraftApi {
  return useContext(Ctx);
}
