import { useId, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Download, Upload } from 'lucide-react';
import { getSettings } from '../../db/repo';
import { backupFileName, BackupError, exportBackup, importBackup, parseBackup, summarize, type BackupErrorKind, type BackupFile } from '../../db/backup';
import { shareOrDownload } from '../../lib/share';
import { dayTitle, longDate, toLocalDate } from '../../domain/dates';
import { ListRow, ListSection } from '../../ui/List';
import { Sheet } from '../../ui/Sheet';
import { useToast } from '../../ui/Toast';

const ERRORS: Record<BackupErrorKind, string> = {
  'not-json': 'Ese archivo no es un respaldo de Comidia.',
  'wrong-app': 'Ese archivo no es de Comidia.',
  'newer-version': 'Este respaldo viene de una versión más nueva de Comidia. Recarga la app y prueba de nuevo.',
  invalid: 'El archivo está dañado o incompleto.',
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function BackupSettings() {
  const toast = useToast();
  const settings = useLiveQuery(() => getSettings(), []);
  const [pending, setPending] = useState<BackupFile | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const inputId = useId();

  async function doExport() {
    setBusy(true);
    try {
      const b = await exportBackup();
      const file = new File([JSON.stringify(b)], backupFileName(new Date()), { type: 'application/json' });
      const r = await shareOrDownload(file);
      if (r !== 'cancelled') toast.show('Respaldo listo');
    } finally {
      setBusy(false);
    }
  }

  async function pick(file: File) {
    setError('');
    try {
      setPending(parseBackup(await file.text()));
    } catch (e) {
      setError(e instanceof BackupError ? ERRORS[e.kind] : ERRORS.invalid);
    }
  }

  async function confirmImport() {
    if (!pending) return;
    await importBackup(pending);
    setPending(null);
    toast.show('Respaldo importado');
  }

  const last = settings?.lastExportAt;
  const s = pending ? summarize(pending) : null;

  return (
    <>
      <ListSection
        header="Respaldo"
        footer={`Último respaldo: ${last ? dayTitle(toLocalDate(new Date(last))).toLowerCase() : 'nunca'}. Guarda el archivo en Archivos o iCloud; tu key de Gemini no se incluye.`}
      >
        <ListRow tone="action" leading={<Upload size={20} strokeWidth={2} />} title="Exportar respaldo" onClick={doExport} disabled={busy} />
        <label htmlFor={inputId} className="row row--action" style={{ cursor: 'pointer' }}>
          <span className="row__leading" aria-hidden="true"><Download size={20} strokeWidth={2} /></span>
          <span className="row__text">Importar respaldo</span>
          <input
            id={inputId}
            className="visually-hidden"
            type="file"
            accept="application/json,.json"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void pick(f);
              e.target.value = '';
            }}
          />
        </label>
      </ListSection>
      {error && <p role="alert" className="t-subhead c-danger" style={{ margin: '-20px 16px 24px' }}>{error}</p>}

      {pending && s && (
        <Sheet open title="Importar respaldo" onClose={() => setPending(null)} doneLabel="Reemplazar" onDone={confirmImport}>
          <ListSection footer="Esto reemplaza todos tus datos actuales y no se puede deshacer.">
            <ListRow title="Exportado" detail={longDate(toLocalDate(new Date(s.exportedAt)))} />
            <ListRow title={plural(s.entries, 'comida anotada', 'comidas anotadas')} detail={s.firstDate && s.lastDate ? `${s.firstDate} a ${s.lastDate}` : undefined} />
            <ListRow title={plural(s.weights, 'registro de peso', 'registros de peso')} />
            <ListRow title={plural(s.savedMeals, 'comida guardada', 'comidas guardadas')} />
            <ListRow title={plural(s.foods, 'producto propio', 'productos propios')} />
          </ListSection>
        </Sheet>
      )}
    </>
  );
}
