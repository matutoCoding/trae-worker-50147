import type { Room } from './room';
import type { User } from './user';
import type { ApprovalRecord } from './approval';

export type BookingStatus = 
  | 'draft'
  | 'pending_leader'
  | 'pending_counselor'
  | 'pending_admin'
  | 'approved'
  | 'checked_in'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export interface BookingFormData {
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  participantCount: number;
  participants: string[];
  equipmentNeeds: string[];
  remarks?: string;
}

export interface EquipmentUsageItem {
  equipmentId: string;
  equipmentName: string;
  borrowed: boolean;
  returned: boolean;
  borrowTime?: string;
  returnTime?: string;
}

export interface Booking {
  id: string;
  bookingNo: string;
  roomId: string;
  room: Room;
  userId: string;
  user: User;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  participantCount: number;
  participants: string[];
  equipmentNeeds: string[];
  remarks?: string;
  status: BookingStatus;
  approvalRecord?: ApprovalRecord;
  checkInTime?: string;
  checkOutTime?: string;
  actualAttendanceCount?: number;
  equipmentUsage?: EquipmentUsageItem[];
  cancelledReason?: string;
  rejectedReason?: string;
  rejectedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingConflict {
  hasConflict: boolean;
  conflictingBookings: Booking[];
  message: string;
}

export const BOOKING_STATUS_MAP: Record<BookingStatus, { label: string; color: string }> = {
  draft: { label: '草稿', color: '#8C8C8C' },
  pending_leader: { label: '待组长审批', color: '#FAAD14' },
  pending_counselor: { label: '待辅导员审批', color: '#FAAD14' },
  pending_admin: { label: '待管理员审批', color: '#FAAD14' },
  approved: { label: '已通过', color: '#52C41A' },
  checked_in: { label: '使用中', color: '#722ED1' },
  completed: { label: '已完成', color: '#8C8C8C' },
  rejected: { label: '已驳回', color: '#FF4D4F' },
  cancelled: { label: '已取消', color: '#8C8C8C' }
};
