import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import MealsScreen from './MealsScreen';
import SuggestScreen from './SuggestScreen';
import SavedMealsPicker from '../add/SavedMealsPicker';
import TodayScreen from '../today/TodayScreen';
import { DraftProvider, useDraft } from '../../state/DraftContext';
import { ToastProvider } from '../../ui/Toast';
import { resetDb } from '../../db/db';
import { addEntry, listEntries, listSavedMeals, patchSettings, saveMeal, saveProfile, setWeight } from '../../db/repo';
import { todayLocal } from '../../domain/dates';
import { AiError } from '../../services/gemini';
import * as gemini from '../../services/gemini';

const today = todayLocal();
const avena = { name: 'Avena', grams: 60, macros: { kcal: 230, protein: 8, carbs: 40, fat: 4 } };
const leche = { name: 'Leche', grams: 200, macros: { kcal: 100, protein: 7, carbs: 10, fat: 4 } };

function DraftProbe() {
  const { draft } = useDraft();
  return <p data-testid="draft">{draft ? `${draft.name}|${draft.source}|${draft.slot}|${draft.steps?.length ?? 0}` : 'none'}</p>;
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ToastProvider>
        <DraftProvider>
          <Routes>
            <Route path="/comidas" element={<MealsScreen />} />
            <Route path="/sugerencias" element={<SuggestScreen />} />
            <Route path="/agregar/:slot/mis-comidas" element={<SavedMealsPicker />} />
            <Route path="/revision" element={<DraftProbe />} />
            <Route path="/" element={<TodayScreen />} />
          </Routes>
        </DraftProvider>
      </ToastProvider>
    </MemoryRouter>,
  );
}

beforeEach(async () => {
  await resetDb();
  vi.restoreAllMocks();
  await saveProfile({ sex: 'male', birthDate: `${new Date().getFullYear() - 30}-01-01`, heightCm: 180, activity: 'moderate', goal: 'lose', rateKgPerWeek: 0.5 });
  await setWeight(today, 80);
});

describe('Mis comidas al agregar', () => {
  test('tocar una comida y confirmar la anota', async () => {
    const user = userEvent.setup();
    await saveMeal({ name: 'Mi avena', items: [avena, leche] });
    renderAt('/agregar/breakfast/mis-comidas');
    await user.click(await screen.findByRole('button', { name: /Mi avena/ }));
    await user.click(within(await screen.findByRole('dialog', { name: 'Mi avena' })).getByRole('button', { name: 'Agregar' }));
    await waitFor(async () => expect(await listEntries(today)).toHaveLength(1));
    expect((await listEntries(today))[0]).toMatchObject({ name: 'Mi avena', source: 'saved', slot: 'breakfast' });
  });

  test('media porción escala todos los ingredientes', async () => {
    const user = userEvent.setup();
    await saveMeal({ name: 'Mi avena', items: [avena, leche] });
    renderAt('/agregar/breakfast/mis-comidas');
    await user.click(await screen.findByRole('button', { name: /Mi avena/ }));
    const sheet = await screen.findByRole('dialog', { name: 'Mi avena' });
    const p = within(sheet).getByLabelText('Porciones');
    await user.clear(p);
    await user.type(p, '0,5');
    await user.click(within(sheet).getByRole('button', { name: 'Agregar' }));
    await waitFor(async () => expect(await listEntries(today)).toHaveLength(1));
    const [e] = await listEntries(today);
    expect(e.items.map((i) => i.grams)).toEqual([30, 100]);
    expect(e.items[0].macros.kcal).toBeCloseTo(115);
  });

  test('sin comidas guardadas explica cómo crearlas', async () => {
    renderAt('/agregar/breakfast/mis-comidas');
    expect(await screen.findByText(/Aún no tienes comidas guardadas/)).toBeInTheDocument();
  });
});

