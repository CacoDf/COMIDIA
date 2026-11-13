import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import PhotoScreen, { nameFromItems } from './PhotoScreen';
import { DraftProvider, useDraft } from '../../state/DraftContext';
import { db, resetDb } from '../../db/db';
import { patchSettings } from '../../db/repo';
import { AiError } from '../../services/gemini';
import * as gemini from '../../services/gemini';
import * as image from '../../lib/image';
import { fitWithin } from '../../lib/image';

function ReviewProbe() {
  const { draft } = useDraft();
  return <p data-testid="draft">{draft ? `${draft.name}|${draft.source}|${draft.slot}` : 'none'}</p>;
}

function renderPhoto() {
  return render(
    <MemoryRouter initialEntries={['/agregar/dinner/foto']}>
      <DraftProvider>
        <Routes>
          <Route path="/agregar/:slot/foto" element={<PhotoScreen />} />
          <Route path="/revision" element={<ReviewProbe />} />
        </Routes>
      </DraftProvider>
    </MemoryRouter>,
  );
}

const plato = new File(['x'], 'plato.jpg', { type: 'image/jpeg' });
const items = [
  { name: 'Lomo a lo pobre', grams: 200, macros: { kcal: 500, protein: 40, carbs: 10, fat: 30 } },
  { name: 'Papas fritas', grams: 150, macros: { kcal: 450, protein: 5, carbs: 50, fat: 25 } },
];

beforeEach(async () => {
  await resetDb();
  await patchSettings({ geminiKey: 'K', geminiModel: 'm' });
  vi.restoreAllMocks();
  vi.spyOn(image, 'downscaleToJpegBase64').mockResolvedValue('B64');
  URL.createObjectURL = vi.fn(() => 'blob:preview');
  URL.revokeObjectURL = vi.fn();
});

test('fitWithin reduce el lado mayor y no agranda', () => {
  expect(fitWithin(4032, 3024, 1024)).toEqual({ w: 1024, h: 768 });
  expect(fitWithin(3024, 4032, 1024)).toEqual({ w: 768, h: 1024 });
  expect(fitWithin(800, 600, 1024)).toEqual({ w: 800, h: 600 });
});

test('nameFromItems junta los dos primeros', () => {
  expect(nameFromItems(items)).toBe('Lomo a lo pobre y papas fritas');
  expect(nameFromItems(items.slice(0, 1))).toBe('Lomo a lo pobre');
});

test('ofrece cámara y galería', async () => {
  renderPhoto();
  const cam = await screen.findByLabelText('Tomar foto');
  expect(cam).toHaveAttribute('capture', 'environment');
  expect(cam).toHaveAttribute('accept', 'image/*');
  expect(screen.getByLabelText('Elegir de la galería')).not.toHaveAttribute('capture');
});

test('con foto y nota calcula y va a revisión sin guardar la imagen', async () => {
  const user = userEvent.setup();
  const spy = vi.spyOn(gemini, 'estimateFromPhoto').mockResolvedValue(items);
  renderPhoto();
  await user.upload(await screen.findByLabelText('Tomar foto'), plato);
  expect(await screen.findByRole('img', { name: 'Foto de tu comida' })).toBeInTheDocument();
  await user.type(screen.getByLabelText('Nota (opcional)'), 'sin aceite');
  await user.click(screen.getByRole('button', { name: 'Calcular' }));
  expect(await screen.findByTestId('draft')).toHaveTextContent('Lomo a lo pobre y papas fritas|photo|dinner');
  expect(spy).toHaveBeenCalledWith({ key: 'K', model: 'm' }, 'B64', 'sin aceite');
  const tables = await Promise.all(db.tables.map((t) => t.toArray()));
  expect(JSON.stringify(tables)).not.toContain('B64');
});

test('ante un error conserva la foto y la nota', async () => {
  const user = userEvent.setup();
  vi.spyOn(gemini, 'estimateFromPhoto').mockRejectedValue(new AiError('no-food'));
  renderPhoto();
  await user.upload(await screen.findByLabelText('Elegir de la galería'), plato);
  await user.type(await screen.findByLabelText('Nota (opcional)'), 'es una cazuela');
  await user.click(screen.getByRole('button', { name: 'Calcular' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(/No encontré comida/);
  expect(screen.getByRole('img', { name: 'Foto de tu comida' })).toBeInTheDocument();
  expect(screen.getByLabelText('Nota (opcional)')).toHaveValue('es una cazuela');
});
