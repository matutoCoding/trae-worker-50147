import type { User, BorrowRecord } from '@/types/user';

export const mockCurrentUser: User = {
  id: 'u001',
  name: '张三',
  studentId: '2024001',
  phone: '13800138001',
  department: '计算机科学与技术学院',
  major: '软件工程',
  grade: '2021级',
  role: 'student',
  avatar: 'https://picsum.photos/id/64/200/200'
};

export const mockUsers: User[] = [
  mockCurrentUser,
  {
    id: 'u002',
    name: '李组长',
    phone: '13800138002',
    department: '计算机科学与技术学院',
    role: 'leader',
    avatar: 'https://picsum.photos/id/91/200/200'
  },
  {
    id: 'u003',
    name: '王辅导员',
    phone: '13800138003',
    department: '计算机科学与技术学院',
    role: 'counselor',
    avatar: 'https://picsum.photos/id/177/200/200'
  },
  {
    id: 'u004',
    name: '赵管理员',
    phone: '13800138004',
    department: '图书馆',
    role: 'admin',
    avatar: 'https://picsum.photos/id/338/200/200'
  },
  {
    id: 'u005',
    name: '李四',
    studentId: '2024002',
    phone: '13800138005',
    department: '计算机科学与技术学院',
    major: '计算机科学',
    grade: '2021级',
    role: 'student',
    avatar: 'https://picsum.photos/id/1027/200/200'
  },
  {
    id: 'u006',
    name: '王五',
    studentId: '2024003',
    phone: '13800138006',
    department: '计算机科学与技术学院',
    major: '人工智能',
    grade: '2022级',
    role: 'student',
    avatar: 'https://picsum.photos/id/237/200/200'
  }
];

export const mockBorrowRecords: BorrowRecord[] = [
  {
    id: 'br001',
    bookingId: 'b001',
    equipmentId: 'e001',
    equipmentName: '投影仪',
    borrowTime: '2026-06-18 09:00:00',
    returnTime: '2026-06-18 11:30:00',
    status: 'returned',
    borrowerId: 'u001',
    borrowerName: '张三'
  },
  {
    id: 'br002',
    bookingId: 'b002',
    equipmentId: 'e002',
    equipmentName: '白板笔',
    borrowTime: '2026-06-18 14:00:00',
    status: 'borrowed',
    borrowerId: 'u001',
    borrowerName: '张三'
  },
  {
    id: 'br003',
    bookingId: 'b003',
    equipmentId: 'e003',
    equipmentName: '笔记本电脑',
    borrowTime: '2026-06-17 10:00:00',
    returnTime: '2026-06-17 12:00:00',
    status: 'returned',
    borrowerId: 'u001',
    borrowerName: '张三'
  }
];
