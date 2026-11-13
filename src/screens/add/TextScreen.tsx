import { useId, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import { AiError, estimateFromText } from '../../services/gemini';
import { useAi } from '../../state/useAi';
import { useDraft } from '../../state/DraftContext';
import { Screen } from '../../ui/Screen';
import { BarButton, Button } from '../../ui/Button';
import { ListSection } from '../../ui/List';
import { aiErrorMessage } from '../../ui/aiErrorMessage';
import { useAddContext } from './useAddContext';

/** Nombre corto para la entrada: lo que va antes de la primera coma o " y ", hasta 5 palabras. */
export function nameFromText(text: string): string {
  const first = text.trim().split(/,|\sy\s/i)[0].trim();
  const words = first.split(/\s+/).slice(0, 5).join(' ');
  const name = words.length > 40 ? `${words.slice(0, 39)}…` : words;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export default function TextScreen() {
  const navigate = useNavigate();
  const { slot, date, backToMenu } = useAddContext();
  const ai = useAi();
  const { text, setText, setDraft } = useDraft();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const id = useId();

  if (!slot) return <Navigate to="/" replace />;

  async function calculate() {
    if (!ai.config || !text.trim()) return;
    setBusy(true);
    setError('');
    try {
      const items = await estimateFromText(ai.config, text.trim());
      setDraft({ date, slot: slot!, name: nameFromText(text), items, source: 'text' });
      navigate('/revision');
    } catch (e) {
      setError(aiErrorMessage(e instanceof AiError ? e.kind : 'unknown'));
      setBusy(false);
    }
  }

  return (
    <Screen
      title="Escribir"
      large={false}
      tabbar={false}
      leading={
        <BarButton onClick={backToMenu}>
          <ChevronLeft size={24} strokeWidth={2.2} aria-hidden="true" /> Atrás
        </BarButton>
      }
    >
      <div style={{ height: 16 }} />
      <ListSection footer="Mientras más detalle (cantidades, cómo está preparado), mejor la estimación.">
        <label htmlFor={id} className="visually-hidden">¿Qué comiste?</label>
        <textarea
          id={id}
          className="textarea"
          rows={4}
          placeholder="Ej. 2 huevos revueltos, una marraqueta con palta y un café con leche"
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus
        />
      </ListSection>
      {error && <p role="alert" className="t-subhead c-danger" style={{ margin: '-16px 16px 16px' }}>{error}</p>}
      <Button size="large" onClick={calculate} disabled={!text.trim() || !ai.ready} loading={busy}>Calcular</Button>
    </Screen>
  );
}
