import type { ApprovalRecord } from '@/types/approval';

export const mockApprovals: ApprovalRecord[] = [
  {
    id: 'a001',
    bookingId: 'b001',
    nodes: [
      {
        id: 'n001',
        bookingId: 'b001',
        nodeType: 'leader',
        nodeName: '组长审批',
        approverId: 'u002',
        approverName: '李组长',
        status: 'approved',
        comment: '同意，项目讨论必要',
        createdAt: '2026-06-15 10:30:00',
        processedAt: '2026-06-15 11:00:00',
        order: 1
      },
      {
        id: 'n002',
        bookingId: 'b001',
        nodeType: 'counselor',
        nodeName: '辅导员审批',
        approverId: 'u003',
        approverName: '王辅导员',
        status: 'approved',
        comment: '同意，请合理安排时间',
        createdAt: '2026-06-15 11:00:00',
        processedAt: '2026-06-15 14:30:00',
        order: 2
      },
      {
        id: 'n003',
        bookingId: 'b001',
        nodeType: 'admin',
        nodeName: '管理员审批',
        approverId: 'u004',
        approverName: '赵管理员',
        status: 'approved',
        comment: '已安排，请准时使用',
        createdAt: '2026-06-15 14:30:00',
        processedAt: '2026-06-15 16:00:00',
        order: 3
      }
    ],
    currentNodeIndex: 3,
    overallStatus: 'completed',
    createdAt: '2026-06-15 10:30:00',
    updatedAt: '2026-06-15 16:00:00'
  },
  {
    id: 'a002',
    bookingId: 'b002',
    nodes: [
      {
        id: 'n004',
        bookingId: 'b002',
        nodeType: 'leader',
        nodeName: '组长审批',
        approverId: 'u002',
        approverName: '李组长',
        status: 'approved',
        comment: '同意，答辩重要',
        createdAt: '2026-06-16 14:20:00',
        processedAt: '2026-06-16 15:00:00',
        order: 1
      },
      {
        id: 'n005',
        bookingId: 'b002',
        nodeType: 'counselor',
        nodeName: '辅导员审批',
        approverId: 'u003',
        approverName: '王辅导员',
        status: 'approved',
        comment: '同意，祝答辩顺利',
        createdAt: '2026-06-16 15:00:00',
        processedAt: '2026-06-17 08:30:00',
        order: 2
      },
      {
        id: 'n006',
        bookingId: 'b002',
        nodeType: 'admin',
        nodeName: '管理员审批',
        approverId: 'u004',
        approverName: '赵管理员',
        status: 'approved',
        comment: '已确认设备可用',
        createdAt: '2026-06-17 08:30:00',
        processedAt: '2026-06-17 09:30:00',
        order: 3
      }
    ],
    currentNodeIndex: 3,
    overallStatus: 'completed',
    createdAt: '2026-06-16 14:20:00',
    updatedAt: '2026-06-17 09:30:00'
  },
  {
    id: 'a003',
    bookingId: 'b003',
    nodes: [
      {
        id: 'n007',
        bookingId: 'b003',
        nodeType: 'leader',
        nodeName: '组长审批',
        approverId: 'u002',
        approverName: '李组长',
        status: 'approved',
        comment: '同意，创新项目需要',
        createdAt: '2026-06-17 16:45:00',
        processedAt: '2026-06-17 17:00:00',
        order: 1
      },
      {
        id: 'n008',
        bookingId: 'b003',
        nodeType: 'counselor',
        nodeName: '辅导员审批',
        status: 'pending',
        createdAt: '2026-06-17 17:00:00',
        order: 2
      },
      {
        id: 'n009',
        bookingId: 'b003',
        nodeType: 'admin',
        nodeName: '管理员审批',
        status: 'pending',
        createdAt: '2026-06-17 17:00:00',
        order: 3
      }
    ],
    currentNodeIndex: 1,
    overallStatus: 'pending',
    createdAt: '2026-06-17 16:45:00',
    updatedAt: '2026-06-17 17:20:00'
  },
  {
    id: 'a004',
    bookingId: 'b004',
    nodes: [
      {
        id: 'n010',
        bookingId: 'b004',
        nodeType: 'leader',
        nodeName: '组长审批',
        approverId: 'u002',
        approverName: '李组长',
        status: 'approved',
        comment: '同意，论文答辩重要',
        createdAt: '2026-06-14 09:00:00',
        processedAt: '2026-06-14 10:00:00',
        order: 1
      },
      {
        id: 'n011',
        bookingId: 'b004',
        nodeType: 'counselor',
        nodeName: '辅导员审批',
        approverId: 'u003',
        approverName: '王辅导员',
        status: 'approved',
        comment: '同意',
        createdAt: '2026-06-14 10:00:00',
        processedAt: '2026-06-14 14:00:00',
        order: 2
      },
      {
        id: 'n012',
        bookingId: 'b004',
        nodeType: 'admin',
        nodeName: '管理员审批',
        approverId: 'u004',
        approverName: '赵管理员',
        status: 'approved',
        comment: '已安排录播设备',
        createdAt: '2026-06-14 14:00:00',
        processedAt: '2026-06-15 11:30:00',
        order: 3
      }
    ],
    currentNodeIndex: 3,
    overallStatus: 'completed',
    createdAt: '2026-06-14 09:00:00',
    updatedAt: '2026-06-15 11:30:00'
  },
  {
    id: 'a005',
    bookingId: 'b005',
    nodes: [
      {
        id: 'n013',
        bookingId: 'b005',
        nodeType: 'leader',
        nodeName: '组长审批',
        status: 'pending',
        createdAt: '2026-06-18 10:00:00',
        order: 1
      },
      {
        id: 'n014',
        bookingId: 'b005',
        nodeType: 'counselor',
        nodeName: '辅导员审批',
        status: 'pending',
        createdAt: '2026-06-18 10:00:00',
        order: 2
      },
      {
        id: 'n015',
        bookingId: 'b005',
        nodeType: 'admin',
        nodeName: '管理员审批',
        status: 'pending',
        createdAt: '2026-06-18 10:00:00',
        order: 3
      }
    ],
    currentNodeIndex: 0,
    overallStatus: 'pending',
    createdAt: '2026-06-18 10:00:00',
    updatedAt: '2026-06-18 10:00:00'
  },
  {
    id: 'a006',
    bookingId: 'b006',
    nodes: [
      {
        id: 'n016',
        bookingId: 'b006',
        nodeType: 'leader',
        nodeName: '组长审批',
        approverId: 'u002',
        approverName: '李组长',
        status: 'approved',
        comment: '同意',
        createdAt: '2026-06-17 20:00:00',
        processedAt: '2026-06-17 21:00:00',
        order: 1
      },
      {
        id: 'n017',
        bookingId: 'b006',
        nodeType: 'counselor',
        nodeName: '辅导员审批',
        approverId: 'u003',
        approverName: '王辅导员',
        status: 'approved',
        comment: '同意，学习氛围好',
        createdAt: '2026-06-17 21:00:00',
        processedAt: '2026-06-18 08:00:00',
        order: 2
      },
      {
        id: 'n018',
        bookingId: 'b006',
        nodeType: 'admin',
        nodeName: '管理员审批',
        approverId: 'u004',
        approverName: '赵管理员',
        status: 'approved',
        comment: '已确认',
        createdAt: '2026-06-18 08:00:00',
        processedAt: '2026-06-18 09:00:00',
        order: 3
      }
    ],
    currentNodeIndex: 3,
    overallStatus: 'completed',
    createdAt: '2026-06-17 20:00:00',
    updatedAt: '2026-06-18 09:00:00'
  },
  {
    id: 'a007',
    bookingId: 'b007',
    nodes: [
      {
        id: 'n019',
        bookingId: 'b007',
        nodeType: 'leader',
        nodeName: '组长审批',
        approverId: 'u002',
        approverName: '李组长',
        status: 'rejected',
        comment: '该时段已被其他团队预约，请选择其他时段',
        createdAt: '2026-06-14 15:30:00',
        processedAt: '2026-06-14 16:00:00',
        order: 1
      },
      {
        id: 'n020',
        bookingId: 'b007',
        nodeType: 'counselor',
        nodeName: '辅导员审批',
        status: 'skipped',
        createdAt: '2026-06-14 15:30:00',
        order: 2
      },
      {
        id: 'n021',
        bookingId: 'b007',
        nodeType: 'admin',
        nodeName: '管理员审批',
        status: 'skipped',
        createdAt: '2026-06-14 15:30:00',
        order: 3
      }
    ],
    currentNodeIndex: 0,
    overallStatus: 'rejected',
    createdAt: '2026-06-14 15:30:00',
    updatedAt: '2026-06-14 16:00:00'
  },
  {
    id: 'a008',
    bookingId: 'b008',
    nodes: [
      {
        id: 'n022',
        bookingId: 'b008',
        nodeType: 'leader',
        nodeName: '组长审批',
        approverId: 'u002',
        approverName: '李组长',
        status: 'approved',
        comment: '同意',
        createdAt: '2026-06-12 09:00:00',
        processedAt: '2026-06-12 10:00:00',
        order: 1
      },
      {
        id: 'n023',
        bookingId: 'b008',
        nodeType: 'counselor',
        nodeName: '辅导员审批',
        approverId: 'u003',
        approverName: '王辅导员',
        status: 'approved',
        comment: '同意',
        createdAt: '2026-06-12 10:00:00',
        processedAt: '2026-06-12 14:00:00',
        order: 2
      },
      {
        id: 'n024',
        bookingId: 'b008',
        nodeType: 'admin',
        nodeName: '管理员审批',
        approverId: 'u004',
        approverName: '赵管理员',
        status: 'approved',
        comment: '已安排',
        createdAt: '2026-06-12 14:00:00',
        processedAt: '2026-06-12 16:00:00',
        order: 3
      }
    ],
    currentNodeIndex: 3,
    overallStatus: 'completed',
    createdAt: '2026-06-12 09:00:00',
    updatedAt: '2026-06-19 08:00:00'
  }
];
