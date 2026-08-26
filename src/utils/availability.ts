export interface WorkingDay {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface Appointment {
  id?: string;
  barbershopId: string;
  clientId?: string;
  clientName?: string;
  clientPhone?: string;
  professionalId: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'absent';
  createdAt?: any;
}

export interface Professional {
  id?: string;
  name: string;
  email: string;
  photoUrl?: string;
  isActive?: boolean;
  workingDays?: Record<number, WorkingDay>;
}

export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Calculates available time slots for a professional on a specific date.
 */
export function getAvailableSlots(
  date: Date,
  professional: Professional,
  appointments: Appointment[],
  serviceDurationMins: number = 30, // Default duration if not specified
  slotIntervalMins: number = 30     // How often a slot can start (e.g. every 30 mins)
): string[] {
  // 1. If not active, no slots
  if (professional.isActive === false) return [];

  // 2. Check if working on this day of the week
  const dayOfWeek = date.getDay(); // 0 for Sunday
  const dayConfig = professional.workingDays?.[dayOfWeek];
  
  if (!dayConfig || !dayConfig.isOpen) return [];

  // 3. Generate possible slots
  const openMins = timeToMinutes(dayConfig.openTime);
  const closeMins = timeToMinutes(dayConfig.closeTime);
  
  const possibleSlots: string[] = [];
  
  // Current time logic (don't show past times if date is today)
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const currentMins = now.getHours() * 60 + now.getMinutes();

  for (let min = openMins; min + serviceDurationMins <= closeMins; min += slotIntervalMins) {
    if (isToday && min <= currentMins) {
      continue; // Skip past slots today
    }
    
    const slotStart = min;
    const slotEnd = min + serviceDurationMins;
    
    // Check overlap with appointments
    const hasOverlap = appointments.some(app => {
      // Only consider active appointments
      if (app.status === 'cancelled' || app.status === 'absent') return false;
      
      const appStart = timeToMinutes(app.startTime);
      const appEnd = timeToMinutes(app.endTime);
      
      // Overlap logic: start1 < end2 AND start2 < end1
      return Math.max(slotStart, appStart) < Math.min(slotEnd, appEnd);
    });

    if (!hasOverlap) {
      possibleSlots.push(minutesToTime(slotStart));
    }
  }

  return possibleSlots;
}
