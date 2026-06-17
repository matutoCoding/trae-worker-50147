import React, { useState, useMemo } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { useRoomStore } from '@/store/useRoomStore';
import { useBookingStore } from '@/store/useBookingStore';
import { getToday } from '@/utils/date';
import { getAvailableTimeSlots } from '@/utils/conflict';
import type { Room } from '@/types/room';

const statusMap = {
  available: { label: '可预约', className: 'available' },
  maintenance: { label: '维护中', className: 'maintenance' },
  closed: { label: '已关闭', className: 'closed' }
};

const RoomDetailPage: React.FC = () => {
  const router = useRouter();
  const roomId = router.params.id as string;
  const getRoomById = useRoomStore((state) => state.getRoomById);
  const getRoomBookings = useBookingStore((state) => state.getRoomBookings);
  const [room, setRoom] = useState<Room | undefined>(undefined);

  useDidShow(() => {
    console.log('[RoomDetailPage] Page shown, roomId:', roomId);
    const foundRoom = getRoomById(roomId);
    setRoom(foundRoom);
    if (!foundRoom) {
      Taro.showToast({ title: '研讨间不存在', icon: 'none' });
    }
  });

  const today = getToday();

  const todaySchedule = useMemo(() => {
    if (!room) return [];
    const bookings = getRoomBookings(room.id, today);
    return getAvailableTimeSlots(room.openTime, room.closeTime, bookings, 60);
  }, [room, today, getRoomBookings]);

  const handleBack = () => {
    console.log('[RoomDetailPage] Back clicked');
    Taro.navigateBack();
  };

  const handleBook = () => {
    if (!room) return;
    if (room.status !== 'available') {
      Taro.showToast({ title: '该研讨间暂不可预约', icon: 'none' });
      return;
    }
    console.log('[RoomDetailPage] Book clicked:', room.name);
    Taro.navigateTo({ url: `/pages/bookingForm/index?roomId=${room.id}&date=${today}` });
  };

  const handleViewSchedule = () => {
    if (!room) return;
    console.log('[RoomDetailPage] View schedule clicked:', room.name);
    Taro.switchTab({ url: '/pages/booking/index' });
  };

  if (!room) {
    return (
      <View className={styles.pageContainer}>
        <View className={styles.emptySchedule}>
          <Text>加载中...</Text>
        </View>
      </View>
    );
  }

  const statusInfo = statusMap[room.status];

  return (
    <ScrollView className={styles.pageContainer} scrollY>
      <Image className={styles.roomImage} src={room.imageUrl} mode="aspectFill" />

      <View className={styles.content}>
        <View className={styles.infoCard}>
          <View className={styles.roomHeader}>
            <Text className={styles.roomName}>{room.name}</Text>
            <Text className={styles.roomLocation}>
              <Text>📍</Text>
              {room.building} {room.floor}
            </Text>
            <Text className={`${styles.roomStatus} ${styles[statusInfo.className]}`}>
              {statusInfo.label}
            </Text>
          </View>

          <View className={styles.roomStats}>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{room.capacity}</Text>
              <Text className={styles.statLabel}>容纳人数</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{room.area}㎡</Text>
              <Text className={styles.statLabel}>使用面积</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{room.equipments.length}</Text>
              <Text className={styles.statLabel}>设备数量</Text>
            </View>
          </View>

          <Text className={styles.roomDescription}>{room.description}</Text>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>🎯</Text>
            配套设备
          </Text>
          <View className={styles.equipmentGrid}>
            {room.equipments.map((eq) => (
              <View key={eq.id} className={styles.equipmentItem}>
                <Text className={styles.equipmentIcon}>{eq.icon}</Text>
                <Text className={styles.equipmentName}>{eq.name}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>✨</Text>
            基础设施
          </Text>
          <View className={styles.facilityList}>
            {room.facilities.map((facility, index) => (
              <Text key={index} className={styles.facilityTag}>{facility}</Text>
            ))}
          </View>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>🕐</Text>
            开放时间
          </Text>
          <View className={styles.timeInfo}>
            <Text className={styles.timeLabel}>每日开放</Text>
            <Text className={styles.timeValue}>{room.openTime} - {room.closeTime}</Text>
          </View>

          <View className={styles.todaySchedule}>
            <Text className={styles.scheduleHeader}>今日时段</Text>
            <ScrollView className={styles.scheduleTimeline} scrollX>
              {todaySchedule.slice(0, 12).map((slot) => (
                <View
                  key={slot.id}
                  className={`${styles.timeSlot} ${slot.available ? styles.available : styles.occupied}`}
                >
                  <Text className={styles.slotTime}>{slot.startTime}</Text>
                </View>
              ))}
            </ScrollView>
            {todaySchedule.length === 0 && (
              <View className={styles.emptySchedule}>
                <Text>暂无时段信息</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.btnSecondary} onClick={handleViewSchedule}>
          <Text>查看排期</Text>
        </View>
        <View
          className={`${styles.btnPrimary} ${room.status !== 'available' ? styles.disabled : ''}`}
          onClick={handleBook}
        >
          <Text>{room.status === 'available' ? '立即预约' : '暂不可约'}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default RoomDetailPage;
