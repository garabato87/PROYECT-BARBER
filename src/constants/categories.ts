import type { BusinessCategory } from '../types';

export const BUSINESS_CATEGORIES: Record<BusinessCategory, { label: string; emoji: string }> = {
  barberia:    { label: 'Barbería',          emoji: '✂️' },
  peluqueria:  { label: 'Peluquería',        emoji: '💇' },
  spa:         { label: 'Spa & Relajación',  emoji: '🧖' },
  estetica:    { label: 'Estética',          emoji: '✨' },
  unas:        { label: 'Uñas & Manicuría',  emoji: '💅' },
  pestanas:    { label: 'Pestañas & Cejas',  emoji: '👁️' },
  maquillaje:  { label: 'Maquillaje',        emoji: '💄' },
  estilismo:   { label: 'Estilismo',         emoji: '🪞' },
  masajes:     { label: 'Masajes',           emoji: '🤲' },
  otro:        { label: 'Otro servicio',     emoji: '🏪' },
};
