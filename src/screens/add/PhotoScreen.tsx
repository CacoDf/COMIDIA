import { useEffect, useId, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { Camera, ChevronLeft, Image as ImageIcon } from 'lucide-react';
import { AiError, estimateFromPhoto } from '../../services/gemini';
import { downscaleToJpegBase64 } from '../../lib/image';
import { useAi } from '../../state/useAi';
import { useDraft } from '../../state/DraftContext';
import type { Item } from '../../domain/types';
import { Screen } from '../../ui/Screen';
import { BarButton, Button } from '../../ui/Button';
import { ListSection } from '../../ui/List';
import { aiErrorMessage } from '../../ui/aiErrorMessage';
import { useAddContext } from './useAddContext';

/** "Lomo a lo pobre y papas fritas": los dos primeros ingredientes. */
export function nameFromItems(items: Item[]): string {
  const [a, b] = items.map((i) => i.name);
  if (!b) return a ?? 'Comida';
  return `${a} y ${b.charAt(0).toLowerCase()}${b.slice(1)}`;
}

function PickButton({ label, icon, capture, variant, onPick }: {
  label: string;
  icon: React.ReactNode;
  capture?: boolean;
  variant: 'filled' | 'tinted';
  onPick: (f: File) => void;
}) {
  const id = useId();
  return (
    <label htmlFor={id} className={`btn btn--large btn--${variant}`} style={{ cursor: 'pointer' }}>
      {icon}
      {label}
      <input
        id={id}
        className="visually-hidden"
        type="file"
        accept="image/*"
        {...(capture ? { capture: 'environment' as const } : {})}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = '';
        }}
      />
    </label>
  );
}

export default function PhotoScreen() {
  const navigate = useNavigate();
  const { slot, date, backToMenu } = useAddContext();
  const ai = useAi();
  const { setDraft } = useDraft();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const noteId = useId();

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!slot) return <Navigate to="/" replace />;

  async function calculate() {
    if (!file || !ai.config) return;
    setBusy(true);
    setError('');
    try {
      const b64 = await downscaleToJpegBase64(file);
      const items = await estimateFromPhoto(ai.config, b64, note.trim() || undefined);
      setDraft({ date, slot: slot!, name: nameFromItems(items), items, source: 'photo' });
      navigate('/revision');
    } catch (e) {
      setError(aiErrorMessage(e instanceof AiError ? e.kind : 'unknown'));
      setBusy(false);
    }
  }

  const pick = (f: File) => { setFile(f); setError(''); };

  return (
    <Screen
      title="Foto"
      large={false}
      tabbar={false}
      leading={
        <BarButton onClick={backToMenu}>
          <ChevronLeft size={24} strokeWidth={2.2} aria-hidden="true" /> Atrás
        </BarButton>
      }
    >
      <div style={{ height: 16 }} />
      {!file ? (
        <div style={{ display: 'grid', gap: 12 }}>
          <PickButton label="Tomar foto" capture variant="filled" icon={<Camera size={20} aria-hidden="true" />} onPick={pick} />
          <PickButton label="Elegir de la galería" variant="tinted" icon={<ImageIcon size={20} aria-hidden="true" />} onPick={pick} />
          <p className="t-footnote c-secondary" style={{ margin: '4px 16px 0', textAlign: 'center' }}>
            Saca la foto desde arriba, con todo el plato visible. La foto no se guarda.
          </p>
        </div>
      ) : (
        <>
          <div className="photo-preview">
            {preview && <img src={preview} alt="Foto de tu comida" />}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 20px' }}>
            <PickButton label="Cambiar foto" variant="tinted" icon={<Camera size={18} aria-hidden="true" />} onPick={pick} />
          </div>
          <ListSection footer="Ayuda a la IA con lo que no se ve: tipo de arroz, si es light, cuánto aceite.">
            <label htmlFor={noteId} className="visually-hidden">Nota (opcional)</label>
            <textarea
              id={noteId}
              className="textarea"
              rows={2}
              style={{ minHeight: 64 }}
              placeholder="Nota (opcional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </ListSection>
          {error && <p role="alert" className="t-subhead c-danger" style={{ margin: '-16px 16px 16px' }}>{error}</p>}
          <Button size="large" onClick={calculate} disabled={!ai.ready} loading={busy}>Calcular</Button>
        </>
      )}
    </Screen>
  );
}
