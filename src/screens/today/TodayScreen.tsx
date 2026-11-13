import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { listEntries } from '../../db/repo';
import { sumMacros, ZERO } from '../../domain/macros';
import { addDays, dayTitle, longDate, todayLocal } from '../../domain/dates';
import { MEAL_SLOTS, type LogEntry } from '../../domain/types';
import { useTargets } from '../../state/useTargets';
import { Screen } from '../../ui/Screen';
import { BarButton } from '../../ui/Button';
import { ListRow, ListSection } from '../../ui/List';
import { fmtG, fmtKcal, SLOT_LABEL } from '../../ui/labels';
import { DaySummary } from './DaySummary';
import { EntrySheet } from './EntrySheet';
import { BackupReminder } from './BackupReminder';

/** Fecha activa desde ?d=, nunca en el futuro. */
export function useActiveDate(): [string, (d: string) => void] {
  const [params, setParams] = useSearchParams();
  const today = todayLocal();
  const raw = params.get('d');
  const date = raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) && raw <= today ? raw : today;
  const setDate = (d: string) => setParams(d === today ? {} : { d }, { replace: true });
  return [date, setDate];
}

export default function TodayScreen() {
  const navigate = useNavigate();
  const [date, setDate] = useActiveDate();
  const today = todayLocal();
  const targets = useTargets();
  const entries = useLiveQuery(() => listEntries(date), [date]);
  const [open, setOpen] = useState<LogEntry | null>(null);

  const all = entries ?? [];
  const eaten = all.length ? sumMacros(all.flatMap((e) => e.items.map((i) => i.macros))) : ZERO;

  return (
    <Screen
      title={dayTitle(date)}
      subtitle={longDate(date)}
      leading={
        <BarButton aria-label="Día anterior" onClick={() => setDate(addDays(date, -1))}>
          <ChevronLeft size={24} strokeWidth={2.2} aria-hidden="true" />
        </BarButton>
      }
      trailing={
        <BarButton aria-label="Día siguiente" disabled={date >= today} onClick={() => setDate(addDays(date, 1))}>
          <ChevronRight size={24} strokeWidth={2.2} aria-hidden="true" />
        </BarButton>
      }
    >
      {date === today && <BackupReminder />}
      {targets && <DaySummary eaten={eaten} target={targets} />}

      {MEAL_SLOTS.map((slot) => {
        const list = all.filter((e) => e.slot === slot);
        const subtotal = sumMacros(list.flatMap((e) => e.items.map((i) => i.macros)));
        return (
          <ListSection
            key={slot}
            header={
              <span className="meal-header">
                <span>{SLOT_LABEL[slot]}</span>
                {list.length > 0 && <span className="meal-header__kcal">{fmtKcal(subtotal.kcal)} kcal</span>}
              </span>
            }
          >
            {list.map((e) => {
              const m = sumMacros(e.items.map((i) => i.macros));
              return (
                <ListRow
                  key={e.id}
                  title={e.name}
                  subtitle={`P ${fmtG(m.protein)} · C ${fmtG(m.carbs)} · G ${fmtG(m.fat)} g`}
                  detail={fmtKcal(m.kcal)}
                  onClick={() => setOpen(e)}
                />
              );
            })}
            <ListRow
              tone="action"
              leading={<Plus size={20} strokeWidth={2.4} />}
              title="Agregar"
              ariaLabel={`Agregar a ${SLOT_LABEL[slot]}`}
              onClick={() => navigate(`/agregar/${slot}${date === today ? '' : `?d=${date}`}`)}
            />
          </ListSection>
        );
      })}

      <EntrySheet entry={open} onClose={() => setOpen(null)} />
    </Screen>
  );
}
