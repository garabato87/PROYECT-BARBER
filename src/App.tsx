import { useState, Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import DashboardPage from './pages/DashboardPage';
import MiLocalPage from './pages/MiLocalPage';
import ServiciosPage from './pages/ServiciosPage';
import ProfesionalesPage from './pages/ProfesionalesPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import BusinessLandingPage from './pages/BusinessLandingPage';
import BarbershopDetailsPage from './pages/BarbershopDetailsPage';
import PremiumBookingPage from './pages/PremiumBookingPage';
import ClientDashboardPage from './pages/ClientDashboardPage';
import ProfessionalAgendaPage from './pages/ProfessionalAgendaPage';
import AdminAgendaPage from './pages/AdminAgendaPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ProfilePage from './pages/ProfilePage';
import ProtectedRoute from './components/ProtectedRoute';
import SplashScreen from './components/SplashScreen';
import './App.css';

// Lazy load heavy Super Admin components for code splitting (Phase 10)
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'));
const SuperAdminLocales = lazy(() => import('./pages/SuperAdminLocales'));
const SuperAdminUsuarios = lazy(() => import('./pages/SuperAdminUsuarios'));
const SuperAdminSuscripciones = lazy(() => import('./pages/SuperAdminSuscripciones'));
const SuperAdminReportes = lazy(() => import('./pages/SuperAdminReportes'));
const SuperAdminAudit = lazy(() => import('./pages/SuperAdminAudit'));

function App() {
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  if (isInitialLoad) {
    return <SplashScreen finishLoading={() => setIsInitialLoad(false)} />;
  }

  return (
    <MotionConfig reducedMotion="user">
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-bold text-text-muted animate-pulse">Cargando módulo...</span>
          </div>
        </div>
      }>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/para-negocios" element={<BusinessLandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/barbershop/:id" element={<BarbershopDetailsPage />} />
          <Route path="/b/:id/premium" element={<PremiumBookingPage />} />
          
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
            <Route path="/superadmin/locales" element={<SuperAdminLocales />} />
            <Route path="/superadmin/usuarios" element={<SuperAdminUsuarios />} />
            <Route path="/superadmin/suscripciones" element={<SuperAdminSuscripciones />} />
            <Route path="/superadmin/reportes" element={<SuperAdminReportes />} />
            <Route path="/superadmin/audit" element={<SuperAdminAudit />} />
          </Route>
        </Routes>
      </Suspense>
    </MotionConfig>
  );
}

export default App;
