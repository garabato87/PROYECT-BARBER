import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Plus, Trash2, User, X, Loader2, Mail } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { collection, onSnapshot, updateDoc, deleteDoc, doc, query, where, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

interface WorkingDay {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

interface Professional {
  id?: string;
  name: string;
  email: string;
  photoUrl?: string;
  isActive?: boolean;
  workingDays?: Record<number, WorkingDay>;
}

const DEFAULT_WORKING_DAYS: Record<number, WorkingDay> = {
  0: { isOpen: false, openTime: '09:00', closeTime: '18:00' }, // Domingo
  1: { isOpen: true,  openTime: '09:00', closeTime: '18:00' }, // Lunes
  2: { isOpen: true,  openTime: '09:00', closeTime: '18:00' }, // Martes
  3: { isOpen: true,  openTime: '09:00', closeTime: '18:00' }, // Miércoles
  4: { isOpen: true,  openTime: '09:00', closeTime: '18:00' }, // Jueves
  5: { isOpen: true,  openTime: '09:00', closeTime: '18:00' }, // Viernes
  6: { isOpen: true,  openTime: '09:00', closeTime: '14:00' }, // Sábado
};

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const ProfesionalesPage: React.FC = () => {
  const { user } = useAuth();
  const shopId = user?.barbershopId;
  const [profesionales, setProfesionales] = useState<Professional[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Schedule Modal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingPro, setEditingPro] = useState<Professional | null>(null);
  const [workingDays, setWorkingDays] = useState<Record<number, WorkingDay>>(DEFAULT_WORKING_DAYS);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!shopId) {
      setIsLoading(false);
      return;
    }

    const profsRef = collection(db, 'businesses', shopId, 'professionals');
    const unsubscribe = onSnapshot(profsRef, (snapshot) => {
      const profsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Professional[];
      setProfesionales(profsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching professionals:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [shopId]);

  const handleOpenModal = () => {
    setEmail('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEmail('');
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId || !email.trim()) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // 1. Buscar el usuario por email
      const q = query(collection(db, 'users'), where('email', '==', email.trim().toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setErrorMsg('No se encontró ningún usuario con ese email. El barbero debe registrarse primero en la app.');
        setIsSubmitting(false);
        return;
      }

      const proDoc = querySnapshot.docs[0];
      const proData = proDoc.data();
      const proId = proDoc.id;

      // Check if already in another shop or this shop
      if (proData.barbershopId && proData.barbershopId !== shopId) {
        setErrorMsg('Este usuario ya pertenece a otro local.');
        setIsSubmitting(false);
        return;
      }

      if (profesionales.some(p => p.id === proId)) {
        setErrorMsg('Este profesional ya está en tu equipo.');
        setIsSubmitting(false);
        return;
      }

      // 2. Actualizar el rol y barbershopId en la colección users
      await updateDoc(doc(db, 'users', proId), {
        role: 'professional',
        barbershopId: shopId
      });

      // 3. Crear el documento en la subcolección del local
      await setDoc(doc(db, 'businesses', shopId, 'professionals', proId), {
        name: proData.name || 'Sin nombre',
        email: proData.email,
        photoUrl: proData.photoUrl || '',
        isActive: true,
        workingDays: DEFAULT_WORKING_DAYS
      });

      handleCloseModal();
    } catch (error) {
      console.error("Error adding professional:", error);
      setErrorMsg("Hubo un error al agregar el profesional. Verifica que tengas permisos.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!shopId) return;
    if (window.confirm('¿Estás seguro de que deseas eliminar este profesional de tu equipo? (Su cuenta volverá a ser de Cliente)')) {
      try {
        // 1. Revertir el rol en users
        await updateDoc(doc(db, 'users', id), {
          role: 'client',
          barbershopId: null
        });

        // 2. Eliminar de la subcolección
        await deleteDoc(doc(db, 'businesses', shopId, 'professionals', id));
      } catch (error) {
        console.error("Error deleting professional:", error);
        alert("Hubo un error al eliminar el profesional.");
      }
    }
  };

  const openScheduleModal = (pro: Professional) => {
    setEditingPro(pro);
    setWorkingDays(pro.workingDays || DEFAULT_WORKING_DAYS);
    setIsActive(pro.isActive ?? true);
    setIsScheduleModalOpen(true);
  };

  const handleSaveSchedule = async () => {
    if (!shopId || !editingPro?.id) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'businesses', shopId, 'professionals', editingPro.id), {
        workingDays,
        isActive
      });
      setIsScheduleModalOpen(false);
    } catch (error) {
      console.error("Error updating schedule:", error);
      alert("Hubo un error al guardar los horarios.");
    } finally {
      setIsSubmitting(false);
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

  if (isLoading) {
    return (
      <Layout title="Gestión del Equipo">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <Loader2 size={32} className="spinner" style={{ color: 'var(--accent)' }} />
        </div>
      </Layout>
    );
  }

  if (!shopId) {
    return (
      <Layout title="Gestión del Equipo">
        <div className="animate-slide-up" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <h3>Aún no tienes un local configurado</h3>
          <p className="text-muted" style={{ margin: '1rem 0 2rem' }}>
            Para poder agregar profesionales, primero debes crear tu establecimiento.
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
    <Layout title="Gestión del Equipo">
      <div className="animate-slide-up">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h3>Profesionales</h3>
            <p className="text-muted">Administra los barberos de tu local.</p>
          </div>
          <button 
            onClick={handleOpenModal}
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
            Añadir Profesional
          </button>
        </div>

        {profesionales.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--surface)', borderRadius: 'var(--border-radius-lg)', border: '1px dashed var(--border)' }}>
            <p className="text-muted">No tienes profesionales en tu equipo aún.</p>
          </div>
        ) : (
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
                  border: '2px solid var(--accent)',
                  overflow: 'hidden'
                }}>
                  {pro.photoUrl ? (
                    <img src={pro.photoUrl} alt={pro.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <User size={32} className="accent-text" />
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0 }}>{pro.name}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <Mail size={14} className="accent-text" />
                    <span className="text-muted" style={{ fontSize: '0.875rem' }}>{pro.email}</span>
                  </div>
                  <div style={{ 
                    marginTop: '0.75rem', 
                    display: 'inline-block',
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '20px', 
                    fontSize: '0.75rem', 
                    fontWeight: 600,
                    background: pro.isActive !== false ? 'rgba(64, 192, 87, 0.1)' : 'rgba(235, 87, 87, 0.1)',
                    color: pro.isActive !== false ? 'var(--success)' : 'var(--danger)'
                  }}>
                    {pro.isActive !== false ? 'Activo' : 'Inactivo'}
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button className="icon-button" title="Configurar horarios" style={{ color: 'var(--accent)' }} onClick={() => openScheduleModal(pro)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                  </button>
                  <button className="icon-button" title="Eliminar" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(pro.id!)}>
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
            maxWidth: '400px',
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
            <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Añadir Profesional</h3>
            <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              Ingresa el email del barbero. El usuario debe haberse registrado previamente en la aplicación.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  marginBottom: '0.5rem',
                  display: 'block',
                  color: 'var(--text-secondary)',
                }}>Email del usuario</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  style={fieldStyle} 
                  placeholder="ejemplo@correo.com"
                  required 
                />
              </div>

              {errorMsg && (
                <div style={{ padding: '0.75rem', background: 'rgba(235, 87, 87, 0.1)', color: 'var(--danger)', borderRadius: 'var(--border-radius-sm)', fontSize: '0.875rem' }}>
                  {errorMsg}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
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
                  disabled={isSubmitting || !email.trim()}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: 'var(--border-radius-md)',
                    background: isSubmitting || !email.trim() ? 'var(--bg-secondary)' : 'var(--accent)',
                    color: isSubmitting || !email.trim() ? 'var(--text-muted)' : '#fff',
                    border: 'none',
                    cursor: isSubmitting || !email.trim() ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {isSubmitting && <Loader2 size={18} className="spinner" />}
                  Añadir al Equipo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {isScheduleModalOpen && editingPro && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
        }}>
          <div className="animate-slide-up" style={{
            background: 'var(--surface)', padding: '2rem', borderRadius: 'var(--border-radius-lg)',
            width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-lg)', position: 'relative',
          }}>
            <button onClick={() => setIsScheduleModalOpen(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <X size={24} />
            </button>
            <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Horarios de {editingPro.name}</h3>
            
            <div style={{ margin: '1.5rem 0', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--border-radius-md)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>
                <input 
                  type="checkbox" 
                  checked={isActive} 
                  onChange={(e) => setIsActive(e.target.checked)} 
                  style={{ width: '18px', height: '18px' }}
                />
                El profesional está activo (aparece para turnos)
              </label>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[1, 2, 3, 4, 5, 6, 0].map(dayIdx => {
                const dayConfig = workingDays[dayIdx];
                return (
                  <div key={dayIdx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                    <label style={{ width: '100px', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={dayConfig.isOpen}
                        onChange={(e) => setWorkingDays({
                          ...workingDays,
                          [dayIdx]: { ...dayConfig, isOpen: e.target.checked }
                        })}
                      />
                      {DAY_NAMES[dayIdx]}
                    </label>
                    
                    {dayConfig.isOpen ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                        <input 
                          type="time" 
                          style={fieldStyle} 
                          value={dayConfig.openTime}
                          onChange={(e) => setWorkingDays({
                            ...workingDays,
                            [dayIdx]: { ...dayConfig, openTime: e.target.value }
                          })}
                        />
                        <span>a</span>
                        <input 
                          type="time" 
                          style={fieldStyle} 
                          value={dayConfig.closeTime}
                          onChange={(e) => setWorkingDays({
                            ...workingDays,
                            [dayIdx]: { ...dayConfig, closeTime: e.target.value }
                          })}
                        />
                      </div>
                    ) : (
                      <span className="text-muted" style={{ flex: 1, textAlign: 'center', fontSize: '0.875rem' }}>No trabaja</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
              <button onClick={() => setIsScheduleModalOpen(false)} style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--border-radius-md)', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
              <button onClick={handleSaveSchedule} disabled={isSubmitting} style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--border-radius-md)', background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {isSubmitting && <Loader2 size={18} className="spinner" />}
                Guardar Horarios
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ProfesionalesPage;
