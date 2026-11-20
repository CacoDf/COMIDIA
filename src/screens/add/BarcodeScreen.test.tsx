import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import BarcodeScreen from './BarcodeScreen';
import { ToastProvider } from '../../ui/Toast';
import { resetDb } from '../../db/db';
import { getFoodByBarcode, listEntries, patchSettings, upsertFood } from '../../db/repo';
import { todayLocal } from '../../domain/dates';
import * as off from '../../services/openFoodFacts';
import * as gemini from '../../services/gemini';
import * as image from '../../lib/image';
import * as engine from '../../lib/barcodeEngine';
import { getSettings } from '../../db/repo';
import type { Food } from '../../domain/types';

vi.mock('../../ui/BarcodeScanner', () => ({
  BarcodeScanner: ({ onDetected, onUnavailable }: { onDetected: (c: string) => void; onUnavailable: (r: string) => void }) => (
    <div>
      <button onClick={() => onDetected((globalThis as { __code?: string }).__code ?? '')}>simular lectura</button>
      <button onClick={() => onUnavailable('denied')}>simular denegada</button>
    </div>
  ),
}));

const today = todayLocal();
const CODE = '7802900004873';
const setCode = (c: string) => { (globalThis as { __code?: string }).__code = c; };

const snack: Food = {
  id: `off:${CODE}`, name: 'Protein+ Snack', barcode: CODE, per100: { kcal: 380, protein: 30, carbs: 40, fat: 10 },
  portions: [{ label: '100 g', grams: 100 }, { label: 'Porción', grams: 40 }], source: 'off', updatedAt: 1,
};

function renderScreen() {
  return render(
    <MemoryRouter initialEntries={['/agregar/snacks/codigo']}>
      <ToastProvider>
        <Routes>
          <Route path="/agregar/:slot/codigo" element={<BarcodeScreen />} />
          <Route path="*" element={<p>otra pantalla</p>} />
        </Routes>
      </ToastProvider>
    </MemoryRouter>,
  );
}

beforeEach(async () => {
  await resetDb();
  vi.restoreAllMocks();
  await patchSettings({ scanMode: 'live' }); // las pruebas de abajo usan el escáner en vivo simulado
  setCode(CODE);
  URL.createObjectURL = vi.fn(() => 'blob:x');
  URL.revokeObjectURL = vi.fn();
});

test('un código ya guardado abre la cantidad sin ir a la red', async () => {
  const user = userEvent.setup();
  await upsertFood(snack);
  const spy = vi.spyOn(off, 'fetchProduct');
  renderScreen();
  await user.click(await screen.findByRole('button', { name: 'simular lectura' }));
  expect(await screen.findByRole('dialog', { name: 'Protein+ Snack' })).toBeInTheDocument();
  expect(spy).not.toHaveBeenCalled();
});

test('un código nuevo se busca, se guarda y se anota como código', async () => {
  const user = userEvent.setup();
  vi.spyOn(off, 'fetchProduct').mockResolvedValue(snack);
  renderScreen();
  await user.click(await screen.findByRole('button', { name: 'simular lectura' }));
  const sheet = await screen.findByRole('dialog', { name: 'Protein+ Snack' });
  expect(await getFoodByBarcode(CODE)).toBeTruthy();
  await user.click(within(sheet).getByRole('button', { name: 'Agregar' }));
  await waitFor(async () => expect(await listEntries(today)).toHaveLength(1));
  expect((await listEntries(today))[0]).toMatchObject({ source: 'barcode', slot: 'snacks', name: 'Protein+ Snack' });
  expect((await listEntries(today))[0].items[0].grams).toBe(40);
});

