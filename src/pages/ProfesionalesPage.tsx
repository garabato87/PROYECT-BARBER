import React from 'react';
import Layout from '../components/Layout';
import { Plus, Edit2, Trash2, User, Star } from 'lucide-react';

const ProfesionalesPage: React.FC = () => {
  const profesionales = [
    { id: 1, nombre: 'Juan Pérez', especialidad: 'Master Barber', estado: 'Activo' },
    { id: 2, nombre: 'Carlos Ruiz', especialidad: 'Especialista en Barba', estado: 'Activo' },
    { id: 3, nombre: 'Mateo Sánchez', especialidad: 'Estilista', estado: 'Vacaciones' },
  ];

  return (
    <Layout title="Gestión del Equipo">
      <div className="animate-slide-up">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h3>Profesionales</h3>
            <p className="text-muted">Administra los barberos y su disponibilidad.</p>
          </div>
          <button style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            padding: '0.75rem 1.5rem', 
            borderRadius: 'var(--border-radius-md)', 
            background: 'var(--accent)', 
            color: '#fff', 
            fontWeight: 600
          }}>
            <Plus size={18} />
            Añadir Profesional
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {profesionales.map((pro) => (
            <div key={pro.id} style={{ 
              background: 'var(--surface)', 
              padding: '1.5rem', 
              borderRadius: 'var(--border-radius-lg)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              gap: '1.5rem',
              alignItems: 'center'
            }}>
              <div style={{ 
                width: '70px', 
                height: '70px', 
                borderRadius: '50%', 
                background: 'var(--bg-primary)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                border: '2px solid var(--accent)'
              }}>
                <User size={32} className="accent-text" />
              </div>

              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0 }}>{pro.nombre}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <Star size={14} className="accent-text" />
                  <span className="text-muted" style={{ fontSize: '0.875rem' }}>{pro.especialidad}</span>
                </div>
                <div style={{ 
                  marginTop: '0.75rem', 
                  display: 'inline-block',
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '20px', 
                  fontSize: '0.75rem', 
                  fontWeight: 600,
                  background: pro.estado === 'Activo' ? 'rgba(64, 192, 87, 0.1)' : 'rgba(250, 82, 82, 0.1)',
                  color: pro.estado === 'Activo' ? 'var(--success)' : 'var(--danger)'
                }}>
                  {pro.estado}
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button className="icon-button" title="Editar">
                  <Edit2 size={16} />
                </button>
                <button className="icon-button" title="Eliminar" style={{ color: 'var(--danger)' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default ProfesionalesPage;
