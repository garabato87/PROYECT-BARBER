import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ExploreLayout from '../components/ExploreLayout';
import { Camera, Loader2, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

const ProfilePage: React.FC = () => {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Frontend Validations
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten archivos de imagen.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no debe superar los 5MB.');
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccess('');
    try {
      // Cloudinary Upload Logic
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) {
        throw new Error("Faltan las credenciales de Cloudinary en el archivo .env.local");
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al subir a Cloudinary');
      }

      const data = await response.json();
      const photoURL = data.secure_url;

      // Update Firestore Profile with the Cloudinary URL
      await updateProfile({ photoURL });
      setSuccess('Foto de perfil actualizada.');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al subir la imagen. Verifica tu conexión e intentá de nuevo.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <ExploreLayout title="Mi Perfil">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 w-full">
        
        {/* Profile Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface border border-glass-border rounded-2xl p-6 sm:p-8 shadow-sm mb-6"
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 text-center sm:text-left">
            
            {/* Avatar Section */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-accent/10 flex items-center justify-center text-3xl text-accent font-black overflow-hidden border-2 border-accent/20">
                {isUploading ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : user?.photoURL ? (
                  <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user?.name.charAt(0).toUpperCase()
                )}
              </div>
              
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute bottom-0 right-0 p-2 bg-accent text-on-primary rounded-full shadow-lg hover:scale-105 transition-transform disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <Camera size={16} />
              </button>
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
            
            {/* User Info */}
            <div className="flex-1 mt-2">
              <h3 className="text-2xl font-bold text-foreground m-0">{user?.name}</h3>
              <p className="text-text-secondary mt-1">{user?.email}</p>
              <span className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-bold bg-success/10 text-success uppercase tracking-wider">
                {user?.role}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-foreground">Nombre completo</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                className="px-4 py-3 rounded-lg border border-glass-border bg-bg-primary text-foreground focus:ring-2 focus:ring-accent focus:outline-none transition-all"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-foreground">Teléfono</label>
              <input
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                disabled={isSubmitting}
                className="px-4 py-3 rounded-lg border border-glass-border bg-bg-primary text-foreground focus:ring-2 focus:ring-accent focus:outline-none transition-all"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-foreground">Email</label>
              <input
                value={user?.email ?? ''}
                disabled
                className="px-4 py-3 rounded-lg border border-glass-border bg-bg-primary/50 text-text-muted cursor-not-allowed"
              />
              <span className="text-xs text-text-secondary">El email no se puede modificar.</span>
            </div>

            {error && (
              <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded-lg text-sm font-medium">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 px-6 py-3 rounded-lg bg-accent text-on-primary font-semibold shadow-glow hover:bg-accent-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto self-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={18} className="animate-spin" /> Guardando...
                </span>
              ) : (
                'Guardar cambios'
              )}
            </button>
          </form>
        </motion.div>

        {/* Danger Zone */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface border border-danger/20 rounded-2xl p-6 sm:p-8"
        >
          <h4 className="text-lg font-bold text-danger mb-2 flex items-center gap-2">
            <LogOut size={20} />
            Cerrar Sesión
          </h4>
          <p className="text-sm text-text-secondary mb-6">
            Se cerrará tu sesión activa en este dispositivo de forma segura.
          </p>
          <button
            onClick={handleLogout}
            className="px-6 py-2.5 rounded-lg border border-danger text-danger font-semibold hover:bg-danger hover:text-white transition-colors"
          >
            Cerrar sesión
          </button>
        </motion.div>
      </div>
    </ExploreLayout>
  );
};

export default ProfilePage;
