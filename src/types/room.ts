export interface Equipment {
  id: string;
  name: string;
  icon: string;
  available: boolean;
}

export interface Room {
  id: string;
  name: string;
  building: string;
  floor: string;
  capacity: number;
  area: number;
  description: string;
  imageUrl: string;
  equipments: Equipment[];
  facilities: string[];
  status: 'available' | 'maintenance' | 'closed';
  openTime: string;
  closeTime: string;
}

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  available: boolean;
  bookingId?: string;
}

export type RoomStatus = 'available' | 'maintenance' | 'closed';
