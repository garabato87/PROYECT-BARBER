import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { getAppError } from '../utils/errors';
import type { User } from '../types';
import SplashScreen from '../components/SplashScreen';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import BrandLogo from '../components/ui/BrandLogo';

const redirectByRole = (user: User, navigate: ReturnType<typeof useNavigate>) => {
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get('redirect');
  
  if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
    navigate(redirect);
    return;
  }
  
  if (user.role === 'super-admin') navigate('/superadmin');
  else if (user.role === 'admin') navigate('/admin/dashboard');
  else if (user.role === 'professional') navigate('/agenda');
  else navigate('/');
};

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

import { AuthGallery } from '../components/ui/AuthGallery';

const LoginPage: React.FC = () => {
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const { error: showError } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const user = await login(email, password);
      setLoggedInUser(user);
    } catch (err) {
      showError(getAppError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setIsSubmitting(true);
    try {
      const user = await loginWithGoogle();
      setLoggedInUser(user);
    } catch (err) {
      showError(getAppError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loggedInUser) {
    return <SplashScreen finishLoading={() => redirectByRole(loggedInUser, navigate)} />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Brand Side - Hidden on Mobile */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-black flex-col justify-between p-12">
        <AuthGallery />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-accent/10 backdrop-blur-[2px]" />

        <div className="relative z-10 flex items-center gap-3">
          <BrandLogo variant="dark" className="h-10" />
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="font-heading text-5xl font-bold leading-tight text-white mb-6">
            Gestión inteligente<br />para tu <span className="text-accent">salón.</span>
          </h2>
          <p className="text-lg text-white/80 mb-8">
            Administrá turnos, profesionales y servicios desde un solo lugar. Simple, rápido y profesional.
          </p>
          <div className="space-y-4">
            {['Agenda en tiempo real', 'Múltiples profesionales', 'Panel de administración', 'Reservas online para clientes'].map((f, i) => (
              <motion.div 
                key={f}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex items-center gap-3 text-white/90"
              >
                <div className="h-2 w-2 rounded-full bg-accent" />
                <span className="font-medium">{f}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="relative z-10 text-sm font-medium text-white/50"
        >
          © 2026 VANITY
        </motion.p>
      </div>

      {/* Form Side */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
        {/* Mobile Background Elements */}
        <div className="absolute top-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-accent/5 blur-[120px] lg:hidden" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-10">
            <BrandLogo className="h-10" />
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h1 className="font-heading text-3xl font-bold text-foreground mb-2">Bienvenido de vuelta</h1>
            <p className="text-text-secondary">
              ¿No tenés cuenta?{' '}
              <button 
                type="button"
                onClick={() => navigate({ pathname: '/register', search: window.location.search })}
                className="font-semibold text-accent hover:text-accent-hover transition-colors focus:outline-none"
              >
                Registrate gratis
              </button>
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-foreground ml-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted">
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nombre@correo.com"
                  required
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-glass-border bg-surface py-3 pl-11 pr-4 text-sm text-foreground transition-all placeholder:text-text-muted hover:border-accent/50 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent-glow disabled:opacity-50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-foreground ml-1">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-glass-border bg-surface py-3 pl-11 pr-4 text-sm text-foreground transition-all placeholder:text-text-muted hover:border-accent/50 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent-glow disabled:opacity-50"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-sm font-medium text-text-secondary hover:text-accent transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <motion.button 
              type="submit" 
              disabled={isSubmitting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-accent py-3.5 text-sm font-bold text-on-primary shadow-lg shadow-glow transition-all hover:bg-accent-hover disabled:opacity-70 disabled:hover:scale-100 outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              {isSubmitting ? 'Ingresando...' : 'Iniciar sesión'}
              {!isSubmitting && <ArrowRight size={18} />}
            </motion.button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-glass-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-4 text-text-muted font-medium">o continuá con</span>
            </div>
          </div>

          <motion.button 
            type="button" 
            onClick={handleGoogle}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-glass-border bg-surface py-3.5 text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-surface-hover hover:border-accent/30"
          >
            <GoogleIcon />
            <span>Continuar con Google</span>
          </motion.button>

        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
