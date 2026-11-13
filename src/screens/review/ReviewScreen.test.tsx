import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import ReviewScreen from './ReviewScreen';
import { DraftProvider, type Draft } from '../../state/DraftContext';
import { ToastProvider } from '../../ui/Toast';
import { resetDb } from '../../db/db';
import { addEntry, listEntries, listSavedMeals, patchSettings } from '../../db/repo';
import { AiError } from '../../services/gemini';
import * as gemini from '../../services/gemini';
import { todayLocal } from '../../domain/dates';

const today = todayLocal();

function Where() {
  const loc = useLocation();
  return <p data-testid="where">{loc.pathname + loc.search}</p>;
}

const huevo = { name: 'Huevo revuelto', grams: 100, macros: { kcal: 150, protein: 10, carbs: 1, fat: 11 } };
const pan = { name: 'Marraqueta', grams: 100, macros: { kcal: 270, protein: 9, carbs: 55, fat: 2 } };
const baseDraft: Draft = { date: today, slot: 'breakfast', name: '2 huevos y marraqueta', items: [huevo, pan], source: 'text' };

function renderReview(draft?: Draft) {
  return render(
    <MemoryRouter initialEntries={['/revision']}>
      <ToastProvider>
        <DraftProvider initialDraft={draft}>
          <Routes>
            <Route path="/revision" element={<ReviewScreen />} />
            <Route path="*" element={<Where />} />
          </Routes>
        </DraftProvider>
      </ToastProvider>
    </MemoryRouter>,
  );
}

beforeEach(async () => {
  await resetDb();
  vi.restoreAllMocks();
});

test('muestra ingredientes y total, y guardar sin cambios es un toque', async () => {
  const user = userEvent.setup();
  renderReview(baseDraft);
  expect(await screen.findByRole('button', { name: /Huevo revuelto/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Marraqueta/ })).toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'Total' })).toHaveTextContent('420 kcal');
  await user.click(screen.getByRole('button', { name: 'Guardar' }));
  await waitFor(async () => expect(await listEntries(today)).toHaveLength(1));
  expect((await listEntries(today))[0]).toMatchObject({ name: '2 huevos y marraqueta', slot: 'breakfast', source: 'text' });
  expect(await screen.findByTestId('where')).toHaveTextContent(/^\/$/);
});

test('cambiar los gramos escala la línea y el total', async () => {
  const user = userEvent.setup();
  renderReview(baseDraft);
  await user.click(await screen.findByRole('button', { name: /Huevo revuelto/ }));
  const sheet = await screen.findByRole('dialog', { name: 'Huevo revuelto' });
  const g = within(sheet).getByLabelText('Gramos');
  await user.clear(g);
  await user.type(g, '150');
  expect(within(sheet).getByLabelText('Calorías')).toHaveValue('225');
  await user.click(within(sheet).getByRole('button', { name: 'Listo' }));
  expect(screen.getByRole('region', { name: 'Total' })).toHaveTextContent('495 kcal');
});

test('un macro editado a mano se respeta', async () => {
  const user = userEvent.setup();
  renderReview(baseDraft);
  await user.click(await screen.findByRole('button', { name: /Marraqueta/ }));
  const sheet = await screen.findByRole('dialog', { name: 'Marraqueta' });
  const kcal = within(sheet).getByLabelText('Calorías');
  await user.clear(kcal);
  await user.type(kcal, '250');
  await user.click(within(sheet).getByRole('button', { name: 'Listo' }));
  expect(screen.getByRole('region', { name: 'Total' })).toHaveTextContent('400 kcal');
});

test('borrar una línea la quita; sin líneas no se puede guardar', async () => {
  const user = userEvent.setup();
  renderReview({ ...baseDraft, items: [huevo] });
  await user.click(await screen.findByRole('button', { name: /Huevo revuelto/ }));
  await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Quitar ingrediente' }));
  await waitFor(() => expect(screen.queryByRole('button', { name: /Huevo revuelto/ })).not.toBeInTheDocument());
  expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled();
});

