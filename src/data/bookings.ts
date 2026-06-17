import type { Booking } from '@/types/booking';
import { mockRooms } from './rooms';
import { mockCurrentUser, mockUsers } from './users';
import { mockApprovals } from './approvals';

export const mockBookings: Booking[] = [
  {
    id: 'b001',
    bookingNo: 'BK20260618001',
    roomId: 'r001',
    room: mockRooms[0],
    userId: 'u001',
    user: mockCurrentUser,
    date: '2026-06-18',
    startTime: '09:00',
    endTime: '11:00',
    purpose: '项目小组讨论 - 期末项目评审准备',
    participantCount: 4,
    participants: ['张三', '李四', '王五', '赵六'],
    equipmentNeeds: ['投影仪', '白板笔'],
    remarks: '需要准备会议材料',
    status: 'completed',
    approvalRecord: mockApprovals[0],
    checkInTime: '2026-06-18 09:00:00',
    checkOutTime: '2026-06-18 11:00:00',
    createdAt: '2026-06-15 10:30:00',
    updatedAt: '2026-06-18 11:00:00'
  },
  {
    id: 'b002',
    bookingNo: 'BK20260618002',
    roomId: 'r001',
    room: mockRooms[0],
    userId: 'u001',
    user: mockCurrentUser,
    date: '2026-06-18',
    startTime: '14:00',
    endTime: '16:00',
    purpose: '课程设计答辩',
    participantCount: 5,
    participants: ['张三', '李四', '王五', '钱七', '孙八'],
    equipmentNeeds: ['投影仪', '白板笔', '笔记本电脑'],
    remarks: '请确保投影仪正常工作',
    status: 'approved',
    approvalRecord: mockApprovals[1],
    createdAt: '2026-06-16 14:20:00',
    updatedAt: '2026-06-17 09:30:00'
  },
  {
    id: 'b003',
    bookingNo: 'BK20260618003',
    roomId: 'r002',
    room: mockRooms[1],
    userId: 'u001',
    user: mockCurrentUser,
    date: '2026-06-19',
    startTime: '10:00',
    endTime: '12:00',
    purpose: '头脑风暴会议 - 创新创业项目',
    participantCount: 6,
    participants: ['张三', '李四', '王五', '周九', '吴十', '郑十一'],
    equipmentNeeds: ['白板笔'],
    status: 'pending_counselor',
    approvalRecord: mockApprovals[2],
    createdAt: '2026-06-17 16:45:00',
    updatedAt: '2026-06-17 17:20:00'
  },
  {
    id: 'b004',
    bookingNo: 'BK20260618004',
    roomId: 'r003',
    room: mockRooms[2],
    userId: 'u005',
    user: mockUsers[4],
    date: '2026-06-18',
    startTime: '09:00',
    endTime: '11:00',
    purpose: '论文答辩',
    participantCount: 8,
    participants: ['李四', '王老师', '李老师', '张老师', '刘老师', '陈老师', '杨老师', '黄老师'],
    equipmentNeeds: ['投影仪', '麦克风', '激光翻页笔'],
    status: 'approved',
    approvalRecord: mockApprovals[3],
    createdAt: '2026-06-14 09:00:00',
    updatedAt: '2026-06-15 11:30:00'
  },
  {
    id: 'b005',
    bookingNo: 'BK20260618005',
    roomId: 'r002',
    room: mockRooms[1],
    userId: 'u001',
    user: mockCurrentUser,
    date: '2026-06-20',
    startTime: '14:00',
    endTime: '17:00',
    purpose: '项目中期检查',
    participantCount: 4,
    participants: ['张三', '李四', '王五', '指导老师'],
    equipmentNeeds: ['投影仪', '笔记本电脑'],
    status: 'pending_leader',
    approvalRecord: mockApprovals[4],
    createdAt: '2026-06-18 10:00:00',
    updatedAt: '2026-06-18 10:00:00'
  },
  {
    id: 'b006',
    bookingNo: 'BK20260618006',
    roomId: 'r004',
    room: mockRooms[3],
    userId: 'u006',
    user: mockUsers[5],
    date: '2026-06-18',
    startTime: '15:00',
    endTime: '17:00',
    purpose: '算法刷题小组',
    participantCount: 3,
    participants: ['王五', '陈十二', '刘十三'],
    equipmentNeeds: [],
    status: 'checked_in',
    approvalRecord: mockApprovals[5],
    checkInTime: '2026-06-18 15:00:00',
    createdAt: '2026-06-17 20:00:00',
    updatedAt: '2026-06-18 15:00:00'
  },
  {
    id: 'b007',
    bookingNo: 'BK20260618007',
    roomId: 'r006',
    room: mockRooms[5],
    userId: 'u001',
    user: mockCurrentUser,
    date: '2026-06-16',
    startTime: '10:00',
    endTime: '12:00',
    purpose: '团队周会',
    participantCount: 5,
    participants: ['张三', '李四', '王五', '赵六', '钱七'],
    equipmentNeeds: ['投影仪', '白板笔'],
    status: 'rejected',
    approvalRecord: mockApprovals[6],
    rejectedReason: '该时段已被其他团队预约，请选择其他时段',
    rejectedBy: '李组长',
    createdAt: '2026-06-14 15:30:00',
    updatedAt: '2026-06-14 16:00:00'
  },
  {
    id: 'b008',
    bookingNo: 'BK20260618008',
    roomId: 'r001',
    room: mockRooms[0],
    userId: 'u001',
    user: mockCurrentUser,
    date: '2026-06-21',
    startTime: '09:00',
    endTime: '12:00',
    purpose: '期末复习小组',
    participantCount: 4,
    participants: ['张三', '李四', '王五', '赵六'],
    equipmentNeeds: ['白板笔'],
    status: 'cancelled',
    approvalRecord: mockApprovals[7],
    cancelledReason: '复习计划调整，改为线上进行',
    createdAt: '2026-06-12 09:00:00',
    updatedAt: '2026-06-19 08:00:00'
  }
];

export const generateTimeSlots = (openTime: string = '08:00', closeTime: string = '22:00', interval: number = 60) => {
  const slots: Array<{ startTime: string; endTime: string }> = [];
  const [openHour, openMin] = openTime.split(':').map(Number);
  const [closeHour, closeMin] = closeTime.split(':').map(Number);
  
  let currentHour = openHour;
  let currentMin = openMin;
  
  while (currentHour < closeHour || (currentHour === closeHour && currentMin < closeMin)) {
    const endHour = currentMin + interval >= 60 ? currentHour + 1 : currentHour;
    const endMin = (currentMin + interval) % 60;
    
    if (endHour > closeHour || (endHour === closeHour && endMin > closeMin)) {
      break;
    }
    
    slots.push({
      startTime: `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`,
      endTime: `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`
    });
    
    currentHour = endHour;
    currentMin = endMin;
  }
  
  return slots;
};
