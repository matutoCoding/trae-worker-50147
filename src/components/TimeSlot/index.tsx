import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface TimeSlotProps {
  startTime: string;
  endTime: string;
  available: boolean;
  selected: boolean;
  disabled?: boolean;
  conflictInfo?: string;
  onClick: () => void;
}

const TimeSlot: React.FC<TimeSlotProps> = ({
  startTime,
  endTime,
  available,
  selected,
  disabled = false,
  conflictInfo,
  onClick
}) => {
  const handleClick = () => {
    if (!disabled && available) {
      onClick();
    }
  };

  const slotClass = classnames(styles.timeSlot, {
    [styles.available]: available && !disabled,
    [styles.selected]: selected,
    [styles.unavailable]: !available || disabled
  });

  return (
    <View
      className={slotClass}
      onClick={handleClick}
    >
      <Text className={styles.timeText}>{startTime}</Text>
      <View className={styles.timeDivider} />
      <Text className={styles.timeText}>{endTime}</Text>
      {!available && conflictInfo && (
        <Text className={styles.conflictHint}>{conflictInfo}</Text>
      )}
    </View>
  );
};

export default TimeSlot;
