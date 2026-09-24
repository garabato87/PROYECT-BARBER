import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { Mail, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import BrandLogo from '../components/ui/BrandLogo';

import { AuthGallery } from '../components/ui/AuthGallery';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail]         = useState('');
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { sendPasswordReset } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await sendPasswordReset(email);
      setSuccess(true);
    } catch (err) {
      if (err && typeof err === 'object' && 'code' in err) {
        const code = (err as { code: string }).code;
        setError(code === 'auth/user-not-found' || code === 'auth/invalid-email'
          ? 'No encontramos una cuenta con ese correo.'
          : 'Ocurrió un error. Intentá de nuevo.');
      } else {
        setError('Ocurrió un error. Intentá de nuevo.');
      }
      setIsSubmitting(false);
    }
  };

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
            Recuperá tu<br /><span className="text-accent">cuenta.</span>
          </h2>
          <p className="text-lg text-white/80 mb-8">
            Te enviaremos un enlace a tu correo para que puedas restablecer tu contraseña de forma segura y volver a tu agenda.
          </p>
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
        <div className="absolute top-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-accent/5 blur-[120px] lg:hidden" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="flex lg:hidden items-center justify-center gap-3 mb-10">
            <BrandLogo className="h-10" />
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
              {success ? '¡Correo enviado!' : 'Recuperar contraseña'}
            </h1>
            <p className="text-text-secondary">
              ¿Recordaste tu contraseña?{' '}
              <button 
                type="button"
                onClick={() => navigate('/login')}
                className="font-semibold text-accent hover:text-accent-hover transition-colors focus:outline-none"
              >
                Volver al login
              </button>
            </p>
          </div>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-glass-border bg-surface shadow-sm"
              >
                <div className="h-16 w-16 bg-success/20 text-success rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 size={32} />
                </div>
                <p className="text-foreground font-medium mb-6">
                  Revisá tu bandeja de entrada. Te enviamos un enlace para restablecer tu contraseña.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full rounded-xl bg-surface-hover py-3.5 text-sm font-bold text-foreground transition-all hover:bg-glass-border focus:outline-none focus:ring-4 focus:ring-accent-glow"
                >
                  Volver al inicio de sesión
                </button>
              </motion.div>
            ) : (
              <motion.form 
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit} 
                className="space-y-5"
              >
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground ml-1">Email registrado</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted">
                      <Mail size={18} />
                    </div>
                    <input
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

                <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="text-sm font-medium text-danger mt-2 bg-danger/10 p-3 rounded-lg border border-danger/20">
                        {error}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-3 pt-2">
                  <motion.button 
                    type="button" 
                    onClick={() => navigate('/login')}
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-glass-border bg-surface py-3.5 text-sm font-bold text-foreground transition-all hover:bg-surface-hover hover:border-accent/50 disabled:opacity-50"
                  >
                    <ArrowLeft size={18} /> Volver
                  </motion.button>

                  <motion.button 
                    type="submit" 
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-accent py-3.5 text-sm font-bold text-on-primary shadow-lg shadow-glow transition-all hover:bg-accent-hover disabled:opacity-70 disabled:hover:scale-100 outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                  >
                    {isSubmitting ? 'Enviando...' : 'Enviar enlace'}
                    {!isSubmitting && <Send size={18} />}
                  </motion.button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
