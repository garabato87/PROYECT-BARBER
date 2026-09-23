import React from 'react';
import type { BusinessCategory } from '../types';
import { Scissors, Sparkles, Eye, Brush, Heart, Store, Droplets, Palette, ScissorsSquare, Sparkle } from 'lucide-react';

export const BUSINESS_CATEGORIES: Record<BusinessCategory, { label: string; icon: React.ReactNode }> = {
  barberia:    { label: 'Barbería',          icon: <Scissors size={18} /> },
  peluqueria:  { label: 'Peluquería',        icon: <Palette size={18} /> },
  spa:         { label: 'Spa & Relajación',  icon: <Droplets size={18} /> },
  estetica:    { label: 'Estética',          icon: <Sparkles size={18} /> },
  unas:        { label: 'Uñas & Manicuría',  icon: <Sparkle size={18} /> },
  pestanas:    { label: 'Pestañas & Cejas',  icon: <Eye size={18} /> },
  maquillaje:  { label: 'Maquillaje',        icon: <Brush size={18} /> },
  estilismo:   { label: 'Estilismo',         icon: <ScissorsSquare size={18} /> },
  masajes:     { label: 'Masajes',           icon: <Heart size={18} /> },
  otro:        { label: 'Otro servicio',     icon: <Store size={18} /> },
};
