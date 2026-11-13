import { HashRouter, Navigate, Outlet, Route, Routes } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { getProfile } from './db/repo';
import { Screen } from './ui/Screen';
import { TabBar } from './ui/TabBar';
import { ToastProvider } from './ui/Toast';
import LabScreen from './screens/lab/LabScreen';
import WelcomeScreen from './screens/welcome/WelcomeScreen';
import './ui/ui.css';

/** Pantalla provisoria hasta que su tarea la implemente. */
function Pending({ title, tabbar = true }: { title: string; tabbar?: boolean }) {
  return (
    <Screen title={title} tabbar={tabbar}>
      <p className="t-subhead c-secondary">En construcción.</p>
    </Screen>
  );
}

/** Exige un perfil: sin perfil manda a la bienvenida. */
function RequireProfile() {
  const profile = useLiveQuery(async () => (await getProfile()) ?? null, []);
  if (profile === undefined) return null;
  if (profile === null) return <Navigate to="/bienvenida" replace />;
  return <Outlet />;
}

function WithTabBar() {
  return (
    <>
      <Outlet />
      <TabBar />
    </>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/bienvenida" element={<WelcomeScreen />} />
      <Route path="/lab" element={<LabScreen />} />
      <Route element={<RequireProfile />}>
        <Route element={<WithTabBar />}>
          <Route path="/" element={<Pending title="Hoy" />} />
          <Route path="/comidas" element={<Pending title="Comidas" />} />
          <Route path="/progreso" element={<Pending title="Progreso" />} />
          <Route path="/ajustes" element={<Pending title="Ajustes" />} />
        </Route>
        <Route path="/agregar/:slot" element={<Pending title="Agregar" tabbar={false} />} />
        <Route path="/agregar/:slot/texto" element={<Pending title="Escribir" tabbar={false} />} />
        <Route path="/agregar/:slot/foto" element={<Pending title="Foto" tabbar={false} />} />
        <Route path="/agregar/:slot/codigo" element={<Pending title="Código" tabbar={false} />} />
        <Route path="/agregar/:slot/buscar" element={<Pending title="Buscar" tabbar={false} />} />
        <Route path="/agregar/:slot/mis-comidas" element={<Pending title="Mis comidas" tabbar={false} />} />
        <Route path="/revision" element={<Pending title="Revisión" tabbar={false} />} />
        <Route path="/sugerencias" element={<Pending title="Sugerencias" tabbar={false} />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </HashRouter>
  );
}
