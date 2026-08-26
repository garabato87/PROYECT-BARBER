import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Layout from '../components/Layout';

const ProfilePage: React.FC = () => {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name ?? '',
    phone: user?.phone ?? '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    try {
      await updateProfile(formData);
      setSuccess('Perfil actualizado correctamente.');
    } catch {
      setError('No se pudo actualizar el perfil. Intentá de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Layout title="Mi Perfil">
      <div className="animate-slide-up" style={{ maxWidth: '600px' }}>
        <div style={{
          background: 'var(--surface)',
          padding: '2rem',
          borderRadius: 'var(--border-radius-lg)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-md)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              color: '#fff',
              fontWeight: 700,
            }}>
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 style={{ margin: 0 }}>{user?.name}</h3>
              <p className="text-muted" style={{ margin: '4px 0 0 0', fontSize: '0.875rem' }}>{user?.email}</p>
              <span style={{
                display: 'inline-block',
                marginTop: '6px',
                padding: '2px 10px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 600,
                background: 'rgba(64,192,87,0.1)',
                color: 'var(--success)',
              }}>
                {user?.role}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Nombre completo</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--border-radius-md)',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '1rem',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Teléfono</label>
              <input
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                disabled={isSubmitting}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--border-radius-md)',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '1rem',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Email</label>
              <input
                value={user?.email ?? ''}
                disabled
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--border-radius-md)',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  opacity: 0.6,
                  fontSize: '1rem',
                }}
              />
              <span className="text-muted" style={{ fontSize: '0.8rem' }}>El email no se puede modificar.</span>
            </div>

            {error && (
              <p style={{ color: '#e53e3e', background: '#fff5f5', border: '1px solid #fc8181', borderRadius: '6px', padding: '10px 14px', margin: 0, fontSize: '0.875rem' }}>
                {error}
              </p>
            )}
            {success && (
              <p style={{ color: '#276749', background: '#f0fff4', border: '1px solid #9ae6b4', borderRadius: '6px', padding: '10px 14px', margin: 0, fontSize: '0.875rem' }}>
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: 'var(--border-radius-md)',
                background: 'var(--accent)',
                color: '#fff',
                fontWeight: 600,
                width: 'fit-content',
                opacity: isSubmitting ? 0.6 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>
        </div>

        <div style={{
          marginTop: '1.5rem',
          background: 'var(--surface)',
          padding: '1.5rem',
          borderRadius: 'var(--border-radius-lg)',
          border: '1px solid var(--border)',
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--danger)' }}>Cerrar Sesión</h4>
          <p className="text-muted" style={{ margin: '0 0 1rem 0', fontSize: '0.875rem' }}>
            Se cerrará tu sesión en este dispositivo.
          </p>
          <button
            onClick={handleLogout}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: 'var(--border-radius-md)',
              background: 'transparent',
              color: 'var(--danger)',
              border: '1px solid var(--danger)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
