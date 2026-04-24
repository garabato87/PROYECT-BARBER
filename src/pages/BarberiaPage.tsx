import React from 'react';
import Layout from '../components/Layout';

const BarberiaPage: React.FC = () => {
  return (
    <Layout title="Gestión de Barbería">
      <div className="animate-slide-up" style={{ maxWidth: '800px' }}>
        <div style={{ 
          background: 'var(--surface)', 
          padding: '2rem', 
          borderRadius: 'var(--border-radius-lg)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-md)'
        }}>
          <h3>Información General</h3>
          <p className="text-muted" style={{ marginBottom: '2rem' }}>Configura los datos básicos de tu establecimiento.</p>
          
          <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Usaré estilos inline por ahora para los inputs para ir rápido, luego los pasaremos a componentes UI core */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Nombre de la Barbería</label>
              <input type="text" placeholder="Ej. El Bigote de Oro" style={{ 
                padding: '0.75rem 1rem', 
                borderRadius: 'var(--border-radius-md)', 
                border: '1px solid var(--border)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Teléfono</label>
                <input type="tel" placeholder="+34 600 000 000" style={{ 
                  padding: '0.75rem 1rem', 
                  borderRadius: 'var(--border-radius-md)', 
                  border: '1px solid var(--border)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Email</label>
                <input type="email" placeholder="contacto@barberia.com" style={{ 
                  padding: '0.75rem 1rem', 
                  borderRadius: 'var(--border-radius-md)', 
                  border: '1px solid var(--border)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Dirección</label>
              <textarea placeholder="Calle Principal, 123..." rows={3} style={{ 
                padding: '0.75rem 1rem', 
                borderRadius: 'var(--border-radius-md)', 
                border: '1px solid var(--border)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                resize: 'vertical'
              }} />
            </div>

            <button type="button" style={{ 
              marginTop: '1rem',
              padding: '0.75rem 1.5rem', 
              borderRadius: 'var(--border-radius-md)', 
              background: 'var(--accent)', 
              color: '#fff', 
              fontWeight: 600,
              width: 'fit-content',
              transition: 'background var(--transition-speed)'
            }}>
              Guardar Cambios
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default BarberiaPage;