test('se puede cambiar nombre y comida, y guardar también en Mis comidas', async () => {
  const user = userEvent.setup();
  renderReview(baseDraft);
  const name = await screen.findByLabelText('Nombre');
  await user.clear(name);
  await user.type(name, 'Desayuno de campeón');
  await user.click(screen.getByRole('radio', { name: 'Almuerzo' }));
  await user.click(screen.getByRole('switch', { name: 'Guardar también en Mis comidas' }));
  await user.click(screen.getByRole('button', { name: 'Guardar' }));
  await waitFor(async () => expect(await listEntries(today)).toHaveLength(1));
  expect((await listEntries(today))[0]).toMatchObject({ name: 'Desayuno de campeón', slot: 'lunch' });
  const meals = await listSavedMeals();
  expect(meals).toHaveLength(1);
  expect(meals[0]).toMatchObject({ name: 'Desayuno de campeón' });
  expect(meals[0].items).toHaveLength(2);
});

test('editar una entrada existente la actualiza en vez de duplicarla', async () => {
  const user = userEvent.setup();
  const e = await addEntry({ date: today, slot: 'dinner', name: 'Cena', items: [huevo], source: 'manual' });
  renderReview({ date: today, slot: 'dinner', name: 'Cena', items: [huevo, pan], source: 'manual', entryId: e.id });
  await user.click(await screen.findByRole('button', { name: 'Guardar' }));
  await waitFor(async () => expect((await listEntries(today))[0].items).toHaveLength(2));
  expect(await listEntries(today)).toHaveLength(1);
});

test('sin borrador vuelve a Hoy', async () => {
  renderReview();
  expect(await screen.findByTestId('where')).toHaveTextContent(/^\/$/);
});

describe('corregir resultados', () => {
  test('la corrección recalcula con la foto y reemplaza los ingredientes', async () => {
    const user = userEvent.setup();
    await patchSettings({ geminiKey: 'K', geminiModel: 'm' });
    const mayo = { name: 'Mayonesa', grams: 15, macros: { kcal: 100, protein: 0, carbs: 0, fat: 11 } };
    const spy = vi.spyOn(gemini, 'refineEstimate').mockResolvedValue([huevo, pan, mayo]);
    renderReview({ ...baseDraft, source: 'photo', context: { photoB64: 'FOTO' } });
    await user.type(await screen.findByLabelText('¿Qué hay que corregir?'), 'faltó la mayonesa');
    await user.click(screen.getByRole('button', { name: 'Corregir' }));
    expect(await screen.findByRole('button', { name: /Mayonesa/ })).toBeInTheDocument();
    expect(spy).toHaveBeenCalledWith({ key: 'K', model: 'm' }, { items: [huevo, pan], correction: 'faltó la mayonesa', photoB64: 'FOTO' });
    expect(screen.getByRole('region', { name: 'Total' })).toHaveTextContent('520 kcal');
    expect(screen.getByLabelText('¿Qué hay que corregir?')).toHaveValue('');
  });

  test('si la corrección falla conserva lo escrito y los ingredientes', async () => {
    const user = userEvent.setup();
    await patchSettings({ geminiKey: 'K', geminiModel: 'm' });
    vi.spyOn(gemini, 'refineEstimate').mockRejectedValue(new AiError('quota'));
    renderReview({ ...baseDraft, context: { text: '2 huevos y marraqueta' } });
    await user.type(await screen.findByLabelText('¿Qué hay que corregir?'), 'no tiene pan');
    await user.click(screen.getByRole('button', { name: 'Corregir' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/cuota gratis/);
    expect(screen.getByLabelText('¿Qué hay que corregir?')).toHaveValue('no tiene pan');
    expect(screen.getByRole('button', { name: /Marraqueta/ })).toBeInTheDocument();
  });

  test('sin key no aparece la corrección', async () => {
    renderReview(baseDraft);
    await screen.findByRole('button', { name: /Huevo revuelto/ });
    expect(screen.queryByLabelText('¿Qué hay que corregir?')).not.toBeInTheDocument();
  });

  test('los gramos se editan directo en la fila', async () => {
    const user = userEvent.setup();
    renderReview(baseDraft);
    const g = await screen.findByLabelText('Gramos de Huevo revuelto');
    await user.clear(g);
    await user.type(g, '150');
    await waitFor(() => expect(screen.getByRole('region', { name: 'Total' })).toHaveTextContent('495 kcal'));
  });
});
