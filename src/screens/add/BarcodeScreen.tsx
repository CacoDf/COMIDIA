import { useId, useState } from 'react';
import { Navigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { Camera, ChevronLeft, ScanBarcode, Video } from 'lucide-react';
import { addEntry, getFoodByBarcode, getSettings, patchSettings, upsertFood } from '../../db/repo';
import { detectCodeInImage } from '../../lib/barcodeEngine';
import { fetchProduct } from '../../services/openFoodFacts';
import { AiError, readLabel, type LabelReading } from '../../services/gemini';
import { downscaleToJpegBase64 } from '../../lib/image';
import { isValidGtin } from '../../lib/barcode';
import type { Food, Item } from '../../domain/types';
import { useAi } from '../../state/useAi';
import { Screen } from '../../ui/Screen';
import { BarButton, Button } from '../../ui/Button';
import { ListRow, ListSection } from '../../ui/List';
import { Field } from '../../ui/Field';
import { BarcodeScanner } from '../../ui/BarcodeScanner';
import { useToast } from '../../ui/Toast';
import { aiErrorMessage } from '../../ui/aiErrorMessage';
import { QuantitySheet } from './QuantitySheet';
import { ManualFoodForm } from './ManualFoodForm';
import { offErrorMessage } from './SearchScreen';
import { useAddContext } from './useAddContext';

type State =
  | { kind: 'scanning' }
  | { kind: 'reading-code' }
  | { kind: 'no-code' }
  | { kind: 'looking'; code: string }
  | { kind: 'not-found'; code: string }
  | { kind: 'reading-label'; code: string }
  | { kind: 'error'; code: string; message: string }
  | { kind: 'manual'; code: string; reading?: LabelReading };

export default function BarcodeScreen() {
  const { slot, date, backToMenu, backToToday } = useAddContext();
  const ai = useAi();
  const toast = useToast();
  const labelInput = useId();
  const photoInput = useId();
  const settings = useLiveQuery(() => getSettings(), []);
  const mode = settings ? (settings.scanMode ?? 'photo') : null;
  const [state, setState] = useState<State>({ kind: 'scanning' });
  const [food, setFood] = useState<Food | null>(null);
  const [camera, setCamera] = useState<'ok' | 'denied' | 'unsupported'>('ok');
  const [typed, setTyped] = useState('');

  if (!slot) return <Navigate to="/" replace />;

  async function lookup(code: string, fromPhoto = false) {
    if ((!fromPhoto && state.kind === 'looking') || food) return;
    setState({ kind: 'looking', code });
    const local = await getFoodByBarcode(code);
    if (local) {
      setFood(local);
      setState({ kind: 'scanning' });
      return;
    }
    try {
      const found = await fetchProduct(code);
      if (!found) {
        setState({ kind: 'not-found', code });
        return;
      }
      await upsertFood(found);
      setFood(found);
      setState({ kind: 'scanning' });
    } catch (e) {
      setState({ kind: 'error', code, message: offErrorMessage(e) });
    }
  }

  async function readCodePhoto(file: File) {
    setState({ kind: 'reading-code' });
    try {
      const code = await detectCodeInImage(file);
      if (code) await lookup(code, true);
      else setState({ kind: 'no-code' });
    } catch {
      setState({ kind: 'no-code' });
    }
  }

  async function readLabelPhoto(code: string, file: File) {
    if (!ai.config) return;
    setState({ kind: 'reading-label', code });
    try {
      const reading = await readLabel(ai.config, await downscaleToJpegBase64(file));
      setState({ kind: 'manual', code, reading });
    } catch (e) {
      setState({ kind: 'error', code, message: aiErrorMessage(e instanceof AiError ? e.kind : 'unknown') });
    }
  }

  async function confirm(item: Item) {
    await addEntry({ date, slot: slot!, name: item.name, items: [item], source: 'barcode' });
    toast.show('Buena, guardado');
    backToToday();
  }

  const scanAgain = () => { setState({ kind: 'scanning' }); setFood(null); };
  const busy = state.kind === 'looking' || state.kind === 'reading-label' || state.kind === 'reading-code';

  return (
    <Screen
      title="Código de barras"
      large={false}
      tabbar={false}
      leading={
        <BarButton onClick={backToMenu}>
          <ChevronLeft size={24} strokeWidth={2.2} aria-hidden="true" /> Atrás
        </BarButton>
      }
    >
      <div style={{ height: 12 }} />
      {mode === 'live' && (camera === 'ok' ? (
        <>
          <BarcodeScanner
            paused={state.kind !== 'scanning' || food !== null}
            onDetected={lookup}
            onUnavailable={(r) => setCamera(r)}
          />
          <p className="t-footnote c-secondary" style={{ textAlign: 'center', margin: '8px 16px 12px' }} aria-live="polite">
            {state.kind === 'looking' ? `Buscando ${state.code}…`
              : state.kind === 'reading-label' ? 'Leyendo la etiqueta…'
              : 'Apunta al código de barras y mantén el teléfono quieto.'}
          </p>
        </>
      ) : (
        <p className="t-subhead c-secondary" style={{ margin: '8px 16px 12px' }}>
          {camera === 'denied'
            ? 'No hay acceso a la cámara en vivo. Usa la foto del código o escríbelo.'
            : 'Este navegador no puede usar la cámara en vivo. Usa la foto del código o escríbelo.'}
        </p>
      ))}

      {mode === 'photo' && (
        <>
          <label htmlFor={photoInput} className="btn btn--large btn--filled" style={{ cursor: 'pointer' }}>
            <ScanBarcode size={20} aria-hidden="true" />
            Sacar foto al código
            <input
              id={photoInput}
              className="visually-hidden"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void readCodePhoto(f);
                e.target.value = '';
              }}
            />
          </label>
          <p className="t-footnote c-secondary" style={{ textAlign: 'center', margin: '8px 16px 20px' }} aria-live="polite">
            {state.kind === 'reading-code' ? 'Leyendo el código…'
              : state.kind === 'looking' ? `Buscando ${state.code}…`
              : state.kind === 'reading-label' ? 'Leyendo la etiqueta…'
              : state.kind === 'no-code' ? 'No pude leer el código. Prueba con más luz, más cerca y con el código derecho, o escríbelo abajo.'
              : 'Saca la foto de cerca, con todo el código dentro. No pide permiso de cámara.'}
          </p>
        </>
      )}

      {mode && (
        <ListSection>
          {mode === 'photo' ? (
            <ListRow tone="action" leading={<Video size={20} strokeWidth={2} />} title="Usar cámara en vivo" onClick={() => { setCamera('ok'); void patchSettings({ scanMode: 'live' }); }} />
          ) : (
            <ListRow tone="action" leading={<Camera size={20} strokeWidth={2} />} title="Usar foto del código" onClick={() => void patchSettings({ scanMode: 'photo' })} />
          )}
        </ListSection>
      )}

      {state.kind === 'not-found' && (
        <ListSection header="No encontramos este producto" footer={`Código ${state.code}. Lo que guardes queda para la próxima vez que lo escanees.`}>
          {ai.ready && (
            <label htmlFor={labelInput} className="row row--action" style={{ cursor: 'pointer' }}>
              <span className="row__leading" aria-hidden="true"><Camera size={20} /></span>
              <span className="row__text">Fotografiar la tabla nutricional</span>
              <input
                id={labelInput}
                className="visually-hidden"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void readLabelPhoto(state.code, f);
                }}
              />
            </label>
          )}
          <ListRow tone="action" title="Ingresar a mano" onClick={() => setState({ kind: 'manual', code: state.code })} />
          <ListRow tone="action" title="Escanear otro" onClick={scanAgain} />
        </ListSection>
      )}

      {state.kind === 'error' && (
        <ListSection footer={state.message}>
          <ListRow tone="action" title="Reintentar" onClick={() => lookup(state.code)} />
          <ListRow tone="action" title="Escanear otro" onClick={scanAgain} />
        </ListSection>
      )}

      <ListSection header="¿No lo lee?">
        <Field label="Código" inputMode="numeric" autoComplete="off" placeholder="7802900004873" value={typed} onChange={(v) => setTyped(v.replace(/\D/g, ''))} />
        <div className="inset" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
          {typed.length >= 8 && !isValidGtin(typed) && <span className="t-footnote c-danger">Revisa los números</span>}
          <Button variant="tinted" disabled={!isValidGtin(typed) || busy} onClick={() => lookup(typed)}>Buscar código</Button>
        </div>
      </ListSection>

      {state.kind === 'manual' && (
        <ManualFoodForm
          title={state.reading ? 'Revisa la etiqueta' : 'Nuevo producto'}
          initial={{
            barcode: state.code,
            name: state.reading?.name ?? '',
            per100: state.reading?.per100 ?? {},
            serving: state.reading?.servingGrams ?? null,
          }}
          onClose={scanAgain}
          onSaved={(f) => { setState({ kind: 'scanning' }); setFood(f); }}
        />
      )}
      {food && <QuantitySheet food={food} onClose={scanAgain} onConfirm={confirm} />}
    </Screen>
  );
}
