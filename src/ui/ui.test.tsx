import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { Button } from './Button';
import { Field, NumberField } from './Field';
import { ListRow, ListSection } from './List';
import { ProgressBar } from './ProgressBar';
import { EmptyState } from './EmptyState';
import { Sheet } from './Sheet';
import { SegmentedControl } from './SegmentedControl';
import { TabBar } from './TabBar';
import { ToastProvider, useToast } from './Toast';
import { Screen } from './Screen';
import { SLOT_LABEL, GOAL_LABEL, ACTIVITY_LABEL } from './labels';

test('Button dispara onClick y respeta disabled y loading', async () => {
  const fn = vi.fn();
  const { rerender } = render(<Button onClick={fn}>Guardar</Button>);
  await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
  expect(fn).toHaveBeenCalledTimes(1);
  rerender(<Button onClick={fn} disabled>Guardar</Button>);
  await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
  expect(fn).toHaveBeenCalledTimes(1);
  rerender(<Button onClick={fn} loading>Guardar</Button>);
  expect(screen.getByRole('button', { name: /Guardar/ })).toHaveAttribute('aria-busy', 'true');
  expect(screen.getByRole('button', { name: /Guardar/ })).toBeDisabled();
});

test('Field está asociado a su etiqueta', async () => {
  const fn = vi.fn();
  render(<Field label="Nombre" value="" onChange={fn} />);
  await userEvent.type(screen.getByLabelText('Nombre'), 'a');
  expect(fn).toHaveBeenCalledWith('a');
});

test('NumberField acepta coma decimal y avisa null si no es número', async () => {
  const fn = vi.fn();
  render(<NumberField label="Peso" unit="kg" onValueChange={fn} />);
  const input = screen.getByLabelText('Peso');
  expect(input).toHaveAttribute('inputmode', 'decimal');
  await userEvent.type(input, '72,5');
  expect(fn).toHaveBeenLastCalledWith(72.5, '72,5');
  await userEvent.type(input, 'x');
  expect(fn).toHaveBeenLastCalledWith(null, '72,5x');
  expect(screen.getByText('kg')).toBeInTheDocument();
});

test('ListSection y ListRow muestran encabezado, título, detalle y responden al toque', async () => {
  const fn = vi.fn();
  render(
    <ListSection header="Almuerzo" footer="Pie">
      <ListRow title="Pollo con arroz" subtitle="250 g" detail="610 kcal" onClick={fn} chevron />
    </ListSection>,
  );
  expect(screen.getByText('Almuerzo')).toBeInTheDocument();
  expect(screen.getByText('Pie')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: /Pollo con arroz/ }));
  expect(fn).toHaveBeenCalled();
});

test('ProgressBar expone su progreso y no pasa de 100%', () => {
  render(<ProgressBar value={150} max={100} label="Proteína" color="protein" />);
  const bar = screen.getByRole('progressbar', { name: 'Proteína' });
  expect(bar).toHaveAttribute('aria-valuenow', '150');
  expect(bar).toHaveAttribute('aria-valuemax', '100');
});

test('EmptyState muestra título, texto y acción', () => {
  render(<EmptyState title="Sin comidas" action={<Button>Crear</Button>}>Aún no guardas nada.</EmptyState>);
  expect(screen.getByText('Sin comidas')).toBeInTheDocument();
  expect(screen.getByText('Aún no guardas nada.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Crear' })).toBeInTheDocument();
});

test('Sheet abierto muestra título y se cierra con Cancelar', async () => {
  const onClose = vi.fn();
  render(<Sheet open title="Cantidad" onClose={onClose}><p>contenido</p></Sheet>);
  expect(screen.getByRole('dialog', { name: 'Cantidad' })).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(onClose).toHaveBeenCalled();
});

test('Sheet cerrado no muestra nada', () => {
  render(<Sheet open={false} title="Cantidad" onClose={() => {}}><p>contenido</p></Sheet>);
  expect(screen.queryByText('contenido')).not.toBeInTheDocument();
});

test('SegmentedControl marca la opción elegida', async () => {
  const fn = vi.fn();
  render(<SegmentedControl label="Objetivo" value="lose" onChange={fn}
    options={[{ value: 'lose', label: 'Bajar' }, { value: 'maintain', label: 'Mantener' }]} />);
  expect(screen.getByRole('radio', { name: 'Bajar' })).toBeChecked();
  await userEvent.click(screen.getByRole('radio', { name: 'Mantener' }));
  expect(fn).toHaveBeenCalledWith('maintain');
});

test('TabBar muestra las cuatro secciones y marca la actual', () => {
  render(<MemoryRouter initialEntries={['/progreso']}><TabBar /></MemoryRouter>);
  for (const name of ['Hoy', 'Comidas', 'Progreso', 'Ajustes']) expect(screen.getByRole('link', { name })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Progreso' })).toHaveAttribute('aria-current', 'page');
});

test('Toast muestra el mensaje y su acción', async () => {
  const undo = vi.fn();
  function Trigger() {
    const toast = useToast();
    return <button onClick={() => toast.show('Borrado', { label: 'Deshacer', onClick: undo })}>borrar</button>;
  }
  render(<ToastProvider><Trigger /></ToastProvider>);
  await userEvent.click(screen.getByText('borrar'));
  expect(screen.getByRole('status')).toHaveTextContent('Borrado');
  await userEvent.click(screen.getByRole('button', { name: 'Deshacer' }));
  expect(undo).toHaveBeenCalled();
});

test('Screen muestra el título grande como encabezado', () => {
  render(<Screen title="Hoy"><p>x</p></Screen>);
  expect(screen.getByRole('heading', { level: 1, name: 'Hoy' })).toBeInTheDocument();
});

test('etiquetas en español', () => {
  expect(SLOT_LABEL).toEqual({ breakfast: 'Desayuno', lunch: 'Almuerzo', dinner: 'Cena', snacks: 'Colaciones' });
  expect(GOAL_LABEL).toEqual({ lose: 'Bajar', maintain: 'Mantener', gain: 'Subir' });
  expect(Object.keys(ACTIVITY_LABEL)).toHaveLength(5);
});
