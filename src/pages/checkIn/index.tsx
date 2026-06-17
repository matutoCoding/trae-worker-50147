import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useDidShow, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import StatusBadge from '@/components/StatusBadge';
import { useBookingStore } from '@/store/useBookingStore';
import { useUserStore } from '@/store/useUserStore';
import { formatDate, formatDateTime, isCheckInTimeReached } from '@/utils/date';
import { mockEquipmentOptions } from '@/data/rooms';
import type { Booking } from '@/types/booking';
import type { BorrowRecord } from '@/types/user';

const generateId = () => Math.random().toString(36).substring(2, 15);

const CheckInPage: React.FC = () => {
  const router = useRouter();
  const bookingId = router.params.id as string;
  const getBookingById = useBookingStore((state) => state.getBookingById);
  const checkIn = useBookingStore((state) => state.checkIn);
  const checkOut = useBookingStore((state) => state.checkOut);
  const currentUser = useUserStore((state) => state.currentUser);
  const borrowRecords = useUserStore((state) => state.borrowRecords);
  const addBorrowRecord = useUserStore((state) => state.addBorrowRecord);
  const updateBorrowRecord = useUserStore((state) => state.updateBorrowRecord);

  const [booking, setBooking] = useState<Booking | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);

  const loadBooking = () => {
    const found = getBookingById(bookingId);
    setBooking(found);
    if (!found) {
      Taro.showToast({ title: '预约不存在', icon: 'none' });
    }
  };

  useDidShow(() => {
    console.log('[CheckInPage] Page shown, bookingId:', bookingId);
    loadBooking();
  });

  usePullDownRefresh(() => {
    console.log('[CheckInPage] Pull to refresh');
    setRefreshing(true);
    setTimeout(() => {
      loadBooking();
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 500);
  });

  const myBorrowRecords = useMemo(() => {
    return borrowRecords.filter(
      (r) => r.bookingId === bookingId && r.borrowerId === currentUser.id
    );
  }, [borrowRecords, bookingId, currentUser.id]);

  const borrowedEquipmentIds = useMemo(() => {
    return myBorrowRecords
      .filter((r) => r.status === 'borrowed')
      .map((r) => r.equipmentId);
  }, [myBorrowRecords]);

  const availableEquipments = useMemo(() => {
    return mockEquipmentOptions.filter(
      (eq) => !borrowedEquipmentIds.includes(eq.id)
    );
  }, [borrowedEquipmentIds]);

  const canCheckIn = booking?.status === 'approved' && booking.userId === currentUser.id;
  const canCheckInTime = booking ? isCheckInTimeReached(booking.date, booking.startTime, 15) : false;
  const canCheckOut = booking?.status === 'checked_in' && booking.userId === currentUser.id;
  const canBorrow = booking?.status === 'checked_in' && booking.userId === currentUser.id;
  const hasBorrowedItems = myBorrowRecords.some((r) => r.status === 'borrowed');

  const handleCheckIn = () => {
    if (!booking) return;
    if (!canCheckInTime) {
      Taro.showToast({
        title: `未到签到时间，${booking.startTime} 前可签到`,
        icon: 'none',
        duration: 2500
      });
      return;
    }
    console.log('[CheckInPage] Check in:', booking.bookingNo);
    Taro.showModal({
      title: '确认签到',
      content: `确认签到使用「${booking.room.name}」？`,
      success: (res) => {
        if (res.confirm) {
          checkIn(booking.id);
          Taro.showToast({ title: '签到成功', icon: 'success' });
          setTimeout(() => {
            loadBooking();
          }, 500);
        }
      }
    });
  };

  const handleCheckOut = () => {
    if (!booking) return;
    const unreturnedInBooking = booking.equipmentUsage?.filter((e) => e.borrowed && !e.returned) || [];
    const unreturnedInUserStore = myBorrowRecords.filter((r) => r.status === 'borrowed');
    const totalUnreturned = unreturnedInBooking.length + unreturnedInUserStore.length;
    if (totalUnreturned > 0) {
      Taro.showToast({
        title: `还有${totalUnreturned}件设备未归还，请先归还`,
        icon: 'none',
        duration: 2500
      });
      return;
    }
    console.log('[CheckInPage] Check out:', booking.bookingNo);
    Taro.showModal({
      title: '确认签退',
      content: '确认使用完毕并签退？请确保设备已归还、房间整洁。',
      success: (res) => {
        if (res.confirm) {
          checkOut(booking.id);
          Taro.showToast({ title: '签退成功', icon: 'success' });
          setTimeout(() => {
            loadBooking();
          }, 500);
        }
      }
    });
  };

  const handleEquipmentToggle = (eqId: string) => {
    setSelectedEquipment((prev) =>
      prev.includes(eqId)
        ? prev.filter((id) => id !== eqId)
        : [...prev, eqId]
    );
  };

  const handleBorrow = () => {
    if (selectedEquipment.length === 0) {
      Taro.showToast({ title: '请选择要借用的设备', icon: 'none' });
      return;
    }

    console.log('[CheckInPage] Borrow equipment:', selectedEquipment);

    const now = new Date().toISOString();
    selectedEquipment.forEach((eqId) => {
      const eq = mockEquipmentOptions.find((e) => e.id === eqId);
      if (eq) {
        const record: BorrowRecord = {
          id: generateId(),
          bookingId: bookingId,
          equipmentId: eqId,
          equipmentName: eq.name,
          borrowTime: formatDateTime(now),
          status: 'borrowed',
          borrowerId: currentUser.id,
          borrowerName: currentUser.name
        };
        addBorrowRecord(record);
      }
    });

    Taro.showToast({ title: '借用成功', icon: 'success' });
    setSelectedEquipment([]);
  };

  const handleReturn = (record: BorrowRecord) => {
    console.log('[CheckInPage] Return equipment:', record.equipmentName);
    Taro.showModal({
      title: '确认归还',
      content: `确认归还「${record.equipmentName}」？`,
      success: (res) => {
        if (res.confirm) {
          const now = new Date().toISOString();
          updateBorrowRecord(record.id, {
            status: 'returned',
            returnTime: formatDateTime(now)
          });
          Taro.showToast({ title: '归还成功', icon: 'success' });
        }
      }
    });
  };

  const handleBack = () => {
    Taro.navigateBack();
  };

  if (!booking) {
    return (
      <View className={styles.pageContainer}>
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📋</Text>
          <Text className={styles.emptyText}>加载中...</Text>
        </View>
      </View>
    );
  }

  const getStatusText = () => {
    switch (booking.status) {
      case 'approved':
        return '待签到';
      case 'checked_in':
        return '使用中';
      case 'completed':
        return '已完成';
      default:
        return '使用登记';
    }
  };

  return (
    <ScrollView className={styles.pageContainer} scrollY refresherEnabled refresherTriggered={refreshing}>
      <View className={styles.content}>
        <View className={styles.headerCard}>
          <View className={styles.statusBadge}>
            <StatusBadge status={booking.status} type="booking" size="md" />
          </View>
          <Text className={styles.roomName}>{booking.room.name}</Text>
          <Text className={styles.bookingTime}>
            {formatDate(booking.date, 'YYYY年MM月DD日')} {booking.startTime} - {booking.endTime}
          </Text>

          <View className={styles.timeInfo}>
            {booking.checkInTime && (
              <View className={styles.timeBlock}>
                <Text className={styles.timeLabel}>签到时间</Text>
                <Text className={styles.timeValue}>{formatDateTime(booking.checkInTime).split(' ')[1]}</Text>
              </View>
            )}
            {booking.checkOutTime && (
              <View className={styles.timeBlock}>
                <Text className={styles.timeLabel}>签退时间</Text>
                <Text className={styles.timeValue}>{formatDateTime(booking.checkOutTime).split(' ')[1]}</Text>
              </View>
            )}
          </View>
        </View>

        <View className={styles.infoCard}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>📝</Text>
            预约信息
          </Text>
          <View className={styles.infoList}>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>预约号</Text>
              <Text className={styles.infoValue}>{booking.bookingNo}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>使用用途</Text>
              <Text className={styles.infoValue}>{booking.purpose}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>参会人数</Text>
              <Text className={styles.infoValue}>{booking.participantCount}人</Text>
            </View>
          </View>
        </View>

        {canBorrow && (
          <View className={styles.equipmentSection}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>📦</Text>
              借用设备
            </Text>
            <View className={styles.equipmentGrid}>
              {availableEquipments.map((eq) => (
                <View
                  key={eq.id}
                  className={`${styles.equipmentCard} ${selectedEquipment.includes(eq.id) ? styles.selected : ''}`}
                  onClick={() => handleEquipmentToggle(eq.id)}
                >
                  <Text className={styles.equipmentIcon}>{eq.icon}</Text>
                  <View className={styles.equipmentInfo}>
                    <Text className={styles.equipmentName}>{eq.name}</Text>
                    <Text className={`${styles.equipmentStatus} ${styles.available}`}>可借用</Text>
                  </View>
                  <View className={`${styles.equipmentCheck} ${selectedEquipment.includes(eq.id) ? styles.selected : ''}`}>
                    {selectedEquipment.includes(eq.id) && (
                      <Text className={styles.checkIcon}>✓</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
            {availableEquipments.length === 0 && (
              <View className={styles.emptyState}>
                <Text className={styles.emptyIcon}>📦</Text>
                <Text className={styles.emptyText}>暂无可借用设备</Text>
              </View>
            )}
            <View
              className={`${styles.btnBorrow} ${selectedEquipment.length === 0 ? styles.disabled : ''}`}
              onClick={handleBorrow}
            >
              <Text>确认借用 ({selectedEquipment.length}件)</Text>
            </View>
          </View>
        )}

        <View className={styles.recordsSection}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>📋</Text>
            借用记录
          </Text>
          <View className={styles.recordsList}>
            {myBorrowRecords.map((record) => (
              <View key={record.id} className={styles.recordItem}>
                <View className={styles.recordInfo}>
                  <Text className={styles.recordName}>{record.equipmentName}</Text>
                  <Text className={styles.recordTime}>借用时间：{record.borrowTime}</Text>
                  {record.returnTime && (
                    <Text className={styles.recordTime}>归还时间：{record.returnTime}</Text>
                  )}
                </View>
                {record.status === 'borrowed' && canBorrow ? (
                  <View className={styles.returnBtn} onClick={() => handleReturn(record)}>
                    <Text>归还</Text>
                  </View>
                ) : (
                  <Text className={`${styles.recordStatus} ${styles[record.status]}`}>
                    {record.status === 'borrowed' ? '借用中' : '已归还'}
                  </Text>
                )}
              </View>
            ))}
          </View>
          {myBorrowRecords.length === 0 && (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>📋</Text>
              <Text className={styles.emptyText}>暂无借用记录</Text>
            </View>
          )}
        </View>
      </View>

      {(canCheckIn || canCheckOut) && (
        <View className={styles.bottomBar}>
          <View className={styles.btnSecondary} onClick={handleBack}>
            <Text>返回</Text>
          </View>
          {canCheckIn && (
            <View
              className={`${styles.btnPrimary} ${!canCheckInTime ? styles.disabled : ''}`}
              onClick={handleCheckIn}
            >
              <Text>{canCheckInTime ? '立即签到' : '未到签到时间'}</Text>
            </View>
          )}
          {canCheckOut && (
            <View
              className={`${styles.btnPrimary} ${styles.success} ${hasBorrowedItems || (booking?.equipmentUsage?.some(e => e.borrowed && !e.returned)) ? styles.disabled : ''}`}
              onClick={handleCheckOut}
            >
              <Text>
                {(hasBorrowedItems || (booking?.equipmentUsage?.some(e => e.borrowed && !e.returned))) ? '请先归还设备' : '确认签退'}
              </Text>
            </View>
          )}
        </View>
      )}

      {!canCheckIn && !canCheckOut && (
        <View className={styles.bottomBar}>
          <View className={styles.btnPrimary} onClick={handleBack}>
            <Text>返回</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default CheckInPage;