test('producto no encontrado ofrece fotografiar la tabla o ingresar a mano', async () => {
  const user = userEvent.setup();
  await patchSettings({ geminiKey: 'K', geminiModel: 'm' });
  vi.spyOn(off, 'fetchProduct').mockResolvedValue(null);
  renderScreen();
  await user.click(await screen.findByRole('button', { name: 'simular lectura' }));
  expect(await screen.findByText('No encontramos este producto')).toBeInTheDocument();
  expect(await screen.findByLabelText('Fotografiar la tabla nutricional')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Ingresar a mano' })).toBeInTheDocument();
});

test('sin key no ofrece fotografiar la tabla', async () => {
  const user = userEvent.setup();
  vi.spyOn(off, 'fetchProduct').mockResolvedValue(null);
  renderScreen();
  await user.click(await screen.findByRole('button', { name: 'simular lectura' }));
  expect(await screen.findByRole('button', { name: 'Ingresar a mano' })).toBeInTheDocument();
  expect(screen.queryByLabelText('Fotografiar la tabla nutricional')).not.toBeInTheDocument();
});

test('leer la etiqueta con IA crea el producto con su código y queda para la próxima', async () => {
  const user = userEvent.setup();
  await patchSettings({ geminiKey: 'K', geminiModel: 'm' });
  vi.spyOn(off, 'fetchProduct').mockResolvedValue(null);
  vi.spyOn(image, 'downscaleToJpegBase64').mockResolvedValue('B64');
  vi.spyOn(gemini, 'readLabel').mockResolvedValue({ name: 'Galletas de avena', per100: { kcal: 450, protein: 7, carbs: 65, fat: 17 }, servingGrams: 30 });
  renderScreen();
  await user.click(await screen.findByRole('button', { name: 'simular lectura' }));
  await user.upload(await screen.findByLabelText('Fotografiar la tabla nutricional'), new File(['x'], 't.jpg', { type: 'image/jpeg' }));
  const form = await screen.findByRole('dialog', { name: 'Revisa la etiqueta' });
  expect(within(form).getByLabelText('Nombre')).toHaveValue('Galletas de avena');
  expect(within(form).getByLabelText('Calorías')).toHaveValue('450');
  await user.click(within(form).getByRole('button', { name: 'Guardar' }));
  expect(await screen.findByRole('dialog', { name: 'Galletas de avena' })).toBeInTheDocument();
  expect(await getFoodByBarcode(CODE)).toMatchObject({ source: 'label', name: 'Galletas de avena' });
});

test('cámara denegada permite escribir el código', async () => {
  const user = userEvent.setup();
  vi.spyOn(off, 'fetchProduct').mockResolvedValue(snack);
  renderScreen();
  await user.click(await screen.findByRole('button', { name: 'simular denegada' }));
  expect(await screen.findByText(/No hay acceso a la cámara/)).toBeInTheDocument();
  await user.type(screen.getByLabelText('Código'), CODE);
  await user.click(screen.getByRole('button', { name: 'Buscar código' }));
  expect(await screen.findByRole('dialog', { name: 'Protein+ Snack' })).toBeInTheDocument();
});

test('sin conexión y código desconocido muestra su mensaje', async () => {
  const user = userEvent.setup();
  vi.spyOn(off, 'fetchProduct').mockRejectedValue(new off.OffError('offline'));
  renderScreen();
  await user.click(await screen.findByRole('button', { name: 'simular lectura' }));
  expect(await screen.findByText(/Sin conexión/)).toBeInTheDocument();
});

describe('código por foto (sin permisos de cámara)', () => {
  beforeEach(async () => {
    await patchSettings({ scanMode: undefined });
  });

  test('por defecto ofrece sacar foto al código y no abre la cámara en vivo', async () => {
    renderScreen();
    const input = await screen.findByLabelText('Sacar foto al código');
    expect(input).toHaveAttribute('capture', 'environment');
    expect(screen.queryByRole('button', { name: 'simular lectura' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Usar cámara en vivo' })).toBeInTheDocument();
  });

  test('una foto con código legible busca el producto', async () => {
    const user = userEvent.setup();
    vi.spyOn(engine, 'detectCodeInImage').mockResolvedValue(CODE);
    vi.spyOn(off, 'fetchProduct').mockResolvedValue(snack);
    renderScreen();
    await user.upload(await screen.findByLabelText('Sacar foto al código'), new File(['x'], 'c.jpg', { type: 'image/jpeg' }));
    expect(await screen.findByRole('dialog', { name: 'Protein+ Snack' })).toBeInTheDocument();
  });

  test('una foto sin código legible lo explica', async () => {
    const user = userEvent.setup();
    vi.spyOn(engine, 'detectCodeInImage').mockResolvedValue(null);
    renderScreen();
    await user.upload(await screen.findByLabelText('Sacar foto al código'), new File(['x'], 'c.jpg', { type: 'image/jpeg' }));
    expect(await screen.findByText(/No pude leer el código/)).toBeInTheDocument();
  });

  test('elegir la cámara en vivo la abre y se recuerda', async () => {
    const user = userEvent.setup();
    renderScreen();
    await user.click(await screen.findByRole('button', { name: 'Usar cámara en vivo' }));
    expect(await screen.findByRole('button', { name: 'simular lectura' })).toBeInTheDocument();
    await waitFor(async () => expect((await getSettings()).scanMode).toBe('live'));
  });
});
