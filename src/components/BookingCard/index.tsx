import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import type { Booking } from '@/types/booking';
import StatusBadge from '../StatusBadge';
import { formatDate, getDayOfWeek, formatDuration, getDuration } from '@/utils/date';

interface BookingCardProps {
  booking: Booking;
  onClick?: () => void;
  showActions?: boolean;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, onClick, showActions = false }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({
        url: `/pages/bookingDetail/index?id=${booking.id}`
      });
    }
  };

  const duration = getDuration(booking.startTime, booking.endTime);

  return (
    <View className={styles.bookingCard} onClick={handleClick}>
      <View className={styles.cardHeader}>
        <View className={styles.roomInfo}>
          <Text className={styles.roomName}>{booking.room.name}</Text>
          <StatusBadge status={booking.status} type="booking" size="sm" />
        </View>
        <Text className={styles.bookingNo}>{booking.bookingNo}</Text>
      </View>

      <View className={styles.cardBody}>
        <View className={styles.dateRow}>
          <Text className={styles.dateText}>
            {formatDate(booking.date, 'MM月DD日')} {getDayOfWeek(booking.date)}
          </Text>
          <Text className={styles.timeText}>
            {booking.startTime} - {booking.endTime}
          </Text>
          <Text className={styles.durationText}>({formatDuration(duration)})</Text>
        </View>

        <View className={styles.purposeRow}>
          <Text className={styles.purposeLabel}>用途：</Text>
          <Text className={styles.purposeText}>{booking.purpose}</Text>
        </View>

        <View className={styles.participantRow}>
          <Text className={styles.participantLabel}>参会人：</Text>
          <Text className={styles.participantText}>
            {booking.participants.slice(0, 3).join('、')}
            {booking.participants.length > 3 && ` 等${booking.participants.length}人`}
          </Text>
        </View>

        {booking.equipmentNeeds.length > 0 && (
          <View className={styles.equipmentRow}>
            <Text className={styles.equipmentLabel}>设备：</Text>
            <View className={styles.equipmentTags}>
              {booking.equipmentNeeds.map((eq, index) => (
                <Text key={index} className={styles.equipmentTag}>{eq}</Text>
              ))}
            </View>
          </View>
        )}
      </View>

      {showActions && (
        <View className={styles.cardActions}>
          {booking.status === 'approved' && (
            <View className={styles.actionBtn}>
              <Text className={styles.actionText}>签到</Text>
            </View>
          )}
          {booking.status === 'checked_in' && (
            <View className={styles.actionBtn}>
              <Text className={styles.actionText}>签退</Text>
            </View>
          )}
          {(booking.status === 'pending_leader' || booking.status === 'pending_counselor' || booking.status === 'pending_admin') && (
            <View className={styles.actionBtnSecondary}>
              <Text className={styles.actionTextSecondary}>取消预约</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default BookingCard;
