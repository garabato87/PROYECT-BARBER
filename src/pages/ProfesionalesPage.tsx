import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Plus, Trash2, User, X, Loader2, Mail, Edit2, Camera } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { collection, onSnapshot, updateDoc, deleteDoc, doc, query, where, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useToast } from '../context/ToastContext';
import { getAppError } from '../utils/errors';

interface WorkingDay {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

interface Professional {
  id?: string;
  name: string;
  email: string;
  photoURL?: string;
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
  const { success, error: showError } = useToast();
  const shopId = user?.barbershopId;
  const [profesionales, setProfesionales] = useState<Professional[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Add Pro Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Edit Pro Modal (Photo & Schedule)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPro, setEditingPro] = useState<Professional | null>(null);
  const [workingDays, setWorkingDays] = useState<Record<number, WorkingDay>>(DEFAULT_WORKING_DAYS);
  const [isActive, setIsActive] = useState(true);
  const [photoURL, setPhotoURL] = useState('');

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

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId || !email.trim()) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
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

      // Preserve admin/super-admin role, only upgrade 'client' to 'professional'
      const newRole = (proData.role === 'admin' || proData.role === 'super-admin') 
        ? proData.role 
        : 'professional';

      await updateDoc(doc(db, 'users', proId), {
        role: newRole,
        barbershopId: shopId
      });

