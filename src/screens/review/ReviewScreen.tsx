import { useId, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { addEntry, saveMeal, updateEntry } from '../../db/repo';
import { rescaleItem, sumMacros } from '../../domain/macros';
import { todayLocal } from '../../domain/dates';
import { MEAL_SLOTS, type Item } from '../../domain/types';
import { AiError, refineEstimate } from '../../services/gemini';
import { useDraft } from '../../state/DraftContext';
import { useAi } from '../../state/useAi';
import { Screen } from '../../ui/Screen';
import { BarButton } from '../../ui/Button';
import { ListRow, ListSection } from '../../ui/List';
import { Field } from '../../ui/Field';
import { SegmentedControl } from '../../ui/SegmentedControl';
import { SwitchRow } from '../../ui/Switch';
import { useToast } from '../../ui/Toast';
import { aiErrorMessage } from '../../ui/aiErrorMessage';
import { fmtG, fmtKcal, SLOT_LABEL } from '../../ui/labels';
import { ItemSheet } from './ItemSheet';
import { GramsInput } from './GramsInput';

const SHORT_SLOT = { breakfast: 'Desayuno', lunch: 'Almuerzo', dinner: 'Cena', snacks: 'Colaciones' } as const;

export default function ReviewScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const ai = useAi();
  const { draft, setDraft, clear, setText } = useDraft();
  const [editing, setEditing] = useState<number | null>(null);
  const [alsoSave, setAlsoSave] = useState(false);
  const [saving, setSaving] = useState(false);
  const [correction, setCorrection] = useState('');
  const [fixing, setFixing] = useState(false);
  const [fixError, setFixError] = useState('');
  const correctionId = useId();

  if (!draft) return <Navigate to="/" replace />;
  const d = draft;
  const total = sumMacros(d.items.map((i) => i.macros));
  const qs = d.date === todayLocal() ? '' : `?d=${d.date}`;
  const fromAi = d.source === 'text' || d.source === 'photo' || d.source === 'suggestion';

  const setItems = (items: Item[]) => setDraft({ ...d, items });

  async function fix() {
    if (!ai.config || !correction.trim()) return;
    setFixing(true);
    setFixError('');
    try {
      const items = await refineEstimate(ai.config, {
        items: d.items,
        correction: correction.trim(),
        ...(d.context?.photoB64 ? { photoB64: d.context.photoB64 } : {}),
        ...(d.context?.text ? { text: d.context.text } : {}),
      });
      setDraft({ ...d, items });
      setCorrection('');
      toast.show('Listo, corregido');
    } catch (e) {
      setFixError(aiErrorMessage(e instanceof AiError ? e.kind : 'unknown'));
    }
    setFixing(false);
  }

  async function save() {
    setSaving(true);
    const name = d.name.trim() || SLOT_LABEL[d.slot];
    if (d.entryId) {
      await updateEntry(d.entryId, { name, slot: d.slot, items: d.items, date: d.date });
    } else {
      await addEntry({ date: d.date, slot: d.slot, name, items: d.items, source: d.source });
    }
    if (alsoSave) await saveMeal({ name, items: d.items, ...(d.steps?.length ? { steps: d.steps } : {}) });
    toast.show(alsoSave ? 'Buena, guardado y agregado a Mis comidas' : 'Buena, guardado');
    if (d.source === 'text') setText('');
    clear();
    navigate(`/${qs}`, { replace: true });
  }

  return (
    <Screen
      title={d.entryId ? 'Editar' : 'Revisión'}
      large={false}
      tabbar={false}
      leading={<BarButton onClick={() => navigate(-1)}>Cancelar</BarButton>}
      trailing={<BarButton bold onClick={save} disabled={d.items.length === 0 || fixing || saving}>Guardar</BarButton>}
    >
      <div style={{ height: 16 }} />
      <ListSection>
        <Field label="Nombre" value={d.name} onChange={(name) => setDraft({ ...d, name })} />
        <div className="inset">
          <SegmentedControl
            label="Comida"
            value={d.slot}
            options={MEAL_SLOTS.map((s) => ({ value: s, label: SHORT_SLOT[s] }))}
            onChange={(slot) => setDraft({ ...d, slot })}
          />
        </div>
      </ListSection>

      <ListSection
        header="Ingredientes"
        footer={fromAi
          ? 'Es una estimación de la IA. Cambia los gramos acá mismo, o toca un ingrediente para editarlo entero.'
          : 'Cambia los gramos acá mismo, o toca un ingrediente para editarlo entero.'}
      >
        {d.items.map((it, i) => (
          <div key={i} className="row review-row">
            <button type="button" className="review-row__main" onClick={() => setEditing(i)}>
              <span className="row__text">
                <span className="row__title" style={{ display: 'block' }}>{it.name}</span>
                <span className="row__subtitle t-subhead" style={{ display: 'block' }}>
                  {fmtKcal(it.macros.kcal)} kcal · P {fmtG(it.macros.protein)} · C {fmtG(it.macros.carbs)} · G {fmtG(it.macros.fat)}
                </span>
              </span>
            </button>
            <GramsInput
              grams={it.grams}
              label={`Gramos de ${it.name}`}
              onChange={(g) => setItems(d.items.map((x, j) => (j === i ? rescaleItem(x, g) : x)))}
            />
          </div>
        ))}
        {d.items.length === 0 && <ListRow title={<span className="c-secondary">Sin ingredientes</span>} />}
      </ListSection>

      {ai.ready && fromAi && (
        <ListSection header="Corregir resultados" footer="Ej.: «faltó la mayonesa», «no tiene queso», «eran 2 marraquetas», «el arroz es integral».">
          <label htmlFor={correctionId} className="visually-hidden">¿Qué hay que corregir?</label>
          <textarea
            id={correctionId}
            className="textarea"
            rows={2}
            style={{ minHeight: 64 }}
            placeholder="¿Qué hay que corregir?"
            value={correction}
            onChange={(e) => setCorrection(e.target.value)}
          />
          <ListRow tone="action" title={fixing ? 'Corrigiendo…' : 'Corregir'} onClick={fix} disabled={!correction.trim() || fixing} />
        </ListSection>
      )}
      {fixError && <p role="alert" className="t-subhead c-danger" style={{ margin: '-20px 16px 24px' }}>{fixError}</p>}

      <ListSection header="Total">
        <ListRow
          title={<span className="t-headline">{fmtKcal(total.kcal)} kcal</span>}
          detail={`P ${fmtG(total.protein)} · C ${fmtG(total.carbs)} · G ${fmtG(total.fat)} g`}
        />
      </ListSection>

      {!d.entryId && (
        <ListSection>
          <SwitchRow label="Guardar también en Mis comidas" checked={alsoSave} onChange={setAlsoSave} />
        </ListSection>
      )}


      {editing !== null && d.items[editing] && (
        <ItemSheet
          item={d.items[editing]}
          onClose={() => setEditing(null)}
          onSave={(it) => { setItems(d.items.map((x, i) => (i === editing ? it : x))); setEditing(null); }}
          onRemove={() => { setItems(d.items.filter((_, i) => i !== editing)); setEditing(null); }}
        />
      )}
    </Screen>
  );
}
