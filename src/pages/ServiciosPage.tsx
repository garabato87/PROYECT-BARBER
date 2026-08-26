import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Plus, Edit2, Trash2, Clock, Tag, X, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';

interface Service {
  id?: string;
  name: string;
  description: string;
  duration: number;
  price: number;
}

const ServiciosPage: React.FC = () => {
  const { user } = useAuth();
  const shopId = user?.barbershopId;
  const [servicios, setServicios] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 30,
    price: 0,
  });

  useEffect(() => {
    if (!shopId) {
      setIsLoading(false);
      return;
    }

    const servicesRef = collection(db, 'businesses', shopId, 'services');
    const unsubscribe = onSnapshot(servicesRef, (snapshot) => {
      const servicesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Service[];
      setServicios(servicesData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching services:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [shopId]);

  const handleOpenModal = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        description: service.description,
        duration: service.duration,
        price: service.price,
      });
    } else {
      setEditingService(null);
      setFormData({
        name: '',
        description: '',
        duration: 30,
        price: 0,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'number' ? Number(value) : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) return;

    setIsSubmitting(true);
    try {
      const servicesRef = collection(db, 'businesses', shopId, 'services');
      if (editingService?.id) {
        // Update
        await updateDoc(doc(servicesRef, editingService.id), formData);
      } else {
        // Create
        await addDoc(servicesRef, formData);
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error saving service:", error);
      alert("Hubo un error al guardar el servicio.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!shopId) return;
    if (window.confirm('¿Estás seguro de que deseas eliminar este servicio?')) {
      try {
        await deleteDoc(doc(db, 'businesses', shopId, 'services', id));
      } catch (error) {
        console.error("Error deleting service:", error);
        alert("Hubo un error al eliminar el servicio.");
      }
    }
  };

  const fieldStyle: React.CSSProperties = {
    padding: '0.75rem 1rem',
    borderRadius: 'var(--border-radius-md)',
    border: '1px solid var(--border)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: '1rem',
    width: '100%',
    fontFamily: 'inherit',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: 600,
    marginBottom: '0.5rem',
    display: 'block',
    color: 'var(--text-secondary)',
  };

  if (isLoading) {
    return (
      <Layout title="Catálogo de Servicios">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <Loader2 size={32} className="spinner" style={{ color: 'var(--accent)' }} />
        </div>
      </Layout>
    );
  }

  if (!shopId) {
    return (
      <Layout title="Catálogo de Servicios">
        <div className="animate-slide-up" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <h3>Aún no tienes un local configurado</h3>
          <p className="text-muted" style={{ margin: '1rem 0 2rem' }}>
            Para poder agregar servicios, primero debes crear tu establecimiento.
          </p>
          <a href="/admin/mi-local" style={{
            padding: '0.75rem 1.5rem',
            background: 'var(--accent)',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: 'var(--border-radius-md)',
            fontWeight: 600
          }}>
            Ir a Mi Local
          </a>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Catálogo de Servicios">
      <div className="animate-slide-up">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h3>Servicios Disponibles</h3>
            <p className="text-muted">Gestiona los tratamientos y precios que ofreces.</p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            padding: '0.75rem 1.5rem', 
            borderRadius: 'var(--border-radius-md)', 
            background: 'var(--accent)', 
            color: '#fff', 
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer'
          }}>
            <Plus size={18} />
            Nuevo Servicio
          </button>
        </div>

        {servicios.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--surface)', borderRadius: 'var(--border-radius-lg)', border: '1px dashed var(--border)' }}>
            <p className="text-muted">No tienes servicios configurados aún.</p>
          </div>
        ) : (
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
                <h4 style={{ marginBottom: '1rem' }}>{servicio.name}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                    <Clock size={16} className="accent-text" />
                    <span className="text-muted">Duración: {servicio.duration} min</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                    <Tag size={16} className="accent-text" />
                    <span className="text-muted">Precio: ${servicio.price}</span>
                  </div>
                </div>
                
                <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '1rem' }}>
                  {servicio.description}
                </p>
                
                <div style={{ 
                  marginTop: '1.5rem', 
                  display: 'flex', 
                  gap: '0.75rem', 
                  borderTop: '1px solid var(--border)', 
                  paddingTop: '1rem' 
                }}>
                  <button className="icon-button" title="Editar" onClick={() => handleOpenModal(servicio)}>
                    <Edit2 size={16} />
                  </button>
                  <button className="icon-button" title="Eliminar" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(servicio.id!)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}>
          <div className="animate-slide-up" style={{
            background: 'var(--surface)',
            padding: '2rem',
            borderRadius: 'var(--border-radius-lg)',
            width: '100%',
            maxWidth: '500px',
            boxShadow: 'var(--shadow-lg)',
            position: 'relative',
          }}>
            <button 
              onClick={handleCloseModal}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)'
              }}
            >
              <X size={24} />
            </button>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>
              {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={labelStyle}>Nombre del Servicio</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  style={fieldStyle} 
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Precio ($)</label>
                  <input 
                    type="number" 
                    name="price" 
                    value={formData.price} 
                    onChange={handleChange} 
                    style={fieldStyle} 
                    min="0"
                    step="0.01"
                    required 
                  />
                </div>
                <div>
                  <label style={labelStyle}>Duración (min)</label>
                  <input 
                    type="number" 
                    name="duration" 
                    value={formData.duration} 
                    onChange={handleChange} 
                    style={fieldStyle} 
                    min="1"
                    required 
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Descripción</label>
                <textarea 
                  name="description" 
                  value={formData.description} 
                  onChange={handleChange} 
                  style={{ ...fieldStyle, resize: 'vertical' }} 
                  rows={3} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: 'var(--border-radius-md)',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: 'var(--border-radius-md)',
                    background: isSubmitting ? 'var(--bg-secondary)' : 'var(--accent)',
                    color: isSubmitting ? 'var(--text-muted)' : '#fff',
                    border: 'none',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {isSubmitting && <Loader2 size={18} className="spinner" />}
                  {editingService ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ServiciosPage;
