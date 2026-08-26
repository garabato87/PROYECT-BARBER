import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import MiLocalPage from './pages/MiLocalPage';
import ServiciosPage from './pages/ServiciosPage';
import ProfesionalesPage from './pages/ProfesionalesPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import BarbershopDetailsPage from './pages/BarbershopDetailsPage';
import ClientDashboardPage from './pages/ClientDashboardPage';
import ProfessionalAgendaPage from './pages/ProfessionalAgendaPage';
import AdminAgendaPage from './pages/AdminAgendaPage';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SuperAdminUsuarios from './pages/SuperAdminUsuarios';
import SuperAdminSuscripciones from './pages/SuperAdminSuscripciones';
import SuperAdminReportes from './pages/SuperAdminReportes';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ProfilePage from './pages/ProfilePage';
import ProtectedRoute from './components/ProtectedRoute';
import SplashScreen from './components/SplashScreen';
import './App.css';

function App() {
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  if (isInitialLoad) {
    return <SplashScreen finishLoading={() => setIsInitialLoad(false)} />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/barbershop/:id" element={<BarbershopDetailsPage />} />
      
      {/* Client Routes */}
      <Route element={<ProtectedRoute allowedRoles={['client', 'admin', 'super-admin']} />}>
        <Route path="/client/dashboard" element={<ClientDashboardPage />} />
      </Route>

      {/* Professional Routes */}
      <Route element={<ProtectedRoute allowedRoles={['professional', 'admin', 'super-admin']} />}>
        <Route path="/agenda" element={<ProfessionalAgendaPage />} />
      </Route>

      {/* Admin Routes (Local Owner) */}
      <Route element={<ProtectedRoute allowedRoles={['admin', 'super-admin']} />}>
        <Route path="/admin/dashboard" element={<DashboardPage />} />
        <Route path="/admin/mi-local" element={<MiLocalPage />} />
        <Route path="/admin/servicios" element={<ServiciosPage />} />
        <Route path="/admin/profesionales" element={<ProfesionalesPage />} />
        <Route path="/admin/agenda" element={<AdminAgendaPage />} />
      </Route>

      {/* Profile (all authenticated roles) */}
      <Route element={<ProtectedRoute allowedRoles={['super-admin', 'admin', 'professional', 'client']} />}>
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Super Admin Routes (System Owner) */}
      <Route element={<ProtectedRoute allowedRoles={['super-admin']} />}>
        <Route path="/superadmin" element={<SuperAdminDashboard />} />
        <Route path="/superadmin/usuarios" element={<SuperAdminUsuarios />} />
        <Route path="/superadmin/suscripciones" element={<SuperAdminSuscripciones />} />
        <Route path="/superadmin/reportes" element={<SuperAdminReportes />} />
      </Route>
    </Routes>
  );
}

export default App;
