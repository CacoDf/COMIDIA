import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useTargets } from './useTargets';
import { TargetsCard } from '../screens/settings/TargetsCard';
import { resetDb } from '../db/db';
import { getProfile, saveProfile, setWeight } from '../db/repo';
import { todayLocal } from '../domain/dates';
import type { Profile } from '../domain/types';

const profile: Profile = {
  sex: 'male', birthDate: `${new Date().getFullYear() - 30}-01-01`, heightCm: 180, activity: 'moderate', goal: 'lose', rateKgPerWeek: 0.5,
};

function Probe() {
  const t = useTargets();
  return <p data-testid="probe">{t ? `${t.kcal}|${t.manual}` : 'none'}</p>;
}

beforeEach(async () => {
  await resetDb();
});

test('useTargets usa el perfil y el último peso', async () => {
  await saveProfile(profile);
  await setWeight(todayLocal(), 80);
  render(<Probe />);
  await waitFor(() => expect(screen.getByTestId('probe')).toHaveTextContent('2209|false'));
});

test('sin peso no hay metas', async () => {
  await saveProfile(profile);
  render(<Probe />);
  await waitFor(() => expect(screen.getByTestId('probe')).toHaveTextContent('none'));
});

test('el ajuste manual se respeta y se puede volver al automático', async () => {
  const user = userEvent.setup();
  await saveProfile(profile);
  await setWeight(todayLocal(), 80);
  render(<><Probe /><TargetsCard editable /></>);
  await waitFor(() => expect(screen.getByTestId('probe')).toHaveTextContent('2209|false'));

  await user.click(await screen.findByRole('button', { name: 'Ajustar a mano' }));
  const kcal = screen.getByLabelText('Calorías');
  await user.clear(kcal);
  await user.type(kcal, '2000');
  await user.click(screen.getByRole('button', { name: 'Guardar metas' }));
  await waitFor(() => expect(screen.getByTestId('probe')).toHaveTextContent('2000|true'));

  await user.click(screen.getByRole('button', { name: 'Volver al cálculo automático' }));
  await waitFor(() => expect(screen.getByTestId('probe')).toHaveTextContent('2209|false'));
  expect((await getProfile())?.manualTargets).toBeUndefined();
});
