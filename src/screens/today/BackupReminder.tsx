import { useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { firstEntryDate, getSettings, patchSettings } from '../../db/repo';
import { Button } from '../../ui/Button';

const DAY = 86_400_000;

export function shouldRemind({ lastExportAt, reminderDismissedAt, firstEntryDate: first, now }: {
  lastExportAt?: number;
  reminderDismissedAt?: number;
  firstEntryDate?: string;
  now: number;
}): boolean {
  const since = lastExportAt ?? (first ? new Date(`${first}T12:00:00`).getTime() : undefined);
  if (since === undefined || now - since <= 30 * DAY) return false;
  if (reminderDismissedAt && now - reminderDismissedAt < 7 * DAY) return false;
  return true;
}

/** Aviso en Hoy cuando pasan 30 días sin respaldar. */
export function BackupReminder() {
  const navigate = useNavigate();
  const due = useLiveQuery(async () => {
    const [s, first] = await Promise.all([getSettings(), firstEntryDate()]);
    return shouldRemind({ ...s, firstEntryDate: first, now: Date.now() });
  }, []);
  if (!due) return null;
  return (
    <section className="group" aria-label="Respaldo pendiente">
      <div className="group__body notice">
        <p className="t-headline">Hace tiempo que no respaldas</p>
        <p className="t-subhead c-secondary" style={{ margin: '2px 0 10px' }}>Tus datos viven solo en este teléfono. Exporta un respaldo por si acaso.</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button onClick={() => navigate('/ajustes')}>Respaldar</Button>
          <Button variant="plain" onClick={() => void patchSettings({ reminderDismissedAt: Date.now() })}>Ahora no</Button>
        </div>
      </div>
    </section>
  );
}
