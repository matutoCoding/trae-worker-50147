import type {
  BookingStatus,
  Booking
} from '@/types/booking';
import type {
  ApprovalRecord,
  ApprovalNode,
  ApprovalNodeType,
  ApprovalStatus,
  ApprovalFlowConfig
} from '@/types/approval';
import { APPROVAL_FLOW } from '@/types/approval';
import type { User, UserRole } from '@/types/user';

const generateId = () => Math.random().toString(36).substring(2, 15);

export const createApprovalRecord = (bookingId: string): ApprovalRecord => {
  const now = new Date().toISOString();
  const nodes: ApprovalNode[] = APPROVAL_FLOW.map((config: ApprovalFlowConfig) => ({
    id: generateId(),
    bookingId,
    nodeType: config.nodeType,
    nodeName: config.nodeName,
    status: config.order === 1 ? 'pending' : 'pending',
    createdAt: now,
    order: config.order
  }));

  return {
    id: generateId(),
    bookingId,
    nodes,
    currentNodeIndex: 0,
    overallStatus: 'pending',
    createdAt: now,
    updatedAt: now
  };
};

export const getBookingStatusForApprovalNode = (nodeIndex: number): BookingStatus => {
  const statusMap: Record<number, BookingStatus> = {
    0: 'pending_leader',
    1: 'pending_counselor',
    2: 'pending_admin'
  };
  return statusMap[nodeIndex] || 'pending_leader';
};

export const getApprovalNodeForRole = (role: UserRole): ApprovalNodeType | null => {
  const roleMap: Partial<Record<UserRole, ApprovalNodeType>> = {
    leader: 'leader',
    counselor: 'counselor',
    admin: 'admin'
  };
  return roleMap[role] || null;
};

export const canApprove = (user: User, approvalRecord: ApprovalRecord): boolean => {
  if (approvalRecord.overallStatus !== 'pending') return false;
  if (approvalRecord.currentNodeIndex >= approvalRecord.nodes.length) return false;

  const currentNode = approvalRecord.nodes[approvalRecord.currentNodeIndex];
  const userNodeType = getApprovalNodeForRole(user.role);

  return userNodeType === currentNode.nodeType;
};

export const approveNode = (
  approvalRecord: ApprovalRecord,
  approver: User,
  comment?: string
): { approvalRecord: ApprovalRecord; newStatus: BookingStatus | null } => {
  console.log('[Approval] Approving node:', { approvalRecordId: approvalRecord.id, approver: approver.name });

  const nodes = [...approvalRecord.nodes];
  const currentIndex = approvalRecord.currentNodeIndex;
  const currentNode = { ...nodes[currentIndex] };

  currentNode.status = 'approved';
  currentNode.approverId = approver.id;
  currentNode.approverName = approver.name;
  currentNode.comment = comment;
  currentNode.processedAt = new Date().toISOString();

  nodes[currentIndex] = currentNode;

  const nextIndex = currentIndex + 1;
  const isLastNode = nextIndex >= nodes.length;

  const updatedRecord: ApprovalRecord = {
    ...approvalRecord,
    nodes,
    currentNodeIndex: nextIndex,
    overallStatus: isLastNode ? 'approved' : 'pending',
    updatedAt: new Date().toISOString()
  };

  const newStatus: BookingStatus | null = isLastNode
    ? 'approved'
    : getBookingStatusForApprovalNode(nextIndex);

  console.log('[Approval] Node approved:', { nextIndex, newStatus, isLastNode });
  return { approvalRecord: updatedRecord, newStatus };
};

export const rejectNode = (
  approvalRecord: ApprovalRecord,
  approver: User,
  reason: string
): { approvalRecord: ApprovalRecord; newStatus: BookingStatus } => {
  console.log('[Approval] Rejecting node:', { approvalRecordId: approvalRecord.id, approver: approver.name, reason });

  const nodes = [...approvalRecord.nodes];
  const currentIndex = approvalRecord.currentNodeIndex;
  const currentNode = { ...nodes[currentIndex] };

  currentNode.status = 'rejected';
  currentNode.approverId = approver.id;
  currentNode.approverName = approver.name;
  currentNode.comment = reason;
  currentNode.processedAt = new Date().toISOString();

  nodes[currentIndex] = currentNode;

  for (let i = currentIndex + 1; i < nodes.length; i++) {
    nodes[i] = { ...nodes[i], status: 'skipped' };
  }

  const updatedRecord: ApprovalRecord = {
    ...approvalRecord,
    nodes,
    overallStatus: 'rejected',
    updatedAt: new Date().toISOString()
  };

  console.log('[Approval] Node rejected');
  return { approvalRecord: updatedRecord, newStatus: 'rejected' };
};

export const rollbackToPreviousNode = (
  approvalRecord: ApprovalRecord,
  reason: string
): { approvalRecord: ApprovalRecord; newStatus: BookingStatus } => {
  console.log('[Approval] Rolling back to previous node:', { approvalRecordId: approvalRecord.id });

  const nodes = [...approvalRecord.nodes];
  const currentIndex = approvalRecord.currentNodeIndex;

  if (currentIndex <= 0) {
    throw new Error('无法回退到更前的节点');
  }

  const prevIndex = currentIndex - 1;
  const prevNode = { ...nodes[prevIndex] };
  prevNode.status = 'pending';
  prevNode.approverId = undefined;
  prevNode.approverName = undefined;
  prevNode.comment = reason;
  prevNode.processedAt = undefined;

  nodes[prevIndex] = prevNode;

  const updatedRecord: ApprovalRecord = {
    ...approvalRecord,
    nodes,
    currentNodeIndex: prevIndex,
    overallStatus: 'pending',
    updatedAt: new Date().toISOString()
  };

  const newStatus = getBookingStatusForApprovalNode(prevIndex);

  console.log('[Approval] Rolled back to:', { prevIndex, newStatus });
  return { approvalRecord: updatedRecord, newStatus };
};

export const getApprovalProgress = (approvalRecord: ApprovalRecord): {
  currentStep: number;
  totalSteps: number;
  percentage: number;
  completedNodes: ApprovalNode[];
  currentNode: ApprovalNode | null;
  pendingNodes: ApprovalNode[];
} => {
  const totalSteps = approvalRecord.nodes.length;
  const currentStep = approvalRecord.currentNodeIndex;
  const percentage = Math.round((currentStep / totalSteps) * 100);

  const completedNodes = approvalRecord.nodes.filter(n => n.status === 'approved');
  const currentNode = approvalRecord.nodes[currentStep] || null;
  const pendingNodes = approvalRecord.nodes.filter((n, i) => i > currentStep && n.status === 'pending');

  return {
    currentStep,
    totalSteps,
    percentage,
    completedNodes,
    currentNode,
    pendingNodes
  };
};

export const getApprovalNodeStatusText = (status: ApprovalStatus): string => {
  const map: Record<ApprovalStatus, string> = {
    pending: '待审批',
    approved: '已通过',
    rejected: '已驳回',
    skipped: '已跳过'
  };
  return map[status];
};

export const getUserPendingApprovals = (user: User, bookings: Booking[]): Booking[] => {
  return bookings.filter(booking => {
    if (!booking.approvalRecord) return false;
    if (booking.status === 'rejected' || booking.status === 'cancelled' || 
        booking.status === 'completed' || booking.status === 'approved' || 
        booking.status === 'checked_in') return false;
    return canApprove(user, booking.approvalRecord);
  });
};
