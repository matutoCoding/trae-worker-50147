import { create } from 'zustand';
import type { Booking, BookingFormData, BookingStatus, EquipmentUsageItem } from '@/types/booking';
import { mockBookings } from '@/data/bookings';
import { checkBookingConflict, checkTimeRangeValid } from '@/utils/conflict';
import { createApprovalRecord, getBookingStatusForApprovalNode } from '@/utils/approvalFlow';
import type { User } from '@/types/user';
import type { Room } from '@/types/room';

const generateId = () => Math.random().toString(36).substring(2, 15);
const generateBookingNo = () => `BK${Date.now().toString().slice(-10)}`;

interface BookingState {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  addBooking: (formData: BookingFormData, user: User, room: Room) => Booking;
  updateBookingStatus: (id: string, status: BookingStatus, updates?: Partial<Booking>) => void;
  cancelBooking: (id: string, reason: string, user: User) => void;
  getBookingById: (id: string) => Booking | undefined;
  getUserBookings: (userId: string) => Booking[];
  getRoomBookings: (roomId: string, date?: string) => Booking[];
  getBookingsByStatus: (status: BookingStatus) => Booking[];
  getBookingsByDate: (date: string) => Booking[];
  checkConflict: (roomId: string, date: string, startTime: string, endTime: string, excludeId?: string) => boolean;
  checkTimeValid: (roomId: string, startTime: string, endTime: string) => { valid: boolean; message: string };
  updateBookingApproval: (id: string, updates: Partial<Booking>) => void;
  checkIn: (id: string) => void;
  checkOut: (id: string) => void;
  updateActualAttendance: (id: string, count: number) => void;
  updateEquipmentUsage: (id: string, equipmentUsage: EquipmentUsageItem[]) => void;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: mockBookings,
  loading: false,
  error: null,

  addBooking: (formData, user, room) => {
    console.log('[BookingStore] Adding new booking:', { room: room.name, date: formData.date });

    const conflict = checkBookingConflict(
      formData.roomId,
      formData.date,
      formData.startTime,
      formData.endTime,
      get().bookings
    );

    if (conflict.hasConflict) {
      throw new Error(conflict.message);
    }

    const timeValid = checkTimeRangeValid(
      formData.startTime,
      formData.endTime,
      room.openTime,
      room.closeTime
    );

    if (!timeValid.valid) {
      throw new Error(timeValid.message);
    }

    const bookingId = generateId();
    const approvalRecord = createApprovalRecord(bookingId);

    const newBooking: Booking = {
      id: bookingId,
      bookingNo: generateBookingNo(),
      roomId: formData.roomId,
      room,
      userId: user.id,
      user,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      purpose: formData.purpose,
      participantCount: formData.participantCount,
      participants: formData.participants,
      equipmentNeeds: formData.equipmentNeeds,
      remarks: formData.remarks,
      status: getBookingStatusForApprovalNode(0),
      approvalRecord,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    set((state) => ({
      bookings: [...state.bookings, newBooking]
    }));

    console.log('[BookingStore] Booking created:', newBooking.bookingNo);
    return newBooking;
  },

  updateBookingStatus: (id, status, updates) => {
    console.log('[BookingStore] Updating booking status:', { id, status });
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === id
          ? { ...b, status, ...updates, updatedAt: new Date().toISOString() }
          : b
      )
    }));
  },

  updateBookingApproval: (id, updates) => {
    console.log('[BookingStore] Updating booking approval:', id);
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === id
          ? { ...b, ...updates, updatedAt: new Date().toISOString() }
          : b
      )
    }));
  },

  cancelBooking: (id, reason, user) => {
    console.log('[BookingStore] Cancelling booking:', { id, reason });
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === id
          ? {
              ...b,
              status: 'cancelled',
              cancelledReason: reason,
              updatedAt: new Date().toISOString()
            }
          : b
      )
    }));
  },

  getBookingById: (id) => {
    return get().bookings.find((b) => b.id === id);
  },

  getUserBookings: (userId) => {
    return get().bookings
      .filter((b) => b.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getRoomBookings: (roomId, date) => {
    return get().bookings.filter((b) => {
      if (b.roomId !== roomId) return false;
      if (date && b.date !== date) return false;
      if (b.status === 'cancelled' || b.status === 'rejected') return false;
      return true;
    });
  },

  getBookingsByStatus: (status) => {
    return get().bookings.filter((b) => b.status === status);
  },

  getBookingsByDate: (date) => {
    return get().bookings.filter((b) => b.date === date && b.status !== 'cancelled' && b.status !== 'rejected');
  },

  checkConflict: (roomId, date, startTime, endTime, excludeId) => {
    const conflict = checkBookingConflict(roomId, date, startTime, endTime, get().bookings, excludeId);
    return conflict.hasConflict;
  },

  checkTimeValid: (roomId, startTime, endTime) => {
    const room = get().rooms.find((b) => b.roomId === roomId)?.room;
    const openTime = room?.openTime || '08:00';
    const closeTime = room?.closeTime || '22:00';
    return checkTimeRangeValid(startTime, endTime, openTime, closeTime);
  },

  checkIn: (id) => {
    console.log('[BookingStore] Checking in:', id);
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === id
          ? {
              ...b,
              status: 'checked_in',
              checkInTime: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          : b
      )
    }));
  },

  checkOut: (id) => {
    console.log('[BookingStore] Checking out:', id);
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === id
          ? {
              ...b,
              status: 'completed',
              checkOutTime: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          : b
      )
    }));
  },

  updateActualAttendance: (id, count) => {
    console.log('[BookingStore] Updating actual attendance:', { id, count });
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === id
          ? {
              ...b,
              actualAttendanceCount: count,
              updatedAt: new Date().toISOString()
            }
          : b
      )
    }));
  },

  updateEquipmentUsage: (id, equipmentUsage) => {
    console.log('[BookingStore] Updating equipment usage:', { id, count: equipmentUsage.length });
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === id
          ? {
              ...b,
              equipmentUsage,
              updatedAt: new Date().toISOString()
            }
          : b
      )
    }));
  }
}));
