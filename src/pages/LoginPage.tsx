import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import type { User } from '../hooks/useAuth';
import SplashScreen from '../components/SplashScreen';
import './Auth.css';

const FIREBASE_ERRORS: Record<string, string> = {
  'auth/invalid-credential':     'Correo o contraseña incorrectos.',
  'auth/user-not-found':         'No existe una cuenta con ese correo.',
  'auth/wrong-password':         'Contraseña incorrecta.',
  'auth/invalid-email':          'El correo ingresado no es válido.',
  'auth/too-many-requests':      'Demasiados intentos fallidos. Intentá más tarde.',
  'auth/user-disabled':          'Esta cuenta fue deshabilitada.',
  'auth/network-request-failed': 'Error de red. Revisá tu conexión.',
};

const getError = (err: unknown) => {
  if (err && typeof err === 'object' && 'code' in err) {
    return FIREBASE_ERRORS[(err as { code: string }).code] ?? 'Error inesperado. Intentá de nuevo.';
  }
  return 'Error inesperado. Intentá de nuevo.';
};

const redirectByRole = (user: User, navigate: ReturnType<typeof useNavigate>) => {
  if (user.role === 'super-admin') navigate('/superadmin');
  else if (user.role === 'admin') navigate('/admin/dashboard');
  else if (user.role === 'professional') navigate('/agenda');
  else navigate('/');
};

const ScissorsIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
    <line x1="20" y1="4" x2="8.12" y2="15.88"/>
    <line x1="14.47" y1="14.48" x2="20" y2="20"/>
    <line x1="8.12" y1="8.12" x2="12" y2="12"/>
  </svg>
);

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const LoginPage: React.FC = () => {
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [error, setError]         = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const user = await login(email, password);
      setLoggedInUser(user);
    } catch (err) {
      setError(getError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const user = await loginWithGoogle();
      setLoggedInUser(user);
    } catch (err) {
      setError(getError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loggedInUser) {
    return <SplashScreen finishLoading={() => redirectByRole(loggedInUser, navigate)} />;
  }

  return (
    <div className="auth-wrapper">
      {/* ── Brand Panel ── */}
      <div className="auth-brand">
        <video 
          className="auth-bg-video"
          src="https://assets.mixkit.co/videos/preview/mixkit-barber-cutting-hair-with-scissors-44810-large.mp4" 
          autoPlay 
          loop 
          muted 
          playsInline
        />
        <div className="auth-brand-deco auth-brand-deco-1" />
        <div className="auth-brand-deco auth-brand-deco-2" />

        <div className="auth-brand-logo">
          <div className="auth-brand-logo-icon">
            <ScissorsIcon />
          </div>
          <span className="auth-brand-logo-text">SDGP</span>
        </div>

        <div className="auth-brand-hero">
          <div className="auth-brand-scissors">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="rgba(251,191,36,0.15)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
              <line x1="20" y1="4" x2="8.12" y2="15.88"/>
              <line x1="14.47" y1="14.48" x2="20" y2="20"/>
              <line x1="8.12" y1="8.12" x2="12" y2="12"/>
            </svg>
          </div>

          <h2 className="auth-brand-title">
            Gestión inteligente<br />para tu <span>barbería.</span>
          </h2>

          <p className="auth-brand-subtitle">
            Administrá turnos, profesionales y servicios desde un solo lugar. Simple, rápido y profesional.
          </p>

          <div className="auth-brand-features">
            {['Agenda en tiempo real', 'Múltiples profesionales', 'Panel de administración', 'Reservas online para clientes'].map(f => (
              <div className="auth-brand-feature" key={f}>
                <div className="auth-brand-feature-dot" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <motion.p 
          className="auth-brand-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
        >
          © 2026 SDGP · Sistema de Gestión de Peluquerías
        </motion.p>
      </div>

      {/* ── Form Panel ── */}
      <div className="auth-panel">
        <motion.div 
          className="auth-form-container"
          style={{ animation: 'none' }}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, staggerChildren: 0.1, delayChildren: 0.1 }}
        >
          <motion.div 
            className="auth-form-header" 
            style={{ animation: 'none' }}
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0 }
            }}
            initial="hidden"
            animate="show"
          >
            <h1>Bienvenido de vuelta</h1>
            <p>¿No tenés cuenta? <span onClick={() => navigate('/register')}>Registrate gratis</span></p>
          </motion.div>

          <form onSubmit={handleLogin}>
            <motion.div 
              className="auth-field" 
              style={{ animation: 'none' }}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }}
              initial="hidden"
              animate="show"
              transition={{ delay: 0.2 }}
            >
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="nombre@correo.com"
                required
                disabled={isSubmitting}
              />
            </motion.div>

            <motion.div 
              className="auth-field" 
              style={{ animation: 'none' }}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }}
              initial="hidden"
              animate="show"
              transition={{ delay: 0.3 }}
            >
              <label>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isSubmitting}
              />
            </motion.div>

            <motion.div 
              className="auth-forgot" 
              style={{ animation: 'none' }}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }}
              initial="hidden"
              animate="show"
              transition={{ delay: 0.4 }}
            >
              <span onClick={() => navigate('/forgot-password')}>¿Olvidaste tu contraseña?</span>
            </motion.div>

            {error && <p className="auth-error">{error}</p>}

            <motion.button 
              type="submit" 
              className="auth-button" 
              disabled={isSubmitting}
              style={{ animation: 'none' }}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }}
              initial="hidden"
              animate="show"
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSubmitting ? 'Ingresando...' : 'Iniciar sesión'}
            </motion.button>
          </form>

          <motion.div 
            className="auth-divider"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <span>o continuá con</span>
          </motion.div>

          <motion.div 
            className="auth-social"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <button type="button" className="auth-social-btn" onClick={handleGoogle}>
              <GoogleIcon />
              <span>Continuar con Google</span>
            </button>
          </motion.div>

          <p className="auth-switch">
            ¿Primera vez? <span onClick={() => navigate('/register')}>Creá tu cuenta</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
