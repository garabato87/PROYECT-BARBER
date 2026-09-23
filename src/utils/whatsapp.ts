/**
 * Generates a WhatsApp deep link (wa.me) to send a message to a client.
 * @param phone Client's phone number
 * @param name Client's name
 * @returns Formatted URL or empty string if phone is missing
 */
export const buildWhatsAppUrl = (phone?: string, name?: string): string => {
  if (!phone) return '';
  
  // Clean phone: keep only numbers and a leading '+' if present
  const cleanPhone = phone.replace(/(?!^\+)[^\d]/g, '');
  
  const text = name ? `Hola ${name.trim()}, ` : 'Hola, ';
  const encodedText = encodeURIComponent(text);
  
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
};
