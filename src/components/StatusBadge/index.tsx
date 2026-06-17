import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { BOOKING_STATUS_MAP } from '@/types/booking';
import type { BookingStatus } from '@/types/booking';
import type { ApprovalStatus } from '@/types/approval';

interface StatusBadgeProps {
  status: BookingStatus | ApprovalStatus;
  type?: 'booking' | 'approval';
  size?: 'sm' | 'md' | 'lg';
  customLabel?: string;
  customColor?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = 'booking',
  size = 'md',
  customLabel,
  customColor
}) => {
  const getStatusInfo = () => {
    if (customLabel && customColor) {
      return { label: customLabel, color: customColor };
    }

    if (type === 'booking') {
      return BOOKING_STATUS_MAP[status as BookingStatus] || { label: status, color: '#8C8C8C' };
    }

    const approvalStatusMap: Record<ApprovalStatus, { label: string; color: string }> = {
      pending: { label: '待审批', color: '#FAAD14' },
      approved: { label: '已通过', color: '#52C41A' },
      rejected: { label: '已驳回', color: '#FF4D4F' },
      skipped: { label: '已跳过', color: '#8C8C8C' }
    };
    return approvalStatusMap[status as ApprovalStatus] || { label: status, color: '#8C8C8C' };
  };

  const { label, color } = getStatusInfo();

  const badgeClass = classnames(styles.statusBadge, styles[size], {
    [styles.success]: color === '#52C41A',
    [styles.warning]: color === '#FAAD14',
    [styles.error]: color === '#FF4D4F',
    [styles.info]: color === '#1890FF',
    [styles.purple]: color === '#722ED1',
    [styles.default]: !['#52C41A', '#FAAD14', '#FF4D4F', '#1890FF', '#722ED1'].includes(color)
  });

  return (
    <View className={badgeClass} style={{ backgroundColor: `${color}15`, borderColor: `${color}40` }}>
      <Text className={styles.statusText} style={{ color }}>
        {label}
      </Text>
    </View>
  );
};

export default StatusBadge;
