import { ListSection } from '../../ui/List';
import { Field, NumberField } from '../../ui/Field';
import { SegmentedControl } from '../../ui/SegmentedControl';
import { ChoiceList } from '../../ui/ChoiceList';
import { ACTIVITY_LABEL } from '../../ui/labels';
import type { Activity, Goal, Profile } from '../../domain/types';

export type ProfileDraft = {
  sex?: Profile['sex'];
  birthDate: string;
  heightCm: number | null;
  weightKg: number | null;
  activity?: Activity;
  goal: Goal;
  rateKgPerWeek: Profile['rateKgPerWeek'];
};

export const emptyDraft: ProfileDraft = {
  birthDate: '', heightCm: null, weightKg: null, goal: 'lose', rateKgPerWeek: 0.5,
};

/** Devuelve el perfil y el peso si el borrador está completo y es plausible. */
export function draftToProfile(d: ProfileDraft): { profile: Profile; weightKg: number } | null {
  if (!d.sex || !d.activity || !/^\d{4}-\d{2}-\d{2}$/.test(d.birthDate)) return null;
  if (!d.heightCm || d.heightCm < 100 || d.heightCm > 250) return null;
  if (!d.weightKg || d.weightKg < 30 || d.weightKg > 350) return null;
  const year = Number(d.birthDate.slice(0, 4));
  const now = new Date().getFullYear();
  if (year < now - 100 || year > now - 12) return null;
  return {
    profile: { sex: d.sex, birthDate: d.birthDate, heightCm: d.heightCm, activity: d.activity, goal: d.goal, rateKgPerWeek: d.rateKgPerWeek },
    weightKg: d.weightKg,
  };
}

const ACTIVITIES = (Object.keys(ACTIVITY_LABEL) as Activity[]).map((a) => ({
  value: a, title: ACTIVITY_LABEL[a].title, detail: ACTIVITY_LABEL[a].detail,
}));

const RATES = [
  { value: '0.25', label: '0,25 kg' },
  { value: '0.5', label: '0,5 kg' },
  { value: '0.75', label: '0,75 kg' },
] as const;

/** Formulario de perfil. `showWeight` en falso oculta el peso (en Ajustes el peso se registra en Progreso). */
export function ProfileForm({ draft, onChange, showWeight = true }: {
  draft: ProfileDraft;
  onChange: (d: ProfileDraft) => void;
  showWeight?: boolean;
}) {
  const set = (patch: Partial<ProfileDraft>) => onChange({ ...draft, ...patch });
  return (
    <>
      <ListSection header="Sobre ti">
        <div className="inset">
          <SegmentedControl
            label="Sexo"
            value={draft.sex ?? ('' as Profile['sex'])}
            options={[{ value: 'male', label: 'Hombre' }, { value: 'female', label: 'Mujer' }]}
            onChange={(sex) => set({ sex })}
          />
        </div>
        <Field label="Nacimiento" type="date" value={draft.birthDate} onChange={(birthDate) => set({ birthDate })} />
        <NumberField
          label="Altura"
          unit="cm"
          placeholder="170"
          initial={draft.heightCm ?? undefined}
          onValueChange={(heightCm) => set({ heightCm })}
        />
        {showWeight && (
          <NumberField
            label="Peso"
            unit="kg"
            placeholder="70"
            initial={draft.weightKg ?? undefined}
            onValueChange={(weightKg) => set({ weightKg })}
          />
        )}
      </ListSection>

      <ListSection header="Actividad física">
        <ChoiceList label="Actividad física" value={draft.activity} options={ACTIVITIES} onChange={(activity) => set({ activity })} />
      </ListSection>

      <ListSection
        header="Objetivo"
        footer={draft.goal === 'maintain' ? 'Comes lo mismo que gastas.' : 'Un ritmo de 0,5 kg por semana es sostenible para la mayoría.'}
      >
        <div className="inset" style={{ display: 'grid', gap: 12 }}>
          <SegmentedControl
            label="Objetivo"
            value={draft.goal}
            options={[{ value: 'lose', label: 'Bajar' }, { value: 'maintain', label: 'Mantener' }, { value: 'gain', label: 'Subir' }]}
            onChange={(goal) => set({ goal })}
          />
          {draft.goal !== 'maintain' && (
            <div>
              <p className="t-footnote c-secondary" style={{ margin: '0 0 6px' }}>Ritmo por semana</p>
              <SegmentedControl
                label="Ritmo por semana"
                value={String(draft.rateKgPerWeek) as (typeof RATES)[number]['value']}
                options={[...RATES]}
                onChange={(v) => set({ rateKgPerWeek: Number(v) as Profile['rateKgPerWeek'] })}
              />
            </div>
          )}
        </div>
      </ListSection>
    </>
  );
}
