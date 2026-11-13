import { act, render, screen } from '@testing-library/react';
import { OfflineBanner } from './OfflineBanner';

function setOnline(v: boolean) {
  Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => v });
  window.dispatchEvent(new Event(v ? 'online' : 'offline'));
}

afterEach(() => setOnline(true));

test('aparece sin conexión y desaparece al volver', () => {
  setOnline(true);
  render(<OfflineBanner />);
  expect(screen.queryByText(/Sin conexión/)).not.toBeInTheDocument();
  act(() => setOnline(false));
  expect(screen.getByText(/Sin conexión/)).toBeInTheDocument();
  act(() => setOnline(true));
  expect(screen.queryByText(/Sin conexión/)).not.toBeInTheDocument();
});
