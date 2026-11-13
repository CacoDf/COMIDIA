import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { AiSettings } from './AiSettings';
import { BackupSettings } from './BackupSettings';
import { BackupReminder, shouldRemind } from '../today/BackupReminder';
import { ToastProvider } from '../../ui/Toast';
import { resetDb } from '../../db/db';
import { addEntry, getSettings, listEntries, patchSettings } from '../../db/repo';
import { exportBackup } from '../../db/backup';
import { AiError } from '../../services/gemini';
import * as gemini from '../../services/gemini';
import * as share from '../../lib/share';
import { todayLocal } from '../../domain/dates';

const DAY = 86_400_000;
const wrap = (ui: React.ReactNode) => render(<MemoryRouter><ToastProvider>{ui}</ToastProvider></MemoryRouter>);

beforeEach(async () => {
  await resetDb();
  vi.restoreAllMocks();
});

describe('IA', () => {
  test('probar una key buena la guarda y elige el modelo por defecto', async () => {
    const user = userEvent.setup();
    const test = vi.spyOn(gemini, 'testKey').mockResolvedValue();
    vi.spyOn(gemini, 'listModels').mockResolvedValue(['gemini-3.1-flash-lite', 'gemini-2.5-flash', 'gemini-3.1-flash-lite-preview']);
    wrap(<AiSettings />);
    const field = await screen.findByLabelText('Key de Gemini');
    expect(field).toHaveAttribute('type', 'password');
    await user.type(field, 'AIzaBUENA1234');
    await user.click(screen.getByRole('button', { name: 'Probar' }));
    await waitFor(async () => expect((await getSettings()).geminiKey).toBe('AIzaBUENA1234'));
    expect(test).toHaveBeenCalledWith('AIzaBUENA1234');
    expect((await getSettings()).geminiModel).toBe('gemini-3.1-flash-lite');
    expect(await screen.findByText(/••••1234/)).toBeInTheDocument();
    expect(screen.getByText(/la comparten/)).toBeInTheDocument();
  });

  test('una key rechazada muestra el error y no se guarda', async () => {
    const user = userEvent.setup();
    vi.spyOn(gemini, 'testKey').mockRejectedValue(new AiError('bad-key'));
    wrap(<AiSettings />);
    await user.type(await screen.findByLabelText('Key de Gemini'), 'mala');
    await user.click(screen.getByRole('button', { name: 'Probar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/rechazó la key/);
    expect((await getSettings()).geminiKey).toBeUndefined();
  });

  test('se puede cambiar el modelo y borrar la key', async () => {
    const user = userEvent.setup();
    await patchSettings({ geminiKey: 'AIzaXXXX9999', geminiModel: 'gemini-3.1-flash-lite' });
    vi.spyOn(gemini, 'listModels').mockResolvedValue(['gemini-3.1-flash-lite', 'gemini-2.5-flash']);
    wrap(<AiSettings />);
    const select = await screen.findByLabelText('Modelo');
    await waitFor(() => expect(within(select).getAllByRole('option')).toHaveLength(2));
    await user.selectOptions(select, 'gemini-2.5-flash');
    await waitFor(async () => expect((await getSettings()).geminiModel).toBe('gemini-2.5-flash'));
    await user.click(screen.getByRole('button', { name: 'Borrar key' }));
    await waitFor(async () => expect((await getSettings()).geminiKey).toBeUndefined());
  });
});

describe('Respaldo', () => {
  test('exportar comparte un archivo con nombre y fecha, y muestra el último respaldo', async () => {
    const user = userEvent.setup();
    const spy = vi.spyOn(share, 'shareOrDownload').mockResolvedValue('shared');
    wrap(<BackupSettings />);
    await user.click(await screen.findByRole('button', { name: 'Exportar respaldo' }));
    await waitFor(() => expect(spy).toHaveBeenCalled());
    const file = spy.mock.calls[0][0] as File;
    expect(file.name).toBe(`comidia-respaldo-${todayLocal()}.json`);
    expect(await screen.findByText(/Último respaldo: hoy/)).toBeInTheDocument();
  });

  test('importar muestra un resumen, pide confirmación y reemplaza', async () => {
    const user = userEvent.setup();
    await addEntry({ date: '2026-11-01', slot: 'lunch', name: 'vieja', items: [], source: 'manual' });
    const backup = await exportBackup();
    await resetDb();
    await addEntry({ date: '2026-11-02', slot: 'lunch', name: 'actual', items: [], source: 'manual' });
    wrap(<BackupSettings />);
    const file = new File([JSON.stringify(backup)], 'r.json', { type: 'application/json' });
    await user.upload(await screen.findByLabelText('Importar respaldo'), file);
    const dialog = await screen.findByRole('dialog', { name: 'Importar respaldo' });
    expect(dialog).toHaveTextContent('1 comida anotada');
    expect(dialog).toHaveTextContent('Esto reemplaza todos tus datos actuales');
    await user.click(within(dialog).getByRole('button', { name: 'Reemplazar' }));
    await waitFor(async () => expect(await listEntries('2026-11-01')).toHaveLength(1));
    expect(await listEntries('2026-11-02')).toHaveLength(0);
  });

  test('cancelar la importación no cambia nada', async () => {
    const user = userEvent.setup();
    const backup = await exportBackup();
    await addEntry({ date: '2026-11-02', slot: 'lunch', name: 'actual', items: [], source: 'manual' });
    wrap(<BackupSettings />);
    await user.upload(await screen.findByLabelText('Importar respaldo'), new File([JSON.stringify(backup)], 'r.json'));
    await user.click(within(await screen.findByRole('dialog', { name: 'Importar respaldo' })).getByRole('button', { name: 'Cancelar' }));
    expect(await listEntries('2026-11-02')).toHaveLength(1);
  });

  test.each([
    ['no es json', /no es un respaldo/],
    ['{"app":"otra"}', /no es de Comidia/],
    ['{"app":"comidia","formatVersion":9}', /versión más nueva/],
    ['{"app":"comidia","formatVersion":1,"exportedAt":"x","data":{"entries":"mal"}}', /está dañado/],
  ])('archivo malo (%s) muestra su mensaje y no toca los datos', async (text, message) => {
    const user = userEvent.setup();
    await addEntry({ date: '2026-11-02', slot: 'lunch', name: 'actual', items: [], source: 'manual' });
    wrap(<BackupSettings />);
    await user.upload(await screen.findByLabelText('Importar respaldo'), new File([text], 'r.json'));
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(await listEntries('2026-11-02')).toHaveLength(1);
  });
});

describe('Recordatorio de respaldo', () => {
  const now = Date.UTC(2026, 10, 13);
  test.each([
    [{ lastExportAt: now - 31 * DAY }, true],
    [{ lastExportAt: now - 10 * DAY }, false],
    [{ firstEntryDate: '2026-10-01' }, true],
    [{ firstEntryDate: '2026-11-10' }, false],
    [{}, false],
    [{ lastExportAt: now - 40 * DAY, reminderDismissedAt: now - 2 * DAY }, false],
    [{ lastExportAt: now - 40 * DAY, reminderDismissedAt: now - 8 * DAY }, true],
  ])('shouldRemind(%o) = %s', (input, expected) => {
    expect(shouldRemind({ ...input, now })).toBe(expected);
  });

  test('aparece y se puede descartar', async () => {
    const user = userEvent.setup();
    await patchSettings({ lastExportAt: Date.now() - 45 * DAY });
    wrap(<BackupReminder />);
    expect(await screen.findByText(/Hace tiempo que no respaldas/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ahora no' }));
    await waitFor(() => expect(screen.queryByText(/Hace tiempo que no respaldas/)).not.toBeInTheDocument());
    expect((await getSettings()).reminderDismissedAt).toBeGreaterThan(0);
  });
});
