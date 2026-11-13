import { addDays, ageOn, toLocalDate, todayLocal, weekRange } from './dates';

test('toLocalDate usa la fecha local, no UTC', () => {
  // 22:30 del 13 de noviembre en hora local (en Chile ya es 14 en UTC)
  expect(toLocalDate(new Date(2026, 10, 13, 22, 30))).toBe('2026-11-13');
});

test('todayLocal tiene formato YYYY-MM-DD', () => {
  expect(todayLocal()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
});

test('addDays cruza mes y año', () => {
  expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
});

test('addDays no se descuadra en cambio de horario', () => {
  // Chile cambia de horario en abril y septiembre
  expect(addDays('2026-04-04', 1)).toBe('2026-04-05');
  expect(addDays('2026-09-05', 1)).toBe('2026-09-06');
});

test('ageOn antes y después del cumpleaños', () => {
  expect(ageOn('1996-11-14', '2026-11-13')).toBe(29);
  expect(ageOn('1996-11-13', '2026-11-13')).toBe(30);
});

test('weekRange va de lunes a domingo', () => {
  expect(weekRange('2026-11-13')).toEqual({ from: '2026-11-09', to: '2026-11-15' });
  expect(weekRange('2026-11-15')).toEqual({ from: '2026-11-09', to: '2026-11-15' });
  expect(weekRange('2026-11-09')).toEqual({ from: '2026-11-09', to: '2026-11-15' });
});
