import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import type { ApprovalNode as ApprovalNodeType } from '@/types/approval';
import { getApprovalNodeStatusText } from '@/utils/approvalFlow';
import { formatDateTime } from '@/utils/date';

interface ApprovalNodeProps {
  node: ApprovalNodeType;
  isCurrent: boolean;
  isCompleted: boolean;
  isLast: boolean;
}

const ApprovalNode: React.FC<ApprovalNodeProps> = ({ node, isCurrent, isCompleted, isLast }) => {
  const getStatusColor = () => {
    switch (node.status) {
      case 'approved':
        return '#52C41A';
      case 'rejected':
        return '#FF4D4F';
      case 'pending':
        return isCurrent ? '#FAAD14' : '#C9CDD4';
      case 'skipped':
        return '#8C8C8C';
      default:
        return '#C9CDD4';
    }
  };

  const getStatusIcon = () => {
    switch (node.status) {
      case 'approved':
        return '✓';
      case 'rejected':
        return '✕';
      case 'pending':
        return isCurrent ? '●' : '○';
      case 'skipped':
        return '—';
      default:
        return '○';
    }
  };

  const color = getStatusColor();

  return (
    <View className={styles.nodeContainer}>
      <View className={styles.nodeContent}>
        <View className={styles.nodeHeader}>
          <View className={styles.nodeIndicator} style={{ backgroundColor: color }}>
            <Text className={styles.indicatorIcon}>{getStatusIcon()}</Text>
          </View>
          <View className={styles.nodeInfo}>
            <Text className={styles.nodeName}>{node.nodeName}</Text>
            <Text className={styles.nodeStatus} style={{ color }}>
              {getApprovalNodeStatusText(node.status)}
            </Text>
          </View>
          {node.processedAt && (
            <Text className={styles.processedTime}>
              {formatDateTime(node.processedAt, 'MM-DD HH:mm')}
            </Text>
          )}
        </View>

        {node.approverName && (
          <View className={styles.approverRow}>
            <Text className={styles.approverLabel}>审批人：</Text>
            <Text className={styles.approverName}>{node.approverName}</Text>
          </View>
        )}

        {node.comment && (
          <View className={styles.commentRow}>
            <Text className={styles.commentLabel}>意见：</Text>
            <Text className={styles.commentText}>{node.comment}</Text>
          </View>
        )}
      </View>

      {!isLast && (
        <View
          className={styles.nodeConnector}
          style={{ backgroundColor: isCompleted ? '#52C41A' : '#E5E6EB' }}
        />
      )}
    </View>
  );
};

export default ApprovalNode;
