/* eslint-disable */
import { describe, it, expect, beforeEach } from 'vitest';
import { savePendingBooking, getPendingBooking, clearPendingBooking } from './bookingSession';

describe('Booking Session Persistence', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('should save and retrieve a pending booking', () => {
    const bookingData = { shopId: 'shop1', service: { id: 's1' }, professional: { id: 'p1' }, date: '2025-10-10', time: '14:00' };
    savePendingBooking(bookingData);
    expect(getPendingBooking()).toEqual(bookingData);
  });

  it('should clear the pending booking', () => {
    savePendingBooking({ shopId: 'shop1' } as any);
    clearPendingBooking();
    expect(getPendingBooking()).toBeNull();
  });
});
