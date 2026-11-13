import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import TextScreen from './TextScreen';
import { DraftProvider, useDraft } from '../../state/DraftContext';
import { resetDb } from '../../db/db';
import { patchSettings } from '../../db/repo';
import { AiError } from '../../services/gemini';
import * as gemini from '../../services/gemini';

function ReviewProbe() {
  const { draft } = useDraft();
  return <p data-testid="draft">{draft ? `${draft.name}|${draft.source}|${draft.slot}|${draft.items.length}` : 'none'}</p>;
}

function renderText() {
  return render(
    <MemoryRouter initialEntries={['/agregar/lunch/texto']}>
      <DraftProvider>
        <Routes>
          <Route path="/agregar/:slot/texto" element={<TextScreen />} />
          <Route path="/revision" element={<ReviewProbe />} />
        </Routes>
      </DraftProvider>
    </MemoryRouter>,
  );
}

const item = { name: 'Huevo', grams: 100, macros: { kcal: 150, protein: 10, carbs: 1, fat: 11 } };

beforeEach(async () => {
  await resetDb();
  await patchSettings({ geminiKey: 'K', geminiModel: 'm' });
  vi.restoreAllMocks();
});

test('calcula y va a revisión con el borrador', async () => {
  const user = userEvent.setup();
  const spy = vi.spyOn(gemini, 'estimateFromText').mockResolvedValue([item]);
  renderText();
  await user.type(await screen.findByLabelText('¿Qué comiste?'), '2 huevos revueltos con tomate y una marraqueta');
  await user.click(screen.getByRole('button', { name: 'Calcular' }));
  expect(await screen.findByTestId('draft')).toHaveTextContent('2 huevos revueltos con tomate|text|lunch|1');
  expect(spy).toHaveBeenCalledWith({ key: 'K', model: 'm' }, '2 huevos revueltos con tomate y una marraqueta');
});

test('mientras espera el botón queda ocupado', async () => {
  const user = userEvent.setup();
  vi.spyOn(gemini, 'estimateFromText').mockReturnValue(new Promise(() => {}));
  renderText();
  await user.type(await screen.findByLabelText('¿Qué comiste?'), 'pan');
  await user.click(screen.getByRole('button', { name: 'Calcular' }));
  await waitFor(() => expect(screen.getByRole('button', { name: /Calcular/ })).toHaveAttribute('aria-busy', 'true'));
});

test.each([
  ['quota', /cuota gratis de hoy/],
  ['offline', /Sin conexión/],
  ['invalid-response', /no se pudo leer/],
  ['no-food', /No encontré comida/],
] as const)('error %s muestra su mensaje y conserva el texto', async (kind, message) => {
  const user = userEvent.setup();
  vi.spyOn(gemini, 'estimateFromText').mockRejectedValue(new AiError(kind));
  renderText();
  const box = await screen.findByLabelText('¿Qué comiste?');
  await user.type(box, 'algo rico');
  await user.click(screen.getByRole('button', { name: 'Calcular' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(message);
  expect(box).toHaveValue('algo rico');
});