      await setDoc(doc(db, 'businesses', shopId, 'professionals', proId), {
        name: proData.name || 'Sin nombre',
        email: proData.email,
        photoURL: proData.photoURL || '',
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
        await updateDoc(doc(db, 'users', id), {
          role: 'client',
          barbershopId: null
        });
        await deleteDoc(doc(db, 'businesses', shopId, 'professionals', id));
        success('Profesional eliminado de tu equipo');
      } catch (error) {
        console.error("Error deleting professional:", error);
        showError(getAppError(error), "Hubo un error al eliminar el profesional.");
      }
    }
  };

  const openEditModal = (pro: Professional) => {
    setEditingPro(pro);
    setWorkingDays(pro.workingDays || DEFAULT_WORKING_DAYS);
    setIsActive(pro.isActive ?? true);
    setPhotoURL(pro.photoURL || '');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!shopId || !editingPro?.id) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'businesses', shopId, 'professionals', editingPro.id), {
        workingDays,
        isActive,
        photoURL
      });
      setIsEditModalOpen(false);
      success('Cambios guardados exitosamente');
    } catch (error) {
      console.error("Error updating profile:", error);
      showError(getAppError(error), "Hubo un error al guardar los cambios.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Layout title="Gestión del Equipo">
        <div className="flex justify-center items-center h-[50vh]">
          <Loader2 size={32} className="animate-spin text-accent" />
        </div>
      </Layout>
    );
  }

  if (!shopId) {
    return (
      <Layout title="Gestión del Equipo">
        <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4 animate-slide-up">
          <h3 className="font-heading text-3xl font-bold mb-4 text-foreground">Aún no tienes un local configurado</h3>
          <p className="text-text-secondary mb-8 max-w-md">
            Para poder agregar profesionales, primero debes crear tu establecimiento en Mi Local.
          </p>
          <a href="/admin/mi-local" className="px-6 py-3 bg-accent text-on-primary font-bold rounded-xl shadow-glow hover:bg-accent-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            Ir a Mi Local
          </a>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Gestión del Equipo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-10"
        >
          <div>
            <h1 className="font-heading text-4xl sm:text-5xl font-bold text-foreground tracking-tight mb-2">Profesionales</h1>
            <p className="text-text-secondary text-lg">Administrá los barberos de tu local y sus horarios.</p>
          </div>
          
          <button 
            onClick={handleOpenModal}
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-accent text-on-primary font-bold shadow-glow hover:bg-accent-hover transition-colors w-full sm:w-auto"
          >
            <Plus size={20} />
            Añadir Profesional
          </button>
        </motion.header>

        {profesionales.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center text-center h-64 sm:h-96 bg-surface border border-dashed border-glass-border rounded-3xl"
          >
            <div className="h-20 w-20 bg-secondary rounded-full flex items-center justify-center text-text-muted mb-6">
              <User size={36} />
            </div>
            <h3 className="font-heading text-2xl font-bold text-foreground mb-2">Sin Profesionales</h3>
            <p className="text-text-secondary max-w-md">No tienes profesionales en tu equipo aún. ¡Añade al primero mediante su correo!</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {profesionales.map((pro, index) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  key={pro.id} 
                  className="bg-surface rounded-3xl p-6 border border-glass-border shadow-sm hover:border-accent/40 hover:shadow-md transition-all group flex flex-col"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative h-16 w-16 rounded-full bg-background border-2 border-accent overflow-hidden shrink-0 shadow-glow flex items-center justify-center">
                      {pro.photoURL ? (
                        <img src={pro.photoURL} alt={pro.name} className="h-full w-full object-cover" />
                      ) : (
                        <User size={28} className="text-accent" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-heading text-xl font-bold text-foreground truncate capitalize">{pro.name}</h4>
                      <div className="flex items-center gap-1.5 text-text-muted text-sm mt-0.5 truncate">
                        <Mail size={14} className="shrink-0" />
                        <span className="truncate">{pro.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-6">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide",
                      pro.isActive !== false ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                    )}>
                      {pro.isActive !== false ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  
                  <div className="flex gap-3 pt-4 border-t border-glass-border mt-auto transition-opacity">
                    <button 
                      onClick={() => openEditModal(pro)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold bg-secondary text-foreground hover:bg-background border border-glass-border transition-colors"
                    >
                      <Edit2 size={16} /> Editar
                    </button>
                    <button 
                      onClick={() => handleDelete(pro.id!)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold bg-danger/10 text-danger hover:bg-danger hover:text-white transition-colors"
                    >
                      <Trash2 size={16} /> Eliminar
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Add Professional Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={handleCloseModal}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-background border border-glass-border rounded-3xl shadow-2xl overflow-hidden z-10"
            >
              <div className="flex items-center justify-between p-6 border-b border-glass-border bg-surface">
                <h3 className="font-heading text-xl font-bold text-foreground">Añadir Profesional</h3>
                <button 
                  onClick={handleCloseModal}
                  className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-secondary text-text-muted transition-colors"
                >
                  <X size={20}/>
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="p-6 space-y-5">
                <p className="text-text-secondary text-sm">
                  Ingresa el email del barbero. El usuario debe haberse registrado previamente en la aplicación de clientes.
                </p>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-text-secondary">Email del usuario</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="ejemplo@correo.com"
                    className="w-full px-4 py-2.5 bg-surface border border-glass-border rounded-xl text-foreground font-medium focus:border-accent/50 outline-none"
                    required 
                  />
                </div>

                {errorMsg && (
                  <div className="p-3 bg-danger/10 text-danger rounded-xl text-sm font-medium border border-danger/20">
                    {errorMsg}
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-glass-border mt-6">
                  <button 
                    type="button" 
                    onClick={handleCloseModal}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-foreground bg-surface border border-glass-border hover:bg-secondary transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting || !email.trim()}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-on-primary bg-accent shadow-glow hover:bg-accent-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                  >
                    {isSubmitting ? <span className="animate-spin text-xl leading-none">◌</span> : null}
                    Añadir al Equipo
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Professional Modal (Photo & Schedule) */}
      <AnimatePresence>
        {isEditModalOpen && editingPro && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsEditModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-background border border-glass-border rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-glass-border bg-surface shrink-0">
                <h3 className="font-heading text-xl font-bold text-foreground">Editar a {editingPro.name}</h3>
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-secondary text-text-muted transition-colors"
                >
                  <X size={20}/>
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 flex-1">
                {/* Active Toggle */}
                <div className="p-4 bg-surface border border-glass-border rounded-xl">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isActive} 
                      onChange={(e) => setIsActive(e.target.checked)} 
                      className="w-5 h-5 rounded border-glass-border text-accent focus:ring-accent accent-accent"
                    />
                    <span className="font-bold text-foreground">Perfil Activo (Visible para clientes)</span>
                  </label>
                </div>

                {/* Photo URL */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-text-secondary">
                    <Camera size={16} /> URL de Foto de Perfil
                  </label>
                  <input 
                    type="url" 
                    value={photoURL} 
                    onChange={(e) => setPhotoURL(e.target.value)} 
                    placeholder="https://ejemplo.com/foto.jpg"
                    className="w-full px-4 py-2.5 bg-surface border border-glass-border rounded-xl text-foreground font-medium focus:border-accent/50 outline-none"
                  />
                  <p className="text-xs text-text-muted mt-1">Sube una imagen cuadrada de buena calidad para que los clientes reconozcan al profesional.</p>
                </div>

                <div className="h-px bg-glass-border my-4" />

                {/* Schedules */}
                <h4 className="font-bold text-foreground">Horarios de Trabajo</h4>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5, 6, 0].map(dayIdx => {
                    const dayConfig = workingDays[dayIdx];
                    return (
                      <div key={dayIdx} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-surface border border-glass-border rounded-xl">
                        <label className="w-32 flex items-center gap-3 cursor-pointer font-semibold text-foreground">
                          <input 
                            type="checkbox" 
                            checked={dayConfig.isOpen}
                            onChange={(e) => setWorkingDays({
                              ...workingDays,
                              [dayIdx]: { ...dayConfig, isOpen: e.target.checked }
                            })}
                            className="w-4 h-4 rounded border-glass-border text-accent focus:ring-accent accent-accent"
                          />
                          {DAY_NAMES[dayIdx]}
                        </label>
                        
                        {dayConfig.isOpen ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input 
                              type="time" 
                              className="w-full px-3 py-1.5 bg-background border border-glass-border rounded-lg text-foreground text-sm font-medium focus:outline-none"
                              value={dayConfig.openTime}
                              onChange={(e) => setWorkingDays({
                                ...workingDays,
                                [dayIdx]: { ...dayConfig, openTime: e.target.value }
                              })}
                            />
                            <span className="text-text-muted text-sm font-bold">a</span>
                            <input 
                              type="time" 
                              className="w-full px-3 py-1.5 bg-background border border-glass-border rounded-lg text-foreground text-sm font-medium focus:outline-none"
                              value={dayConfig.closeTime}
                              onChange={(e) => setWorkingDays({
                                ...workingDays,
                                [dayIdx]: { ...dayConfig, closeTime: e.target.value }
                              })}
                            />
                          </div>
                        ) : (
                          <div className="flex-1 flex justify-center">
                            <span className="px-3 py-1 bg-secondary text-text-muted rounded-lg text-xs font-bold uppercase tracking-wider">No trabaja</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 border-t border-glass-border bg-surface shrink-0 flex gap-3">
                <button 
                  onClick={() => setIsEditModalOpen(false)} 
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-foreground bg-background border border-glass-border hover:bg-secondary transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveEdit} 
                  disabled={isSubmitting} 
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-on-primary bg-accent shadow-glow hover:bg-accent-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                >
                  {isSubmitting ? <span className="animate-spin text-xl leading-none">◌</span> : null}
                  Guardar Perfil
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default ProfesionalesPage;
