import { useId, useState } from 'react';
import { useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronLeft } from 'lucide-react';
import { listEntries, saveMeal } from '../../db/repo';
import { remaining, sumMacros, ZERO } from '../../domain/macros';
import { todayLocal } from '../../domain/dates';
import { MEAL_SLOTS, type MealSlot } from '../../domain/types';
import { AiError, suggestMeals, type Suggestion } from '../../services/gemini';
import { useAi } from '../../state/useAi';
import { useDraft } from '../../state/DraftContext';
import { useTargets } from '../../state/useTargets';
import { Screen } from '../../ui/Screen';
import { BarButton, Button } from '../../ui/Button';
import { ListRow, ListSection } from '../../ui/List';
import { SegmentedControl } from '../../ui/SegmentedControl';
import { useToast } from '../../ui/Toast';
import { aiErrorMessage } from '../../ui/aiErrorMessage';
import { fmtG, fmtKcal } from '../../ui/labels';
import { macroLine } from './mealText';

const SHORT = { breakfast: 'Desayuno', lunch: 'Almuerzo', dinner: 'Cena', snacks: 'Colaciones' } as const;

function slotForNow(h = new Date().getHours()): MealSlot {
  if (h < 11) return 'breakfast';
  if (h < 16) return 'lunch';
  if (h < 18) return 'snacks';
  return 'dinner';
}

export default function SuggestScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const ai = useAi();
  const { setDraft } = useDraft();
  const today = todayLocal();
  const targets = useTargets();
  const entries = useLiveQuery(() => listEntries(today), [today]);
  const [slot, setSlot] = useState<MealSlot>(slotForNow());
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ideas, setIdeas] = useState<Suggestion[]>([]);
  const noteId = useId();

  const eaten = entries?.length ? sumMacros(entries.flatMap((e) => e.items.map((i) => i.macros))) : ZERO;
  const left = targets ? remaining(targets, eaten) : null;

  async function ask() {
    if (!ai.config || !left) return;
    setBusy(true);
    setError('');
    try {
      setIdeas(await suggestMeals(ai.config, { remaining: left, slot, ...(note.trim() ? { note: note.trim() } : {}) }));
    } catch (e) {
      setError(aiErrorMessage(e instanceof AiError ? e.kind : 'unknown'));
    }
    setBusy(false);
  }

  function logIt(s: Suggestion) {
    setDraft({ date: today, slot, name: s.name, items: s.items, source: 'suggestion', steps: s.steps });
    navigate('/revision');
  }

  async function keep(s: Suggestion) {
    await saveMeal({ name: s.name, items: s.items, steps: s.steps });
    toast.show('Guardado en Mis comidas');
  }

  return (
    <Screen
      title="Ideas para comer"
      large={false}
      tabbar={false}
      leading={
        <BarButton onClick={() => navigate('/comidas')}>
          <ChevronLeft size={24} strokeWidth={2.2} aria-hidden="true" /> Comidas
        </BarButton>
      }
    >
      <div style={{ height: 16 }} />
      {left && (
        <p className="t-subhead c-secondary" style={{ margin: '0 16px 16px' }}>
          Te quedan hoy {fmtKcal(Math.max(0, left.kcal))} kcal · P {fmtG(Math.max(0, left.protein))} · C {fmtG(Math.max(0, left.carbs))} · G {fmtG(Math.max(0, left.fat))} g
        </p>
      )}

      {!ai.ready && !ai.loading ? (
        <p className="t-subhead c-secondary" style={{ margin: '0 16px' }}>
          Para pedir ideas, agrega tu key de Gemini en Ajustes.
        </p>
      ) : (
        <>
          <ListSection header="Para">
            <div className="inset">
              <SegmentedControl label="Comida" value={slot} options={MEAL_SLOTS.map((s) => ({ value: s, label: SHORT[s] }))} onChange={setSlot} />
            </div>
            <label htmlFor={noteId} className="visually-hidden">Preferencias (opcional)</label>
            <textarea
              id={noteId}
              className="textarea"
              rows={2}
              style={{ minHeight: 64 }}
              placeholder="Preferencias (opcional): tengo pollo y arroz, sin lactosa…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </ListSection>
          {error && <p role="alert" className="t-subhead c-danger" style={{ margin: '-16px 16px 16px' }}>{error}</p>}
          <Button size="large" onClick={ask} loading={busy} disabled={!left}>Pedir ideas</Button>
          <div style={{ height: 28 }} />
        </>
      )}

      {ideas.map((s, n) => (
        <ListSection key={`${n}-${s.name}`} header={s.name} footer={macroLine(s.items)}>
          {s.items.map((it, i) => (
            <ListRow key={i} title={it.name} detail={`${Math.round(it.grams)} g`} />
          ))}
          {s.steps.length > 0 && <ol className="steps">{s.steps.map((st, i) => <li key={i}>{st}</li>)}</ol>}
          <div className="inset" style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="tinted" onClick={() => keep(s)}>Guardar</Button>
            <Button onClick={() => logIt(s)}>Anotar</Button>
          </div>
        </ListSection>
      ))}
    </Screen>
  );
}
