import React from 'react';
import Layout from '../components/Layout';
import { Plus, Edit2, Trash2, Clock, Tag } from 'lucide-react';

const ServiciosPage: React.FC = () => {
  const servicios = [
    { id: 1, nombre: 'Corte de Pelo Premium', duracion: '45 min', precio: '25€' },
    { id: 2, nombre: 'Arreglo de Barba', duracion: '30 min', precio: '15€' },
    { id: 3, nombre: 'Corte + Barba', duracion: '60 min', precio: '35€' },
    { id: 4, nombre: 'Afeitado Clásico a Navaja', duracion: '40 min', precio: '20€' },
  ];

  return (
    <Layout title="Catálogo de Servicios">
      <div className="animate-slide-up">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h3>Servicios Disponibles</h3>
            <p className="text-muted">Gestiona los tratamientos y precios que ofreces.</p>
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
            Nuevo Servicio
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {servicios.map((servicio) => (
            <div key={servicio.id} style={{ 
              background: 'var(--surface)', 
              padding: '1.5rem', 
              borderRadius: 'var(--border-radius-lg)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
              position: 'relative'
            }}>
              <h4 style={{ marginBottom: '1rem' }}>{servicio.nombre}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <Clock size={16} className="accent-text" />
                  <span className="text-muted">Duración: {servicio.duracion}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <Tag size={16} className="accent-text" />
                  <span className="text-muted">Precio: {servicio.precio}</span>
                </div>
              </div>
              
              <div style={{ 
                marginTop: '1.5rem', 
                display: 'flex', 
                gap: '0.75rem', 
                borderTop: '1px solid var(--border)', 
                paddingTop: '1rem' 
              }}>
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

export default ServiciosPage;
