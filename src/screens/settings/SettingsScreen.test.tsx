import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import SettingsScreen from './SettingsScreen';
import { ToastProvider } from '../../ui/Toast';
import { resetDb } from '../../db/db';
import { saveProfile, setWeight } from '../../db/repo';
import { todayLocal } from '../../domain/dates';

beforeEach(async () => {
  await resetDb();
  await saveProfile({ sex: 'female', birthDate: '1998-05-10', heightCm: 165, activity: 'light', goal: 'maintain', rateKgPerWeek: 0.5 });
  await setWeight(todayLocal(), 60);
});

test('Ajustes se abre completo: metas, perfil, IA y respaldo', async () => {
  render(<MemoryRouter><ToastProvider><SettingsScreen /></ToastProvider></MemoryRouter>);
  expect(screen.getByRole('heading', { level: 1, name: 'Ajustes' })).toBeInTheDocument();
  expect(await screen.findByRole('region', { name: 'Tus metas diarias' })).toBeInTheDocument();
  expect(await screen.findByRole('button', { name: 'Guardar perfil' })).toBeInTheDocument();
  expect(screen.getByRole('radio', { name: 'Mujer' })).toBeChecked();
  expect(await screen.findByLabelText('Key de Gemini')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Exportar respaldo' })).toBeInTheDocument();
});
