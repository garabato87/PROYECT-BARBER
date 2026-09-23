import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Plus, Edit2, Trash2, Clock, Tag, X, Loader2, Scissors, Store, Check } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import { getAppError } from '../utils/errors';

interface Service {
  id?: string;
  name: string;
  description: string;
  duration: number;
  price: number;
}

const ServiciosPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
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
      success(`Servicio ${editingService?.id ? 'actualizado' : 'creado'} exitosamente`);
    } catch (error) {
      console.error("Error saving service:", error);
      showError(getAppError(error), "Hubo un error al guardar el servicio.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!shopId) return;
    if (window.confirm('¿Estás seguro de que deseas eliminar este servicio?')) {
      try {
        await deleteDoc(doc(db, 'businesses', shopId, 'services', id));
        success('Servicio eliminado exitosamente');
      } catch (error) {
        console.error("Error deleting service:", error);
        showError(getAppError(error), "Hubo un error al eliminar el servicio.");
      }
    }
  };

  if (isLoading) {
    return (
      <Layout title="Catálogo de Servicios">
        <div className="flex justify-center items-center h-[50vh]">
          <Loader2 size={32} className="animate-spin text-accent" />
        </div>
      </Layout>
    );
  }

  if (!shopId) {
    return (
      <Layout title="Catálogo de Servicios">
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
              <div className="h-20 w-20 bg-accent/10 rounded-full flex items-center justify-center text-accent mb-6">
                <Store size={32} />
              </div>
              <h2 className="font-heading text-3xl font-bold text-foreground mb-4">Falta configurar tu local</h2>
              <p className="text-text-secondary mb-8 max-w-md">
                Para poder gestionar tus servicios, primero necesitás crear el perfil de tu barbería.
              </p>
              <a href="/admin/mi-local" className="px-6 py-3 bg-accent text-on-primary font-bold rounded-xl shadow-glow hover:bg-accent-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                Ir a Mi Local
              </a>
            </div>
      </Layout>
    );
  }

  return (
    <Layout title="Catálogo de Servicios">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-10"
        >
          <div>
            <h1 className="font-heading text-4xl sm:text-5xl font-bold text-foreground tracking-tight mb-2">Catálogo de Servicios</h1>
            <p className="text-text-secondary text-lg">Gestioná los tratamientos y precios que ofrecés.</p>
          </div>
          
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-accent text-on-primary font-bold shadow-glow hover:bg-accent-hover transition-colors w-full sm:w-auto"
          >
            <Plus size={20} />
            Nuevo Servicio
          </button>
        </motion.header>

        {servicios.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center text-center h-64 sm:h-96 bg-surface border border-dashed border-glass-border rounded-3xl"
          >
            <div className="h-20 w-20 bg-secondary rounded-full flex items-center justify-center text-text-muted mb-6">
              <Scissors size={36} />
            </div>
            <h3 className="font-heading text-2xl font-bold text-foreground mb-2">Sin Servicios</h3>
            <p className="text-text-secondary max-w-md">No tienes servicios configurados aún. ¡Agrega el primero para empezar a recibir turnos!</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {servicios.map((servicio, index) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  key={servicio.id} 
                  className="bg-surface rounded-3xl p-6 border border-glass-border shadow-sm hover:border-accent/40 hover:shadow-md transition-all group flex flex-col"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-heading text-2xl font-bold text-foreground capitalize pr-4">{servicio.name}</h4>
                    <div className="h-10 w-10 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0">
                      <Scissors size={18} />
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3 mb-6">
                    <div className="flex items-center gap-3 text-sm font-semibold">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-background border border-glass-border">
                        <Clock size={14} className="text-accent" />
                      </div>
                      <span className="text-text-secondary">Duración: <span className="text-foreground">{servicio.duration} min</span></span>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-semibold">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-background border border-glass-border">
                        <Tag size={14} className="text-success" />
                      </div>
                      <span className="text-text-secondary">Precio: <span className="text-foreground">${servicio.price}</span></span>
                    </div>
                  </div>
                  
                  <p className="text-text-muted text-sm leading-relaxed mb-6 flex-1 line-clamp-3">
                    {servicio.description || 'Sin descripción'}
                  </p>
                  
                  <div className="flex gap-3 pt-4 border-t border-glass-border mt-auto opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleOpenModal(servicio)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold bg-secondary text-foreground hover:bg-background border border-glass-border transition-colors"
                    >
                      <Edit2 size={16} /> Editar
                    </button>
                    <button 
                      onClick={() => handleDelete(servicio.id!)}
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

      {/* Modal */}
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
              className="relative w-full max-w-lg bg-background border border-glass-border rounded-3xl shadow-2xl overflow-hidden z-10"
            >
              <div className="flex items-center justify-between p-6 border-b border-glass-border bg-surface">
                <h3 className="font-heading text-xl font-bold text-foreground">
                  {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
                </h3>
                <button 
                  type="button"
                  aria-label="Cerrar modal"
                  onClick={handleCloseModal}
                  className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-secondary text-text-muted transition-colors"
                >
                  <X size={20}/>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-text-secondary">Nombre del Servicio</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    placeholder="Ej. Corte Clásico"
                    className="w-full px-4 py-2.5 bg-surface border border-glass-border rounded-xl text-foreground font-medium focus:border-accent/50 outline-none"
                    required 
                  />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-text-secondary">Precio ($)</label>
                    <input 
                      type="number" 
                      name="price" 
                      value={formData.price} 
                      onChange={handleChange} 
                      placeholder="0"
                      className="w-full px-4 py-2.5 bg-surface border border-glass-border rounded-xl text-foreground font-medium focus:border-accent/50 outline-none"
                      min="0"
                      step="0.01"
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-text-secondary">Duración (min)</label>
                    <input 
                      type="number" 
                      name="duration" 
                      value={formData.duration} 
                      onChange={handleChange} 
                      placeholder="30"
                      className="w-full px-4 py-2.5 bg-surface border border-glass-border rounded-xl text-foreground font-medium focus:border-accent/50 outline-none"
                      min="1"
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-text-secondary">Descripción</label>
                  <textarea 
                    name="description" 
                    value={formData.description} 
                    onChange={handleChange} 
                    placeholder="Detalles sobre el servicio..."
                    className="w-full px-4 py-2.5 bg-surface border border-glass-border rounded-xl text-foreground font-medium focus:border-accent/50 outline-none resize-none"
                    rows={3} 
                  />
                </div>

                  <div className="pt-4 border-t border-glass-border flex justify-end gap-3">
                    <button 
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 py-3 px-4 rounded-xl font-bold text-foreground bg-surface border border-glass-border hover:bg-surface-hover transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-3 px-4 rounded-xl font-bold text-on-primary bg-accent shadow-glow hover:bg-accent-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                    >
                      {isSubmitting ? <span className="animate-spin text-xl leading-none">◌</span> : <Check size={18} />}
                      {isSubmitting ? 'Guardando...' : 'Guardar Servicio'}
                    </button>
                  </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default ServiciosPage;
