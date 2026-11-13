import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import AddMenuScreen from './AddMenuScreen';
import SearchScreen from './SearchScreen';
import { QuantitySheet } from './QuantitySheet';
import { ToastProvider } from '../../ui/Toast';
import { resetDb } from '../../db/db';
import { getFood, listEntries, patchSettings } from '../../db/repo';
import { addDays, todayLocal } from '../../domain/dates';
import type { Food } from '../../domain/types';

const today = todayLocal();

function Where() {
  const loc = useLocation();
  return <p data-testid="where">{loc.pathname + loc.search}</p>;
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ToastProvider>
        <Routes>
          <Route path="/agregar/:slot" element={<AddMenuScreen />} />
          <Route path="/agregar/:slot/buscar" element={<SearchScreen />} />
          <Route path="*" element={<Where />} />
        </Routes>
      </ToastProvider>
    </MemoryRouter>,
  );
}

const offHit = (code: string, name: string) => ({
  code, product_name: name, brands: 'Colun', serving_quantity: 200,
  nutriments: { 'energy-kcal_100g': 40, proteins_100g: 3, carbohydrates_100g: 5, fat_100g: 1 },
});

beforeEach(async () => {
  await resetDb();
  vi.unstubAllGlobals();
});

describe('Agregar', () => {
  test('ofrece las cinco formas y sin key deshabilita Escribir y Foto', async () => {
    renderAt('/agregar/lunch');
    expect(await screen.findByRole('heading', { name: 'Agregar a Almuerzo' })).toBeInTheDocument();
    for (const name of [/Buscar/, /Código de barras/, /Mis comidas/]) expect(screen.getByRole('button', { name })).toBeEnabled();
    expect(await screen.findByText(/key de Gemini en Ajustes/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Escribir/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Foto/ })).toBeDisabled();
  });

  test('con key habilita Escribir y Foto y navega conservando la fecha', async () => {
    const user = userEvent.setup();
    await patchSettings({ geminiKey: 'K', geminiModel: 'm' });
    const d = addDays(today, -1);
    renderAt(`/agregar/dinner?d=${d}`);
    await waitFor(() => expect(screen.getByRole('button', { name: /Escribir/ })).toBeEnabled());
    await user.click(screen.getByRole('button', { name: /Escribir/ }));
    expect(screen.getByTestId('where')).toHaveTextContent(`/agregar/dinner/texto?d=${d}`);
  });

  test('una comida inválida vuelve a Hoy', async () => {
    renderAt('/agregar/merienda');
    expect(await screen.findByTestId('where')).toHaveTextContent(/^\/$/);
  });
});

