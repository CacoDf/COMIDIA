import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import TodayScreen from './TodayScreen';
import { ToastProvider } from '../../ui/Toast';
import { resetDb } from '../../db/db';
import { addEntry, listEntries, saveProfile, setWeight } from '../../db/repo';
import { addDays, todayLocal } from '../../domain/dates';
import type { LogEntry, MealSlot } from '../../domain/types';

const today = todayLocal();
const yesterday = addDays(today, -1);

function Where() {
  const loc = useLocation();
  return <p data-testid="where">{loc.pathname + loc.search}</p>;
}

function renderToday(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<><TodayScreen /><Where /></>} />
          <Route path="/agregar/:slot" element={<Where />} />
        </Routes>
      </ToastProvider>
    </MemoryRouter>,
  );
}

const entry = (name: string, slot: MealSlot, kcal: number, date = today, p = 10, c = 20, f = 5): Omit<LogEntry, 'id' | 'createdAt'> => ({
  date, slot, name, source: 'manual', items: [{ name, grams: 100, macros: { kcal, protein: p, carbs: c, fat: f } }],
});

beforeEach(async () => {
  await resetDb();
  // Metas: 2209 kcal, 160 P, 255 C, 61 G
  await saveProfile({ sex: 'male', birthDate: `${new Date().getFullYear() - 30}-01-01`, heightCm: 180, activity: 'moderate', goal: 'lose', rateKgPerWeek: 0.5 });
  await setWeight(today, 80);
});

test('muestra consumido, meta y lo que queda para los cuatro', async () => {
  await addEntry(entry('Avena', 'breakfast', 409, today, 60, 55, 11));
  renderToday();
  const kcal = await screen.findByRole('group', { name: 'Calorías' });
  await waitFor(() => expect(kcal).toHaveTextContent('1.800'));
  expect(kcal).toHaveTextContent('quedan');
  expect(kcal).toHaveTextContent('409 de 2.209');
  expect(screen.getByRole('group', { name: 'Proteína' })).toHaveTextContent('100');
  expect(screen.getByRole('group', { name: 'Carbos' })).toHaveTextContent('200');
  expect(screen.getByRole('group', { name: 'Grasa' })).toHaveTextContent('50');
});

test('al pasarse muestra el exceso, no un negativo', async () => {
  await addEntry(entry('Asado', 'lunch', 2309, today, 100, 100, 70));
  renderToday();
  const kcal = await screen.findByRole('group', { name: 'Calorías' });
  await waitFor(() => expect(kcal).toHaveTextContent('100'));
  expect(kcal).toHaveTextContent('de más');
  expect(kcal).not.toHaveTextContent('-100');
});

test('agrupa por las cuatro comidas con subtotal', async () => {
  await addEntry(entry('Avena', 'breakfast', 410));
  await addEntry(entry('Pollo con arroz', 'lunch', 610));
  await addEntry(entry('Bebida', 'lunch', 1));
  renderToday();
  const almuerzo = await screen.findByRole('region', { name: /Almuerzo/ });
  await waitFor(() => expect(within(almuerzo).getByText('Pollo con arroz')).toBeInTheDocument());
  expect(almuerzo).toHaveTextContent('611 kcal');
  for (const name of [/Desayuno/, /Cena/, /Colaciones/]) expect(screen.getByRole('region', { name })).toBeInTheDocument();
});

test('las flechas cambian de día y no pasan de hoy', async () => {
  const user = userEvent.setup();
  await addEntry(entry('Cazuela', 'lunch', 500, yesterday));
  renderToday();
  expect(await screen.findByRole('heading', { level: 1, name: 'Hoy' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Día siguiente' })).toBeDisabled();
  await user.click(screen.getByRole('button', { name: 'Día anterior' }));
  expect(await screen.findByRole('heading', { level: 1, name: 'Ayer' })).toBeInTheDocument();
  expect(screen.getByTestId('where')).toHaveTextContent(`?d=${yesterday}`);
  expect(await screen.findByText('Cazuela')).toBeInTheDocument();
});

test('Agregar en una comida lleva a agregar con la fecha', async () => {
  const user = userEvent.setup();
  renderToday(`/?d=${yesterday}`);
  const cena = await screen.findByRole('region', { name: /Cena/ });
  await user.click(within(cena).getByRole('button', { name: 'Agregar a Cena' }));
  expect(screen.getByTestId('where')).toHaveTextContent(`/agregar/dinner?d=${yesterday}`);
});

test('una entrada se puede mover, copiar y borrar con deshacer', async () => {
  const user = userEvent.setup();
  await addEntry(entry('Yogur', 'breakfast', 120));
  renderToday();

  await user.click(await screen.findByRole('button', { name: /Yogur/ }));
  const sheet = screen.getByRole('dialog', { name: 'Yogur' });
  await user.click(within(sheet).getByRole('radio', { name: 'Colaciones' }));
  await waitFor(async () => expect((await listEntries(today))[0].slot).toBe('snacks'));

  await user.click(await screen.findByRole('button', { name: /Yogur/ }));
  const sheet2 = screen.getByRole('dialog', { name: 'Yogur' });
  const date = within(sheet2).getByLabelText('Día');
  await user.clear(date);
  await user.type(date, yesterday);
  await user.click(within(sheet2).getByRole('button', { name: 'Copiar' }));
  await waitFor(async () => expect(await listEntries(yesterday)).toHaveLength(1));
  expect(await listEntries(today)).toHaveLength(1);

  await user.click(await screen.findByRole('button', { name: /Yogur/ }));
  await user.click(within(screen.getByRole('dialog', { name: 'Yogur' })).getByRole('button', { name: 'Borrar' }));
  await waitFor(async () => expect(await listEntries(today)).toHaveLength(0));
  await user.click(await screen.findByRole('button', { name: 'Deshacer' }));
  await waitFor(async () => expect(await listEntries(today)).toHaveLength(1));
});
