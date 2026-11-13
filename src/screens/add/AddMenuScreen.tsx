import { Navigate, useNavigate } from 'react-router';
import { BookMarked, Camera, ChevronLeft, PenLine, ScanBarcode, Search } from 'lucide-react';
import { Screen } from '../../ui/Screen';
import { BarButton } from '../../ui/Button';
import { ListRow, ListSection } from '../../ui/List';
import { SLOT_LABEL } from '../../ui/labels';
import { useAi } from '../../state/useAi';
import { useAddContext } from './useAddContext';

const icon = { size: 22, strokeWidth: 1.9 } as const;

export default function AddMenuScreen() {
  const navigate = useNavigate();
  const { slot, qs, to } = useAddContext();
  const ai = useAi();
  if (!slot) return <Navigate to="/" replace />;
  const aiOff = !ai.ready;

  return (
    <Screen
      title={`Agregar a ${SLOT_LABEL[slot]}`}
      large={false}
      tabbar={false}
      leading={
        <BarButton onClick={() => navigate(`/${qs}`)}>
          <ChevronLeft size={24} strokeWidth={2.2} aria-hidden="true" /> Hoy
        </BarButton>
      }
    >
      <div style={{ height: 16 }} />
      <ListSection
        header="Con IA"
        footer={aiOff && !ai.loading ? 'Para escribir o usar fotos, agrega tu key de Gemini en Ajustes.' : 'Revisas los números antes de guardar.'}
      >
        <ListRow leading={<PenLine {...icon} />} title="Escribir" subtitle="Cuéntame qué comiste" chevron disabled={aiOff} onClick={() => navigate(to('texto'))} />
        <ListRow leading={<Camera {...icon} />} title="Foto" subtitle="Sácale una foto al plato" chevron disabled={aiOff} onClick={() => navigate(to('foto'))} />
      </ListSection>
      <ListSection header="Sin IA">
        <ListRow leading={<ScanBarcode {...icon} />} title="Código de barras" subtitle="Escanea un producto envasado" chevron onClick={() => navigate(to('codigo'))} />
        <ListRow leading={<Search {...icon} />} title="Buscar" subtitle="Alimentos y productos" chevron onClick={() => navigate(to('buscar'))} />
        <ListRow leading={<BookMarked {...icon} />} title="Mis comidas" subtitle="Lo que guardaste antes" chevron onClick={() => navigate(to('mis-comidas'))} />
      </ListSection>
    </Screen>
  );
}
