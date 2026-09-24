/* eslint-disable */
const STORAGE_KEY = 'pending_booking';

export const savePendingBooking = (bookingData: any) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(bookingData));
  } catch (err) {
    console.warn('No se pudo guardar la sesión de reserva temporal', err);
  }
};

export const getPendingBooking = () => {
  try {
    const data = sessionStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.warn('No se pudo recuperar la sesión de reserva temporal', err);
    return null;
  }
};

export const clearPendingBooking = () => {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('No se pudo limpiar la sesión de reserva temporal', err);
  }
};
