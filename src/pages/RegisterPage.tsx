import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { getAppError } from '../utils/errors';
import { User, Phone, IdCard, Calendar, Mail, Lock, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import BrandLogo from '../components/ui/BrandLogo';
import { cn } from '../lib/utils';

import { AuthGallery } from '../components/ui/AuthGallery';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { error: showError } = useToast();
  const [step, setStep]           = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData]   = useState({
    name: '', lastName: '', dni: '', phone: '', birthDate: '',
    email: '', password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await register(formData);
      setStep(3);
      setIsSubmitting(false);
    } catch (err) {
      showError(getAppError(err));
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
            Tu negocio,<br />en <span className="text-accent">otro nivel.</span>
          </h2>
          <p className="text-lg text-white/80 mb-8">
            Registrate gratis y empezá a gestionar tu negocio de forma profesional. Sin tarjeta de crédito.
          </p>
          <div className="space-y-4">
            {['Configuración en minutos', 'Agenda 24/7 para tus clientes', 'Control total de tu equipo', 'Estadísticas de tu negocio'].map((f, i) => (
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

          {step < 3 && (
            <>
              <div className="mb-10 text-center lg:text-left">
                <h1 className="font-heading text-3xl font-bold text-foreground mb-2">Crear cuenta</h1>
                <p className="text-text-secondary">
                  ¿Ya tenés cuenta?{' '}
                  <button 
                    type="button"
                    onClick={() => navigate('/login')}
                    className="font-semibold text-accent hover:text-accent-hover transition-colors focus:outline-none"
                  >
                    Iniciá sesión
                  </button>
                </p>
              </div>

              {/* Stepper */}
              <div className="flex items-center justify-center lg:justify-start gap-4 mb-8">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors",
                    step >= 1 ? "bg-accent text-on-primary" : "bg-surface-hover text-text-muted"
                  )}>
                    {step > 1 ? <CheckCircle2 size={16} /> : "1"}
                  </div>
                  <span className={cn("text-sm font-medium", step >= 1 ? "text-foreground" : "text-text-muted")}>
                    Tus datos
                  </span>
                </div>
                <div className={cn("h-[2px] w-12 rounded-full transition-colors", step > 1 ? "bg-accent" : "bg-surface-hover")} />
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors",
                    step >= 2 ? "bg-accent text-on-primary shadow-glow" : "bg-surface-hover text-text-muted"
                  )}>
                    2
                  </div>
                  <span className={cn("text-sm font-medium", step >= 2 ? "text-foreground" : "text-text-muted")}>
                    Tu cuenta
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Forms */}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form 
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleNext} 
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="name" className="text-sm font-medium text-foreground ml-1">Nombre</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted"><User size={18} /></div>
                      <input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Juan" required className="w-full rounded-xl border border-glass-border bg-surface py-3 pl-11 pr-4 text-sm text-foreground transition-all placeholder:text-text-muted hover:border-accent/50 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent-glow" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="lastName" className="text-sm font-medium text-foreground ml-1">Apellido</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted"><User size={18} /></div>
                      <input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="García" required className="w-full rounded-xl border border-glass-border bg-surface py-3 pl-11 pr-4 text-sm text-foreground transition-all placeholder:text-text-muted hover:border-accent/50 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent-glow" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="dni" className="text-sm font-medium text-foreground ml-1">DNI</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted"><IdCard size={18} /></div>
                      <input id="dni" name="dni" value={formData.dni} onChange={handleChange} placeholder="12345678" required className="w-full rounded-xl border border-glass-border bg-surface py-3 pl-11 pr-4 text-sm text-foreground transition-all placeholder:text-text-muted hover:border-accent/50 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent-glow" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="phone" className="text-sm font-medium text-foreground ml-1">Teléfono</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted"><Phone size={18} /></div>
                      <input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="+54 9..." required className="w-full rounded-xl border border-glass-border bg-surface py-3 pl-11 pr-4 text-sm text-foreground transition-all placeholder:text-text-muted hover:border-accent/50 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent-glow" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pb-4">
                  <label htmlFor="birthDate" className="text-sm font-medium text-foreground ml-1">Fecha de nacimiento</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted"><Calendar size={18} /></div>
                    <input id="birthDate" name="birthDate" type="date" value={formData.birthDate} onChange={handleChange} required className="w-full rounded-xl border border-glass-border bg-surface py-3 pl-11 pr-4 text-sm text-foreground transition-all text-text-muted hover:border-accent/50 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent-glow [color-scheme:light] dark:[color-scheme:dark]" />
                  </div>
                </div>

                <motion.button 
                  type="submit" 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent py-3.5 text-sm font-bold text-on-primary shadow-lg shadow-glow transition-all hover:bg-accent-hover outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                >
                  Continuar <ArrowRight size={18} />
                </motion.button>
              </motion.form>
            )}

            {step === 2 && (
              <motion.form 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSubmit} 
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-medium text-foreground ml-1">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted"><Mail size={18} /></div>
                    <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="nombre@correo.com" required disabled={isSubmitting} className="w-full rounded-xl border border-glass-border bg-surface py-3 pl-11 pr-4 text-sm text-foreground transition-all placeholder:text-text-muted hover:border-accent/50 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent-glow disabled:opacity-50" />
                  </div>
                </div>

                <div className="space-y-1.5 pb-2">
                  <label htmlFor="password" className="text-sm font-medium text-foreground ml-1">Contraseña</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted"><Lock size={18} /></div>
                    <input id="password" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Mínimo 6 caracteres" required disabled={isSubmitting} className="w-full rounded-xl border border-glass-border bg-surface py-3 pl-11 pr-4 text-sm text-foreground transition-all placeholder:text-text-muted hover:border-accent/50 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent-glow disabled:opacity-50" />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <motion.button 
                    type="button" 
                    onClick={() => setStep(1)}
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-glass-border bg-surface py-3.5 text-sm font-bold text-foreground transition-all hover:bg-surface-hover hover:border-accent/50 disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
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
                    {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
                    {!isSubmitting && <CheckCircle2 size={18} />}
                  </motion.button>
                </div>
              </motion.form>
            )}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center justify-center text-center space-y-6 py-8"
              >
                <div className="h-20 w-20 rounded-full bg-accent/20 flex items-center justify-center mb-2">
                  <Mail className="h-10 w-10 text-accent" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">¡Revisá tu email!</h2>
                  <p className="text-text-secondary max-w-sm mx-auto">
                    Te enviamos un enlace de verificación a <span className="font-semibold text-foreground">{formData.email}</span>. 
                    Hacé clic en el enlace para activar tu cuenta.
                  </p>
                </div>
                
                <motion.button 
                  type="button"
                  onClick={() => navigate('/login')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-surface py-3.5 text-sm font-bold text-foreground border border-glass-border transition-all hover:bg-surface-hover hover:border-accent/50 outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  Ir al Login
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterPage;
