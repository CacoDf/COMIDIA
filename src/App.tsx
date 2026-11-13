import { HashRouter, Route, Routes } from 'react-router';
import LabScreen from './screens/lab/LabScreen';

function Home() {
  return <h1>Comidia</h1>;
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lab" element={<LabScreen />} />
      </Routes>
    </HashRouter>
  );
}
