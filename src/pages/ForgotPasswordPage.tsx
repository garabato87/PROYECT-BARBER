import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Auth.css';

const ScissorsIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
    <line x1="20" y1="4" x2="8.12" y2="15.88"/>
    <line x1="14.47" y1="14.48" x2="20" y2="20"/>
    <line x1="8.12" y1="8.12" x2="12" y2="12"/>
  </svg>
);

const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);

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
    <div className="auth-wrapper">
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
          <div className="auth-brand-logo-icon"><ScissorsIcon /></div>
          <span className="auth-brand-logo-text">SDGP</span>
        </div>

        <div className="auth-brand-hero">
          <h2 className="auth-brand-title">
            Recuperá el<br />acceso a tu <span>cuenta.</span>
          </h2>
          <p className="auth-brand-subtitle">
            Te enviaremos un enlace a tu correo para que puedas restablecer tu contraseña de forma segura.
          </p>
        </div>

        <p className="auth-brand-footer">© 2026 SDGP · Sistema de Gestión de Peluquerías</p>
      </div>

      <div className="auth-panel">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h1>{success ? '¡Correo enviado!' : 'Recuperar contraseña'}</h1>
            <p>Recordaste tu contraseña? <span onClick={() => navigate('/login')}>Volver al login</span></p>
          </div>

          {success ? (
            <div className="auth-step-content">
              <p className="auth-success" style={{ marginBottom: '1.5rem' }}>
                Revisá tu bandeja de entrada — te enviamos un enlace para restablecer tu contraseña.
              </p>
              <button className="auth-button" onClick={() => navigate('/login')}>
                Volver al inicio de sesión
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-step-content">
              <button type="button" className="auth-step-back" onClick={() => navigate('/login')}>
                <BackIcon /> Volver al login
              </button>

              <div className="auth-field">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nombre@correo.com"
                  required
                  disabled={isSubmitting}
                />
              </div>

              {error && <p className="auth-error">{error}</p>}

              <button type="submit" className="auth-button" disabled={isSubmitting}>
                {isSubmitting ? 'Enviando...' : 'Enviar enlace de recuperación'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
