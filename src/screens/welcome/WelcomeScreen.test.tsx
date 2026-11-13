import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import WelcomeScreen from './WelcomeScreen';
import { resetDb } from '../../db/db';
import { getProfile, latestWeight } from '../../db/repo';
import { todayLocal } from '../../domain/dates';

const thirtyYearsAgo = `${new Date().getFullYear() - 30}-01-01`;

function renderWelcome() {
  return render(
    <MemoryRouter initialEntries={['/bienvenida']}>
      <Routes>
        <Route path="/bienvenida" element={<WelcomeScreen />} />
        <Route path="/" element={<p>pantalla hoy</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function fillBase(user: ReturnType<typeof userEvent.setup>, { weight = '80,0', height = '180' } = {}) {
  await user.click(screen.getByRole('radio', { name: 'Hombre' }));
  const birth = screen.getByLabelText('Nacimiento');
  await user.clear(birth);
  await user.type(birth, thirtyYearsAgo);
  if (height) await user.type(screen.getByLabelText('Altura'), height);
  if (weight) await user.type(screen.getByLabelText('Peso'), weight);
  await user.click(screen.getByRole('radio', { name: /Moderado/ }));
  await user.click(screen.getByRole('radio', { name: 'Bajar' }));
  await user.click(screen.getByRole('radio', { name: '0,5 kg' }));
}

beforeEach(async () => {
  await resetDb();
});

test('muestra las metas calculadas y al empezar guarda perfil y peso', async () => {
  const user = userEvent.setup();
  renderWelcome();
  expect(screen.getByRole('heading', { level: 1, name: 'Bienvenido a Comidia' })).toBeInTheDocument();
  await fillBase(user);
  const metas = screen.getByRole('region', { name: 'Tus metas diarias' });
  expect(metas).toHaveTextContent('2.209');
  expect(metas).toHaveTextContent('160 g');
  expect(metas).toHaveTextContent('255 g');
  expect(metas).toHaveTextContent('61 g');
  await user.click(screen.getByRole('button', { name: 'Empezar' }));
  expect(await screen.findByText('pantalla hoy')).toBeInTheDocument();
  expect(await getProfile()).toMatchObject({ sex: 'male', heightCm: 180, activity: 'moderate', goal: 'lose', rateKgPerWeek: 0.5 });
  expect(await latestWeight()).toMatchObject({ date: todayLocal(), kg: 80 });
});

test('avisa cuando la meta queda en el piso del metabolismo basal', async () => {
  const user = userEvent.setup();
  renderWelcome();
  await user.click(screen.getByRole('radio', { name: 'Mujer' }));
  const birth = screen.getByLabelText('Nacimiento');
  await user.clear(birth);
  await user.type(birth, thirtyYearsAgo);
  await user.type(screen.getByLabelText('Altura'), '165');
  await user.type(screen.getByLabelText('Peso'), '60');
  await user.click(screen.getByRole('radio', { name: /Sedentario/ }));
  await user.click(screen.getByRole('radio', { name: 'Bajar' }));
  await user.click(screen.getByRole('radio', { name: '0,75 kg' }));
  expect(screen.getByText(/no baja de tu metabolismo basal/)).toBeInTheDocument();
});

test('mantener oculta el ritmo', async () => {
  const user = userEvent.setup();
  renderWelcome();
  await user.click(screen.getByRole('radio', { name: 'Mantener' }));
  expect(screen.queryByRole('radio', { name: '0,5 kg' })).not.toBeInTheDocument();
});

test('no se puede empezar sin altura o peso', async () => {
  const user = userEvent.setup();
  renderWelcome();
  await fillBase(user, { weight: '' });
  expect(screen.getByRole('button', { name: 'Empezar' })).toBeDisabled();
  await user.type(screen.getByLabelText('Peso'), '80');
  await waitFor(() => expect(screen.getByRole('button', { name: 'Empezar' })).toBeEnabled());
});
