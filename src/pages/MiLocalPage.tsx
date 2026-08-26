import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { BUSINESS_CATEGORIES, type BusinessCategory } from '../mocks/db';
import { useAuth } from '../hooks/useAuth';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Store, Loader2, CheckCircle2 } from 'lucide-react';

const MiLocalPage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [shopId, setShopId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    email: '',
    phone: '',
    category: 'barberia' as BusinessCategory,
    status: 'active',
    expirationDate: '2026-12-31',
  });

  useEffect(() => {
    const fetchBusiness = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, 'businesses'), where('ownerId', '==', user.id));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const businessDoc = querySnapshot.docs[0];
          setShopId(businessDoc.id);
          setFormData(businessDoc.data() as typeof formData);
        }
      } catch (error) {
        console.error("Error al obtener el local:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBusiness();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setStatusMessage(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      if (shopId) {
        // Update existing business
        await updateDoc(doc(db, 'businesses', shopId), formData);
        setStatusMessage({ type: 'success', text: 'Local actualizado correctamente.' });
      } else {
        // Create new business
        const newBusinessData = {
          ...formData,
          ownerId: user.id,
        };
        const docRef = await addDoc(collection(db, 'businesses'), newBusinessData);
        setShopId(docRef.id);
        
        // Update user profile with barbershopId
        await updateProfile({ barbershopId: docRef.id });
        setStatusMessage({ type: 'success', text: '¡Local creado exitosamente!' });
      }
    } catch (error) {
      console.error("Error saving business:", error);
      setStatusMessage({ type: 'error', text: 'Ocurrió un error al guardar los datos.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Layout title="Mi Local">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <Loader2 size={32} className="spinner" style={{ color: 'var(--accent)' }} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Mi Local">
      <div className="animate-slide-up" style={{ maxWidth: '800px' }}>
        <div style={{
          background: 'var(--surface)',
          padding: '2rem',
          borderRadius: 'var(--border-radius-lg)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-md)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(251,191,36,0.1)', color: 'var(--accent)', borderRadius: 'var(--border-radius-md)' }}>
              <Store size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0 }}>{shopId ? 'Editar Establecimiento' : 'Crear Establecimiento'}</h3>
              <p className="text-muted" style={{ margin: '0.25rem 0 0' }}>
                {shopId 
                  ? 'Actualizá la información de tu local.' 
                  : 'Registrá tu negocio para empezar a recibir turnos.'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '2rem' }}>

            {/* Categoría del negocio */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={labelStyle}>Tipo de negocio</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                style={{ ...fieldStyle, cursor: 'pointer' }}
              >
                {(Object.entries(BUSINESS_CATEGORIES) as [BusinessCategory, { label: string; emoji: string }][]).map(
                  ([key, { label, emoji }]) => (
                    <option key={key} value={key}>
                      {emoji} {label}
                    </option>
                  )
                )}
              </select>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Determina cómo aparece tu local en las búsquedas de los clientes.
              </span>
            </div>

            {/* Nombre */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={labelStyle}>Nombre del establecimiento</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                style={fieldStyle}
              />
            </div>

            {/* Teléfono y Email */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={labelStyle}>Teléfono</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} style={fieldStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={labelStyle}>Email de contacto</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} style={fieldStyle} />
              </div>
            </div>

            {/* Dirección */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={labelStyle}>Dirección</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                style={{ ...fieldStyle, resize: 'vertical' }}
              />
            </div>

            {/* Estado de suscripción */}
            {shopId && (
              <div style={{
                padding: '1rem 1.25rem',
                background: formData.status === 'active' ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
                border: `1px solid ${formData.status === 'active' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                borderRadius: 'var(--border-radius-md)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>Estado de suscripción</p>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Vence el: {formData.expirationDate}
                  </p>
                </div>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: formData.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                  color: formData.status === 'active' ? 'var(--success)' : 'var(--danger)',
                  letterSpacing: '0.05em',
                }}>
                  {formData.status === 'active' ? 'ACTIVO' : 'INACTIVO'}
                </span>
              </div>
            )}

            {statusMessage && (
              <div style={{
                padding: '0.75rem',
                borderRadius: 'var(--border-radius-md)',
                background: statusMessage.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                color: statusMessage.type === 'success' ? 'var(--success)' : 'var(--danger)',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                {statusMessage.type === 'success' && <CheckCircle2 size={18} />}
                {statusMessage.text}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: 'var(--border-radius-md)',
                background: isSubmitting ? 'var(--bg-secondary)' : 'var(--accent)',
                color: isSubmitting ? 'var(--text-muted)' : '#fff',
                fontWeight: 600,
                width: 'fit-content',
                transition: 'background var(--transition-speed)',
                fontSize: '0.95rem',
                border: 'none',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              {isSubmitting && <Loader2 size={18} className="spinner" />}
              {shopId ? 'Guardar Cambios' : 'Crear Local'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default MiLocalPage;
