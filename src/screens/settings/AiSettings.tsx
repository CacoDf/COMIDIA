import { useEffect, useId, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getSettings, patchSettings } from '../../db/repo';
import { AiError, listModels, pickDefaultModel, testKey } from '../../services/gemini';
import { ListRow, ListSection } from '../../ui/List';
import { Field } from '../../ui/Field';
import { Button } from '../../ui/Button';
import { useToast } from '../../ui/Toast';
import { aiErrorMessage } from '../../ui/aiErrorMessage';

const QUOTA_NOTE = 'La cuota gratis de Gemini es diaria y se renueva cada día. Si ustedes dos usan la misma key, la comparten.';

export function AiSettings() {
  const toast = useToast();
  const settings = useLiveQuery(() => getSettings(), []);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [models, setModels] = useState<string[]>([]);
  const selectId = useId();
  const key = settings?.geminiKey;

  useEffect(() => {
    if (!key) return;
    let alive = true;
    listModels(key).then((m) => alive && setModels(m)).catch(() => {});
    return () => { alive = false; };
  }, [key]);

  async function tryKey() {
    const k = input.trim();
    if (!k) return;
    setBusy(true);
    setError('');
    try {
      await testKey(k);
      const list = await listModels(k).catch(() => [] as string[]);
      await patchSettings({ geminiKey: k, geminiModel: pickDefaultModel(list) });
      setModels(list);
      setInput('');
      toast.show('Listo, la IA quedó activada');
    } catch (e) {
      setError(aiErrorMessage(e instanceof AiError ? e.kind : 'unknown'));
    }
    setBusy(false);
  }

  if (!settings) return null;

  if (!key) {
    return (
      <ListSection header="Inteligencia artificial" footer={`Crea una key gratis en aistudio.google.com › Get API key. Queda guardada solo en este teléfono. ${QUOTA_NOTE}`}>
        <Field label="Key de Gemini" type="password" autoComplete="off" autoCapitalize="off" spellCheck={false} placeholder="AIza…" value={input} onChange={setInput} />
        <div className="inset" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
          {error && <span role="alert" className="t-footnote c-danger" style={{ flex: 1 }}>{error}</span>}
          <Button variant="tinted" onClick={tryKey} disabled={!input.trim()} loading={busy}>Probar</Button>
        </div>
      </ListSection>
    );
  }

  const options = models.includes(settings.geminiModel ?? '') || !settings.geminiModel ? models : [settings.geminiModel, ...models];

  return (
    <ListSection header="Inteligencia artificial" footer={QUOTA_NOTE}>
      <ListRow title="Key" detail={`••••${key.slice(-4)}`} />
      <div className="field">
        <label htmlFor={selectId} className="field__label">Modelo</label>
        <select
          id={selectId}
          className="field__input field__select"
          value={settings.geminiModel ?? ''}
          onChange={(e) => void patchSettings({ geminiModel: e.target.value })}
        >
          {options.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      <ListRow tone="destructive" title="Borrar key" onClick={() => void patchSettings({ geminiKey: undefined, geminiModel: undefined })} />
    </ListSection>
  );
}
