import { create } from 'zustand';
import type { Room } from '@/types/room';
import { mockRooms } from '@/data/rooms';

interface RoomState {
  rooms: Room[];
  selectedRoom: Room | null;
  loading: boolean;
  error: string | null;
  setRooms: (rooms: Room[]) => void;
  setSelectedRoom: (room: Room | null) => void;
  getRoomById: (id: string) => Room | undefined;
  getAvailableRooms: () => Room[];
  getRoomsByCapacity: (minCapacity: number) => Room[];
  filterRooms: (filters: {
    building?: string;
    floor?: string;
    minCapacity?: number;
    hasEquipment?: string[];
  }) => Room[];
}

export const useRoomStore = create<RoomState>((set, get) => ({
  rooms: mockRooms,
  selectedRoom: null,
  loading: false,
  error: null,

  setRooms: (rooms) => set({ rooms }),

  setSelectedRoom: (room) => {
    console.log('[RoomStore] Setting selected room:', room?.name);
    set({ selectedRoom: room });
  },

  getRoomById: (id) => {
    return get().rooms.find((r) => r.id === id);
  },

  getAvailableRooms: () => {
    return get().rooms.filter((r) => r.status === 'available');
  },

  getRoomsByCapacity: (minCapacity) => {
    return get().rooms.filter((r) => r.capacity >= minCapacity && r.status === 'available');
  },

  filterRooms: (filters) => {
    const { building, floor, minCapacity, hasEquipment } = filters;
    return get().rooms.filter((room) => {
      if (room.status !== 'available') return false;
      if (building && room.building !== building) return false;
      if (floor && room.floor !== floor) return false;
      if (minCapacity && room.capacity < minCapacity) return false;
      if (hasEquipment && hasEquipment.length > 0) {
        const roomEquipmentNames = room.equipments.map((e) => e.name);
        const hasAllEquipment = hasEquipment.every((eq) => roomEquipmentNames.includes(eq));
        if (!hasAllEquipment) return false;
      }
      return true;
    });
  }
}));