describe('Comidas', () => {
  test('desde una entrada de Hoy se puede guardar como comida', async () => {
    const user = userEvent.setup();
    await addEntry({ date: today, slot: 'breakfast', name: 'Desayuno rico', items: [avena], source: 'text' });
    renderAt('/');
    await user.click(await screen.findByRole('button', { name: /Desayuno rico/ }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Guardar en Mis comidas' }));
    await waitFor(async () => expect((await listSavedMeals()).map((m) => m.name)).toEqual(['Desayuno rico']));
  });

  test('crear una comida desde cero con ingredientes buscados', async () => {
    const user = userEvent.setup();
    renderAt('/comidas');
    await user.click(await screen.findByRole('button', { name: 'Nueva comida' }));
    const editor = await screen.findByRole('dialog', { name: 'Nueva comida' });
    await user.type(within(editor).getByLabelText('Nombre'), 'Once');
    await user.click(within(editor).getByRole('button', { name: 'Agregar ingrediente' }));
    await user.type(within(editor).getByRole('searchbox', { name: 'Buscar ingrediente' }), 'marraqueta');
    await user.click(await within(editor).findByRole('button', { name: /Marraqueta/ }));
    await user.click(within(await screen.findByRole('dialog', { name: 'Marraqueta' })).getByRole('button', { name: 'Agregar' }));
    expect(await within(editor).findByRole('button', { name: /Marraqueta/ })).toBeInTheDocument();
    await user.click(within(editor).getByRole('button', { name: 'Guardar' }));
    await waitFor(async () => expect(await listSavedMeals()).toHaveLength(1));
    const [m] = await listSavedMeals();
    expect(m.name).toBe('Once');
    expect(m.items[0].grams).toBe(100);
  });

  test('renombrar y borrar una comida', async () => {
    const user = userEvent.setup();
    await saveMeal({ name: 'Vieja', items: [avena], steps: ['Mezclar todo'] });
    renderAt('/comidas');
    await user.click(await screen.findByRole('button', { name: /Vieja/ }));
    const editor = await screen.findByRole('dialog', { name: 'Vieja' });
    expect(within(editor).getByText('Mezclar todo')).toBeInTheDocument();
    const name = within(editor).getByLabelText('Nombre');
    await user.clear(name);
    await user.type(name, 'Nueva');
    await user.click(within(editor).getByRole('button', { name: 'Guardar' }));
    await waitFor(async () => expect((await listSavedMeals())[0].name).toBe('Nueva'));
    await user.click(await screen.findByRole('button', { name: /Nueva.*ingrediente/ }));
    await user.click(within(await screen.findByRole('dialog', { name: 'Nueva' })).getByRole('button', { name: 'Borrar comida' }));
    await waitFor(async () => expect(await listSavedMeals()).toHaveLength(0));
  });
});

describe('Ideas', () => {
  const sugerencia = (n: string) => ({ name: n, items: [avena, leche], steps: ['Calentar la leche', 'Agregar la avena'] });

  test('pide ideas con lo que queda hoy y muestra tres', async () => {
    const user = userEvent.setup();
    await patchSettings({ geminiKey: 'K', geminiModel: 'm' });
    await addEntry({ date: today, slot: 'lunch', name: 'Almuerzo', items: [{ name: 'x', grams: 100, macros: { kcal: 1209, protein: 60, carbs: 155, fat: 31 } }], source: 'manual' });
    const spy = vi.spyOn(gemini, 'suggestMeals').mockResolvedValue([sugerencia('A'), sugerencia('B'), sugerencia('C')]);
    renderAt('/sugerencias');
    expect(await screen.findByText(/1.000 kcal/)).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Cena' }));
    await user.type(screen.getByLabelText('Preferencias (opcional)'), 'sin lactosa');
    await user.click(screen.getByRole('button', { name: 'Pedir ideas' }));
    expect(await screen.findAllByRole('region', { name: /^[ABC]$/ })).toHaveLength(3);
    expect(spy).toHaveBeenCalledWith({ key: 'K', model: 'm' }, {
      target: { kcal: 750, protein: 75, carbs: 75, fat: 22.5 },
      dayLeft: { kcal: 1000, protein: 100, carbs: 100, fat: 30 },
      slot: 'dinner',
      note: 'sin lactosa',
    });
    expect(screen.getByText(/Para la cena: unos 750 kcal/)).toBeInTheDocument();
    expect(screen.getAllByText('Calentar la leche')).toHaveLength(3);
  });

  test('anotar lleva a revisión y guardar crea la comida con pasos', async () => {
    const user = userEvent.setup();
    await patchSettings({ geminiKey: 'K', geminiModel: 'm' });
    vi.spyOn(gemini, 'suggestMeals').mockResolvedValue([sugerencia('A'), sugerencia('B'), sugerencia('C')]);
    renderAt('/sugerencias');
    await user.click(await screen.findByRole('button', { name: 'Pedir ideas' }));
    const b = await screen.findByRole('region', { name: 'B' });
    await user.click(within(b).getByRole('button', { name: 'Guardar' }));
    await waitFor(async () => expect(await listSavedMeals()).toHaveLength(1));
    expect((await listSavedMeals())[0]).toMatchObject({ name: 'B', steps: ['Calentar la leche', 'Agregar la avena'] });
    await user.click(within(screen.getByRole('region', { name: 'A' })).getByRole('button', { name: 'Anotar' }));
    expect(await screen.findByTestId('draft')).toHaveTextContent('A|suggestion|');
  });

  test('un error de IA muestra su mensaje', async () => {
    const user = userEvent.setup();
    await patchSettings({ geminiKey: 'K', geminiModel: 'm' });
    vi.spyOn(gemini, 'suggestMeals').mockRejectedValue(new AiError('quota'));
    renderAt('/sugerencias');
    await user.click(await screen.findByRole('button', { name: 'Pedir ideas' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/cuota gratis/);
  });

  test('sin key explica cómo activarla', async () => {
    renderAt('/sugerencias');
    expect(await screen.findByText(/agrega tu key de Gemini en Ajustes/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pedir ideas' })).not.toBeInTheDocument();
  });
});
