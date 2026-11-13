import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import ProgressScreen from './ProgressScreen';
import { weeklyAverage } from '../../domain/weekly';
import { ToastProvider } from '../../ui/Toast';
import { resetDb } from '../../db/db';
import { addEntry, getProfile, latestWeight, saveProfile, setWeight } from '../../db/repo';
import { addDays, todayLocal, weekRange } from '../../domain/dates';
import type { LogEntry } from '../../domain/types';

const today = todayLocal();
const m = (kcal: number) => ({ kcal, protein: 10, carbs: 20, fat: 5 });
const entry = (date: string, kcal: number): LogEntry => ({
  id: `${date}-${kcal}`, date, slot: 'lunch', name: 'x', source: 'manual', createdAt: 1,
  items: [{ name: 'x', grams: 100, macros: m(kcal) }],
});

function renderProgress() {
  return render(<MemoryRouter><ToastProvider><ProgressScreen /></ToastProvider></MemoryRouter>);
}

beforeEach(async () => {
  await resetDb();
  await saveProfile({ sex: 'male', birthDate: `${new Date().getFullYear() - 30}-01-01`, heightCm: 180, activity: 'moderate', goal: 'lose', rateKgPerWeek: 0.5 });
});

test('weeklyAverage divide solo por los días anotados', () => {
  const r = weeklyAverage([entry('2026-11-09', 1000), entry('2026-11-09', 500), entry('2026-11-10', 2000), entry('2026-11-12', 1500)]);
  expect(r.daysLogged).toBe(3);
  expect(r.average.kcal).toBeCloseTo(5000 / 3);
});

test('weeklyAverage sin entradas', () => {
  expect(weeklyAverage([])).toEqual({ daysLogged: 0, average: { kcal: 0, protein: 0, carbs: 0, fat: 0 } });
});

test('sin pesos muestra el estado vacío del gráfico', async () => {
  renderProgress();
  expect(await screen.findByText(/Registra tu peso para ver cómo avanzas/)).toBeInTheDocument();
});

test('registrar un peso con coma lo guarda hoy y avisa si cambian las metas', async () => {
  const user = userEvent.setup();
  await setWeight(addDays(today, -7), 80);
  renderProgress();
  const field = await screen.findByLabelText('Peso de hoy');
  await user.clear(field);
  await user.type(field, '79,2');
  await user.click(screen.getByRole('button', { name: 'Registrar' }));
  await waitFor(async () => expect(await latestWeight()).toMatchObject({ date: today, kg: 79.2 }));
  const notice = await screen.findByRole('status', { name: 'Tus metas cambiaron' });
  expect(notice).toHaveTextContent('2.209');
  expect(notice).toHaveTextContent('2.197');
});

test('con metas manuales no hay aviso', async () => {
  const user = userEvent.setup();
  const p = await getProfile();
  await saveProfile({ ...p!, manualTargets: { kcal: 2000, protein: 150, carbs: 200, fat: 60 } });
  await setWeight(addDays(today, -7), 80);
  renderProgress();
  const field = await screen.findByLabelText('Peso de hoy');
  await user.clear(field);
  await user.type(field, '78');
  await user.click(screen.getByRole('button', { name: 'Registrar' }));
  await waitFor(async () => expect((await latestWeight())?.kg).toBe(78));
  expect(screen.queryByRole('status', { name: 'Tus metas cambiaron' })).not.toBeInTheDocument();
});

test('el gráfico se dibuja con un solo punto', async () => {
  await setWeight(today, 80);
  renderProgress();
  const chart = await screen.findByRole('img', { name: /Gráfico de peso/ });
  expect(chart.querySelectorAll('circle').length).toBeGreaterThanOrEqual(1);
  expect(chart).toHaveAccessibleName(/80 kg/);
});

test('el resumen semanal compara el promedio con la meta y navega a semanas anteriores', async () => {
  const user = userEvent.setup();
  await setWeight(today, 80);
  const { from } = weekRange(today);
  await addEntry({ date: from, slot: 'lunch', name: 'x', source: 'manual', items: [{ name: 'x', grams: 1, macros: m(1800) }] });
  const prevMonday = addDays(from, -7);
  await addEntry({ date: prevMonday, slot: 'lunch', name: 'y', source: 'manual', items: [{ name: 'y', grams: 1, macros: m(2500) }] });
  renderProgress();
  const week = await screen.findByRole('region', { name: /Semana/ });
  await waitFor(() => expect(week).toHaveTextContent('1.800 / 2.209 kcal'));
  expect(week).toHaveTextContent('1 de 7 días anotados');
  expect(within(week).getByRole('button', { name: 'Semana siguiente' })).toBeDisabled();
  await user.click(within(week).getByRole('button', { name: 'Semana anterior' }));
  await waitFor(() => expect(week).toHaveTextContent('2.500 / 2.209 kcal'));
});
