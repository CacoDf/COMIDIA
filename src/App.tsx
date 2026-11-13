import { HashRouter, Route, Routes } from 'react-router';

function Home() {
  return <h1>Comidia</h1>;
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </HashRouter>
  );
}
