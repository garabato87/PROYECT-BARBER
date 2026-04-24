import { Routes, Route } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import BarberiaPage from './pages/BarberiaPage';
import ServiciosPage from './pages/ServiciosPage';
import ProfesionalesPage from './pages/ProfesionalesPage';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/barberia" element={<BarberiaPage />} />
      <Route path="/servicios" element={<ServiciosPage />} />
      <Route path="/profesionales" element={<ProfesionalesPage />} />
    </Routes>
  );
}

export default App;
