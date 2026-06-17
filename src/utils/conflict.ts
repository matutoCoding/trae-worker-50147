import type { Booking, BookingConflict } from '@/types/booking';
import { timeToMinutes } from './date';

export const checkTimeConflict = (
  startTime1: string,
  endTime1: string,
  startTime2: string,
  endTime2: string
): boolean => {
  const start1 = timeToMinutes(startTime1);
  const end1 = timeToMinutes(endTime1);
  const start2 = timeToMinutes(startTime2);
  const end2 = timeToMinutes(endTime2);

  return !(end1 <= start2 || end2 <= start1);
};

export const checkBookingConflict = (
  roomId: string,
  date: string,
  startTime: string,
  endTime: string,
  existingBookings: Booking[],
  excludeBookingId?: string
): BookingConflict => {
  console.log('[Conflict] Checking conflict for:', { roomId, date, startTime, endTime, excludeBookingId });

  const sameRoomBookings = existingBookings.filter(booking => {
    if (booking.id === excludeBookingId) return false;
    if (booking.roomId !== roomId) return false;
    if (booking.date !== date) return false;
    if (booking.status === 'cancelled' || booking.status === 'rejected') return false;
    return true;
  });

  const conflictingBookings: Booking[] = [];

  for (const booking of sameRoomBookings) {
    if (checkTimeConflict(startTime, endTime, booking.startTime, booking.endTime)) {
      conflictingBookings.push(booking);
    }
  }

  if (conflictingBookings.length > 0) {
    const conflictInfo = conflictingBookings
      .map(b => `${b.startTime}-${b.endTime} (${b.user.name})`)
      .join('、');
    const message = `该时段已被预约：${conflictInfo}`;
    console.log('[Conflict] Found conflict:', message);
    return {
      hasConflict: true,
      conflictingBookings,
      message
    };
  }

  console.log('[Conflict] No conflict found');
  return {
    hasConflict: false,
    conflictingBookings: [],
    message: ''
  };
};

export const checkTimeRangeValid = (
  startTime: string,
  endTime: string,
  openTime: string = '08:00',
  closeTime: string = '22:00'
): { valid: boolean; message: string } => {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  const open = timeToMinutes(openTime);
  const close = timeToMinutes(closeTime);

  if (start >= end) {
    return { valid: false, message: '结束时间必须晚于开始时间' };
  }

  if (start < open) {
    return { valid: false, message: `预约时间不能早于开放时间 ${openTime}` };
  }

  if (end > close) {
    return { valid: false, message: `预约时间不能晚于关闭时间 ${closeTime}` };
  }

  return { valid: true, message: '' };
};

export const getAvailableTimeSlots = (
  date: string,
  roomId: string,
  existingBookings: Booking[],
  openTime: string = '08:00',
  closeTime: string = '22:00',
  interval: number = 60
): Array<{
  startTime: string;
  endTime: string;
  available: boolean;
  bookingId?: string;
  conflictInfo?: string;
}> => {
  const slots: Array<{
    startTime: string;
    endTime: string;
    available: boolean;
    bookingId?: string;
    conflictInfo?: string;
  }> = [];

  const open = timeToMinutes(openTime);
  const close = timeToMinutes(closeTime);

  for (let time = open; time < close; time += interval) {
    const slotStart = time;
    const slotEnd = time + interval;

    if (slotEnd > close) break;

    const startTime = `${String(Math.floor(slotStart / 60)).padStart(2, '0')}:${String(slotStart % 60).padStart(2, '0')}`;
    const endTime = `${String(Math.floor(slotEnd / 60)).padStart(2, '0')}:${String(slotEnd % 60).padStart(2, '0')}`;

    const conflict = checkBookingConflict(roomId, date, startTime, endTime, existingBookings);

    slots.push({
      startTime,
      endTime,
      available: !conflict.hasConflict,
      bookingId: conflict.conflictingBookings[0]?.id,
      conflictInfo: conflict.message
    });
  }

  return slots;
};
