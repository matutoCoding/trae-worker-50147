import { create } from 'zustand';
import type { ApprovalRecord } from '@/types/approval';
import { mockApprovals } from '@/data/approvals';
import { approveNode, rejectNode, canApprove } from '@/utils/approvalFlow';
import type { User } from '@/types/user';
import { useBookingStore } from './useBookingStore';

interface ApprovalState {
  approvals: ApprovalRecord[];
  approve: (approvalId: string, approver: User, comment?: string) => void;
  reject: (approvalId: string, approver: User, reason: string) => void;
  getApprovalById: (id: string) => ApprovalRecord | undefined;
  getApprovalByBookingId: (bookingId: string) => ApprovalRecord | undefined;
  getUserPendingApprovals: (user: User) => ApprovalRecord[];
  canUserApprove: (user: User, approvalRecord: ApprovalRecord) => boolean;
}

export const useApprovalStore = create<ApprovalState>((set, get) => ({
  approvals: mockApprovals,

  approve: (approvalId, approver, comment) => {
    console.log('[ApprovalStore] Approving:', { approvalId, approver: approver.name });

    const approval = get().getApprovalById(approvalId);
    if (!approval) {
      throw new Error('审批记录不存在');
    }

    if (!canApprove(approver, approval)) {
      throw new Error('您没有权限审批此申请');
    }

    const { approvalRecord: updatedApproval, newStatus } = approveNode(approval, approver, comment);

    set((state) => ({
      approvals: state.approvals.map((a) =>
        a.id === approvalId ? updatedApproval : a
      )
    }));

    if (newStatus) {
      const bookingStore = useBookingStore.getState();
      bookingStore.updateBookingApproval(approval.bookingId, {
        status: newStatus,
        approvalRecord: updatedApproval
      });
    }

    console.log('[ApprovalStore] Approved successfully');
  },

  reject: (approvalId, approver, reason) => {
    console.log('[ApprovalStore] Rejecting:', { approvalId, approver: approver.name, reason });

    const approval = get().getApprovalById(approvalId);
    if (!approval) {
      throw new Error('审批记录不存在');
    }

    if (!canApprove(approver, approval)) {
      throw new Error('您没有权限审批此申请');
    }

    const { approvalRecord: updatedApproval, newStatus } = rejectNode(approval, approver, reason);

    set((state) => ({
      approvals: state.approvals.map((a) =>
        a.id === approvalId ? updatedApproval : a
      )
    }));

    const bookingStore = useBookingStore.getState();
    bookingStore.updateBookingApproval(approval.bookingId, {
      status: newStatus,
      approvalRecord: updatedApproval,
      rejectedReason: reason,
      rejectedBy: approver.name
    });

    console.log('[ApprovalStore] Rejected successfully');
  },

  getApprovalById: (id) => {
    return get().approvals.find((a) => a.id === id);
  },

  getApprovalByBookingId: (bookingId) => {
    return get().approvals.find((a) => a.bookingId === bookingId);
  },

  getUserPendingApprovals: (user) => {
    return get().approvals.filter((a) => canApprove(user, a));
  },

  canUserApprove: (user, approvalRecord) => {
    return canApprove(user, approvalRecord);
  }
}));
