export type ApprovalNodeType = 'leader' | 'counselor' | 'admin';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'skipped';

export interface ApprovalNode {
  id: string;
  bookingId: string;
  nodeType: ApprovalNodeType;
  nodeName: string;
  approverId?: string;
  approverName?: string;
  status: ApprovalStatus;
  comment?: string;
  createdAt: string;
  processedAt?: string;
  order: number;
}

export interface ApprovalRecord {
  id: string;
  bookingId: string;
  nodes: ApprovalNode[];
  currentNodeIndex: number;
  overallStatus: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalFlowConfig {
  nodeType: ApprovalNodeType;
  nodeName: string;
  required: boolean;
  order: number;
}

export const APPROVAL_FLOW: ApprovalFlowConfig[] = [
  { nodeType: 'leader', nodeName: '组长审批', required: true, order: 1 },
  { nodeType: 'counselor', nodeName: '辅导员审批', required: true, order: 2 },
  { nodeType: 'admin', nodeName: '管理员审批', required: true, order: 3 }
];
