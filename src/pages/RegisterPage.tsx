import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Auth.css';

const FIREBASE_ERRORS: Record<string, string> = {
  'auth/email-already-in-use':   'Ya existe una cuenta con ese correo.',
  'auth/invalid-email':          'El correo ingresado no es válido.',
  'auth/weak-password':          'La contraseña debe tener al menos 6 caracteres.',
  'auth/network-request-failed': 'Error de red. Revisá tu conexión.',
};

const getError = (err: unknown) => {
  if (err && typeof err === 'object' && 'code' in err) {
    return FIREBASE_ERRORS[(err as { code: string }).code] ?? 'Error inesperado. Intentá de nuevo.';
  }
  return 'Error inesperado. Intentá de nuevo.';
};

const ScissorsIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
    <line x1="20" y1="4" x2="8.12" y2="15.88"/>
    <line x1="14.47" y1="14.48" x2="20" y2="20"/>
    <line x1="8.12" y1="8.12" x2="12" y2="12"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [step, setStep]           = useState(1);
  const [error, setError]         = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData]   = useState({
    name: '', lastName: '', dni: '', phone: '', birthDate: '',
    email: '', password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await register(formData);
      navigate('/login');
    } catch (err) {
      setError(getError(err));
      setIsSubmitting(false);
    }
  };

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
            Tu barbería,<br />en <span>otro nivel.</span>
          </h2>

          <p className="auth-brand-subtitle">
            Registrate gratis y empezá a gestionar tu negocio de forma profesional. Sin tarjeta de crédito.
          </p>

          <div className="auth-brand-features">
            {['Configuración en minutos', 'Agenda 24/7 para tus clientes', 'Control total de tu equipo', 'Estadísticas de tu negocio'].map(f => (
              <div className="auth-brand-feature" key={f}>
                <div className="auth-brand-feature-dot" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="auth-brand-footer">© 2026 SDGP · Sistema de Gestión de Peluquerías</p>
      </div>

      {/* ── Form Panel ── */}
      <div className="auth-panel">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h1>Crear cuenta</h1>
            <p>¿Ya tenés cuenta? <span onClick={() => navigate('/login')}>Iniciá sesión</span></p>
          </div>

          {/* Step indicator */}
          <div className="auth-steps">
            <div className="auth-step">
              <div className={`auth-step-circle ${step === 1 ? 'active' : 'done'}`}>
                {step > 1 ? <CheckIcon /> : '1'}
              </div>
              <span className={`auth-step-label ${step === 1 ? 'active' : ''}`}>Tus datos</span>
            </div>
            <div className={`auth-step-line ${step > 1 ? 'done' : ''}`} />
            <div className="auth-step">
              <div className={`auth-step-circle ${step === 2 ? 'active' : ''}`}>2</div>
              <span className={`auth-step-label ${step === 2 ? 'active' : ''}`}>Tu cuenta</span>
            </div>
          </div>

          {/* Step 1: Personal info */}
          {step === 1 && (
            <form onSubmit={handleNext} className="auth-step-content">
              <div className="auth-field-row">
                <div className="auth-field">
                  <label>Nombre</label>
                  <input name="name" value={formData.name} onChange={handleChange} placeholder="Juan" required />
                </div>
                <div className="auth-field">
                  <label>Apellido</label>
                  <input name="lastName" value={formData.lastName} onChange={handleChange} placeholder="García" required />
                </div>
              </div>

              <div className="auth-field-row">
                <div className="auth-field">
                  <label>DNI</label>
                  <input name="dni" value={formData.dni} onChange={handleChange} placeholder="12345678" required />
                </div>
                <div className="auth-field">
                  <label>Teléfono</label>
                  <input name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="+54 9 11..." required />
                </div>
              </div>

              <div className="auth-field">
                <label>Fecha de nacimiento</label>
                <input name="birthDate" type="date" value={formData.birthDate} onChange={handleChange} required />
              </div>

              <button type="submit" className="auth-button" style={{ marginTop: '0.5rem' }}>
                Continuar →
              </button>
            </form>
          )}

          {/* Step 2: Credentials */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="auth-step-content">
              <button type="button" className="auth-step-back" onClick={() => setStep(1)}>
                <BackIcon /> Volver
              </button>

              <div className="auth-field">
                <label>Email</label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="nombre@correo.com"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="auth-field">
                <label>Contraseña</label>
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Mínimo 6 caracteres"
                  required
                  disabled={isSubmitting}
                />
              </div>

              {error && <p className="auth-error">{error}</p>}

              <button type="submit" className="auth-button" disabled={isSubmitting} style={{ marginTop: '0.5rem' }}>
                {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
              </button>
            </form>
          )}

          <p className="auth-switch" style={{ marginTop: '1.5rem' }}>
            ¿Ya tenés cuenta? <span onClick={() => navigate('/login')}>Iniciá sesión</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
