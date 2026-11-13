import { render, screen } from '@testing-library/react';
import App from './App';
import { resetDb } from './db/db';
import { saveProfile } from './db/repo';

beforeEach(async () => {
  await resetDb();
  window.location.hash = '#/';
});

test('sin perfil redirige a la bienvenida', async () => {
  render(<App />);
  expect(await screen.findByRole('heading', { level: 1, name: 'Bienvenido a Comidia' })).toBeInTheDocument();
});

test('con perfil muestra Hoy y la barra de pestañas', async () => {
  await saveProfile({ sex: 'male', birthDate: '1996-01-01', heightCm: 180, activity: 'moderate', goal: 'lose', rateKgPerWeek: 0.5 });
  render(<App />);
  expect(await screen.findByRole('heading', { level: 1, name: 'Hoy' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Comidas' })).toBeInTheDocument();
});
