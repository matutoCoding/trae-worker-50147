import { create } from 'zustand';
import type { ApprovalRecord } from '@/types/approval';
import { mockApprovals } from '@/data/approvals';
import { approveNode, rejectNode, rollbackToPreviousNode, canApprove } from '@/utils/approvalFlow';
import type { User } from '@/types/user';
import { useBookingStore } from './useBookingStore';
import type { BookingStatus } from '@/types/booking';

export interface ApproveResult {
  approvalRecord: ApprovalRecord;
  newStatus: BookingStatus | null;
}

interface ApprovalState {
  approvals: ApprovalRecord[];
  approve: (approvalId: string, approver: User, comment?: string) => ApproveResult | null;
  reject: (approvalId: string, approver: User, reason: string) => ApproveResult | null;
  rollback: (approvalId: string, reason: string) => ApproveResult | null;
  approveBooking: (bookingId: string, approver: User, comment?: string) => ApproveResult | null;
  rejectBooking: (bookingId: string, approver: User, reason: string) => ApproveResult | null;
  rollbackBooking: (bookingId: string, reason: string) => ApproveResult | null;
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
    return { approvalRecord: updatedApproval, newStatus };
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
    return { approvalRecord: updatedApproval, newStatus };
  },

  rollback: (approvalId, reason) => {
    console.log('[ApprovalStore] Rolling back:', { approvalId, reason });

    const approval = get().getApprovalById(approvalId);
    if (!approval) {
      throw new Error('审批记录不存在');
    }

    const { approvalRecord: updatedApproval, newStatus } = rollbackToPreviousNode(approval, reason);

    set((state) => ({
      approvals: state.approvals.map((a) =>
        a.id === approvalId ? updatedApproval : a
      )
    }));

    const bookingStore = useBookingStore.getState();
    bookingStore.updateBookingApproval(approval.bookingId, {
      status: newStatus,
      approvalRecord: updatedApproval
    });

    console.log('[ApprovalStore] Rolled back successfully');
    return { approvalRecord: updatedApproval, newStatus };
  },

  approveBooking: (bookingId, approver, comment) => {
    console.log('[ApprovalStore] Approve booking:', { bookingId, approver: approver.name });
    const bookingStore = useBookingStore.getState();
    const booking = bookingStore.getBookingById(bookingId);
    if (!booking?.approvalRecord) {
      throw new Error('预约或审批记录不存在');
    }
    const approvalId = booking.approvalRecord.id;

    const existingApproval = get().getApprovalById(approvalId);
    if (!existingApproval) {
      set((state) => ({
        approvals: [...state.approvals, booking.approvalRecord!]
      }));
    }

    return get().approve(approvalId, approver, comment);
  },

  rejectBooking: (bookingId, approver, reason) => {
    console.log('[ApprovalStore] Reject booking:', { bookingId, approver: approver.name });
    const bookingStore = useBookingStore.getState();
    const booking = bookingStore.getBookingById(bookingId);
    if (!booking?.approvalRecord) {
      throw new Error('预约或审批记录不存在');
    }
    const approvalId = booking.approvalRecord.id;

    const existingApproval = get().getApprovalById(approvalId);
    if (!existingApproval) {
      set((state) => ({
        approvals: [...state.approvals, booking.approvalRecord!]
      }));
    }

    return get().reject(approvalId, approver, reason);
  },

  rollbackBooking: (bookingId, reason) => {
    console.log('[ApprovalStore] Rollback booking:', { bookingId, reason });
    const bookingStore = useBookingStore.getState();
    const booking = bookingStore.getBookingById(bookingId);
    if (!booking?.approvalRecord) {
      throw new Error('预约或审批记录不存在');
    }
    const approvalId = booking.approvalRecord.id;

    const existingApproval = get().getApprovalById(approvalId);
    if (!existingApproval) {
      set((state) => ({
        approvals: [...state.approvals, booking.approvalRecord!]
      }));
    }

    return get().rollback(approvalId, reason);
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
