export type UserRole = 'student' | 'leader' | 'counselor' | 'admin';

export interface User {
  id: string;
  name: string;
  studentId?: string;
  phone: string;
  department: string;
  major?: string;
  grade?: string;
  role: UserRole;
  avatar?: string;
}

export interface BorrowRecord {
  id: string;
  bookingId: string;
  equipmentId: string;
  equipmentName: string;
  borrowTime: string;
  returnTime?: string;
  status: 'borrowed' | 'returned';
  borrowerId: string;
  borrowerName: string;
}