describe('Buscar', () => {
  test('muestra resultados locales al escribir, sin llamar a la red', async () => {
    const user = userEvent.setup();
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    renderAt('/agregar/lunch/buscar');
    await user.type(screen.getByRole('searchbox', { name: 'Buscar alimento' }), 'platano');
    expect(await screen.findByRole('button', { name: /Plátano/ })).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  test('buscar en productos guarda el elegido y anota la cantidad', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ hits: [offHit('780', 'Leche Colun Light')] }))));
    renderAt('/agregar/lunch/buscar');
    await user.type(screen.getByRole('searchbox', { name: 'Buscar alimento' }), 'leche colun');
    await user.click(screen.getByRole('button', { name: /Buscar «leche colun» en productos/ }));
    await user.click(await screen.findByRole('button', { name: /Leche Colun Light/ }));
    expect(await getFood('off:780')).toBeTruthy();
    const sheet = await screen.findByRole('dialog', { name: 'Leche Colun Light' });
    await user.click(within(sheet).getByRole('button', { name: 'Agregar' }));
    await waitFor(async () => expect(await listEntries(today)).toHaveLength(1));
    const [e] = await listEntries(today);
    expect(e).toMatchObject({ slot: 'lunch', source: 'search', name: 'Leche Colun Light' });
    expect(e.items[0].grams).toBe(200);
    expect(await screen.findByTestId('where')).toHaveTextContent(/^\/$/);
  });

  test.each([
    [429, /muchas búsquedas/],
    ['offline', /Sin conexión/],
  ])('error %s muestra su mensaje y conserva lo escrito', async (kind, message) => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', kind === 'offline'
      ? vi.fn().mockRejectedValue(new TypeError('Load failed'))
      : vi.fn().mockResolvedValue(new Response('{}', { status: 429 })));
    renderAt('/agregar/lunch/buscar');
    const box = screen.getByRole('searchbox', { name: 'Buscar alimento' });
    await user.type(box, 'galletas');
    await user.click(screen.getByRole('button', { name: /en productos/ }));
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(box).toHaveValue('galletas');
  });

  test('crear alimento lo guarda como propio', async () => {
    const user = userEvent.setup();
    renderAt('/agregar/snacks/buscar');
    await user.type(screen.getByRole('searchbox', { name: 'Buscar alimento' }), 'Sopaipilla');
    await user.click(screen.getByRole('button', { name: 'Crear alimento' }));
    const form = await screen.findByRole('dialog', { name: 'Nuevo alimento' });
    expect(within(form).getByLabelText('Nombre')).toHaveValue('Sopaipilla');
    await user.type(within(form).getByLabelText('Calorías'), '300');
    await user.type(within(form).getByLabelText('Proteína'), '5');
    await user.type(within(form).getByLabelText('Carbos'), '35');
    await user.type(within(form).getByLabelText('Grasa'), '15,5');
    await user.click(within(form).getByRole('button', { name: 'Guardar' }));
    const sheet = await screen.findByRole('dialog', { name: 'Sopaipilla' });
    await user.click(within(sheet).getByRole('button', { name: 'Agregar' }));
    await waitFor(async () => expect(await listEntries(today)).toHaveLength(1));
    const [e] = await listEntries(today);
    expect(e.items[0].macros.fat).toBeCloseTo(15.5);
    expect(e.items[0].foodId).toMatch(/^custom:/);
    expect((await getFood(e.items[0].foodId!))?.source).toBe('custom');
  });
});

describe('Cantidad', () => {
  const food: Food = {
    id: 'f', name: 'Galletas', per100: { kcal: 480, protein: 6, carbs: 70, fat: 20 },
    portions: [{ label: '100 g', grams: 100 }, { label: 'Porción', grams: 30 }], source: 'off', updatedAt: 1,
  };

  test('1,5 porciones de 30 g son 45 g', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<QuantitySheet food={food} onClose={() => {}} onConfirm={onConfirm} />);
    const qty = screen.getByLabelText('Cantidad');
    await user.clear(qty);
    await user.type(qty, '1,5');
    expect(screen.getByText(/45 g/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Agregar' }));
    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ name: 'Galletas', grams: 45, foodId: 'f' }));
    expect(onConfirm.mock.calls[0][0].macros.kcal).toBeCloseTo(216);
  });

  test('en gramos usa el número tal cual', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<QuantitySheet food={food} onClose={() => {}} onConfirm={onConfirm} />);
    await user.click(screen.getByRole('radio', { name: /Gramos/ }));
    const qty = screen.getByLabelText('Cantidad');
    await user.clear(qty);
    await user.type(qty, '80');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));
    expect(onConfirm.mock.calls[0][0].grams).toBe(80);
  });

  test('dos toques seguidos en Agregar confirman una sola vez', async () => {
    const user = userEvent.setup();
    let resolve!: () => void;
    const onConfirm = vi.fn(() => new Promise<void>((r) => { resolve = r; }));
    render(<QuantitySheet food={food} onClose={() => {}} onConfirm={onConfirm} />);
    const add = screen.getByRole('button', { name: 'Agregar' });
    await user.click(add);
    await user.click(add);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    resolve();
  });

  test('cantidad inválida deshabilita Agregar', async () => {
    const user = userEvent.setup();
    render(<QuantitySheet food={food} onClose={() => {}} onConfirm={() => {}} />);
    const qty = screen.getByLabelText('Cantidad');
    await user.clear(qty);
    expect(screen.getByRole('button', { name: 'Agregar' })).toBeDisabled();
  });
});
