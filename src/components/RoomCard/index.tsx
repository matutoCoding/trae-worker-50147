import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import type { Room } from '@/types/room';
import StatusBadge from '../StatusBadge';

interface RoomCardProps {
  room: Room;
  showStatus?: boolean;
  onClick?: () => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, showStatus = true, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({
        url: `/pages/roomDetail/index?id=${room.id}`
      });
    }
  };

  const getStatusText = () => {
    switch (room.status) {
      case 'available':
        return '可预约';
      case 'maintenance':
        return '维护中';
      case 'closed':
        return '已关闭';
      default:
        return '';
    }
  };

  return (
    <View className={styles.roomCard} onClick={handleClick}>
      <Image className={styles.roomImage} src={room.imageUrl} mode="aspectFill" />
      <View className={styles.roomInfo}>
        <View className={styles.roomHeader}>
          <Text className={styles.roomName}>{room.name}</Text>
          {showStatus && (
            <StatusBadge
              status={room.status === 'available' ? 'approved' : 'rejected'}
              type="approval"
              size="sm"
              customLabel={getStatusText()}
              customColor={room.status === 'available' ? '#52C41A' : '#8C8C8C'}
            />
          )}
        </View>
        <Text className={styles.roomLocation}>
          {room.building} · {room.floor} · {room.area}㎡
        </Text>
        <View className={styles.roomMeta}>
          <View className={styles.metaItem}>
            <Text className={styles.metaIcon}>👥</Text>
            <Text className={styles.metaText}>{room.capacity}人</Text>
          </View>
          <View className={styles.metaItem}>
            <Text className={styles.metaIcon}>🕐</Text>
            <Text className={styles.metaText}>{room.openTime}-{room.closeTime}</Text>
          </View>
        </View>
        <View className={styles.equipmentList}>
          {room.equipments.slice(0, 4).map((eq) => (
            <View key={eq.id} className={styles.equipmentTag}>
              <Text className={styles.eqIcon}>{eq.icon}</Text>
              <Text className={styles.eqName}>{eq.name}</Text>
            </View>
          ))}
          {room.equipments.length > 4 && (
            <View className={styles.moreTag}>
              <Text className={styles.moreText}>+{room.equipments.length - 4}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export default RoomCard;
