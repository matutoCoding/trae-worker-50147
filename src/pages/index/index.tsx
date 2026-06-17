import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import RoomCard from '@/components/RoomCard';
import StatusBadge from '@/components/StatusBadge';
import { useRoomStore } from '@/store/useRoomStore';
import { useBookingStore } from '@/store/useBookingStore';
import { useUserStore } from '@/store/useUserStore';
import { formatDate, getDayOfWeek, getToday } from '@/utils/date';
import type { Room } from '@/types/room';

const IndexPage: React.FC = () => {
  const currentUser = useUserStore((state) => state.currentUser);
  const rooms = useRoomStore((state) => state.rooms);
  const bookings = useBookingStore((state) => state.bookings);
  const getUserBookings = useBookingStore((state) => state.getUserBookings);
  const [refreshing, setRefreshing] = useState(false);

  const today = getToday();

  const stats = useMemo(() => {
    const userBookings = getUserBookings(currentUser.id);
    const todayBookings = userBookings.filter(
      (b) => b.date === today && b.status !== 'cancelled' && b.status !== 'rejected'
    );
    const pendingApprovals = userBookings.filter(
      (b) => b.status === 'pending_leader' || b.status === 'pending_counselor' || b.status === 'pending_admin'
    );
    const upcoming = userBookings
      .filter(
        (b) =>
          (b.status === 'approved' || b.status === 'checked_in') &&
          b.date >= today
      )
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.startTime.localeCompare(b.startTime);
      })[0];

    return {
      todayCount: todayBookings.length,
      pendingCount: pendingApprovals.length,
      upcoming
    };
  }, [bookings, currentUser.id, today, getUserBookings]);

  const availableRooms = useMemo(() => {
    return rooms.filter((r) => r.status === 'available').slice(0, 3);
  }, [rooms]);

  useEffect(() => {
    console.log('[IndexPage] Page mounted');
  }, []);

  useDidShow(() => {
    console.log('[IndexPage] Page shown');
  });

  usePullDownRefresh(() => {
    console.log('[IndexPage] Pull to refresh');
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 1000);
  });

  const handleQuickEntry = (type: string) => {
    console.log('[IndexPage] Quick entry clicked:', type);
    switch (type) {
      case 'booking':
        Taro.switchTab({ url: '/pages/booking/index' });
        break;
      case 'myBookings':
        Taro.switchTab({ url: '/pages/mine/index' });
        break;
      case 'approval':
        Taro.switchTab({ url: '/pages/approval/index' });
        break;
      case 'checkIn':
        if (stats.upcoming) {
          Taro.navigateTo({ url: `/pages/checkIn/index?id=${stats.upcoming.id}` });
        } else {
          Taro.showToast({ title: '暂无待签到预约', icon: 'none' });
        }
        break;
    }
  };

  const handleRoomClick = (room: Room) => {
    console.log('[IndexPage] Room clicked:', room.name);
    Taro.navigateTo({ url: `/pages/roomDetail/index?id=${room.id}` });
  };

  const handleViewMoreRooms = () => {
    Taro.switchTab({ url: '/pages/booking/index' });
  };

  return (
    <ScrollView className={styles.pageContainer} scrollY refresherEnabled refresherTriggered={refreshing}>
      <View className={styles.header}>
        <View className={styles.headerTop}>
          <View className={styles.welcomeSection}>
            <Text className={styles.welcomeText}>您好，{currentUser.name}</Text>
            <Text className={styles.subText}>{currentUser.department}</Text>
          </View>
          <Image className={styles.userAvatar} src={currentUser.avatar} mode="aspectFill" />
        </View>
        <View className={styles.headerDate}>
          <Text className={styles.dateText}>{formatDate(today, 'YYYY年MM月DD日')}</Text>
          <Text className={styles.weekdayText}>{getDayOfWeek(today)}</Text>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.statsCard}>
          <View className={styles.statsRow}>
            <View className={styles.statItem}>
              <Text className={styles.statNumber}>{stats.todayCount}</Text>
              <Text className={styles.statLabel}>今日预约</Text>
            </View>
            <View className={styles.statDivider} />
            <View className={styles.statItem}>
              <Text className={styles.statNumber}>{stats.pendingCount}</Text>
              <Text className={styles.statLabel}>待审批</Text>
            </View>
            <View className={styles.statDivider} />
            <View className={styles.statItem}>
              <Text className={styles.statNumber}>{stats.upcoming ? '1' : '0'}</Text>
              <Text className={styles.statLabel}>即将开始</Text>
            </View>
          </View>
        </View>

        <View className={styles.quickEntrySection}>
          <View className={styles.quickEntryGrid}>
            <View className={styles.entryItem} onClick={() => handleQuickEntry('booking')}>
              <View className={`${styles.entryIcon} ${styles.entryIcon1}`}>
                <Text>📅</Text>
              </View>
              <Text className={styles.entryText}>立即预约</Text>
            </View>
            <View className={styles.entryItem} onClick={() => handleQuickEntry('myBookings')}>
              <View className={`${styles.entryIcon} ${styles.entryIcon2}`}>
                <Text>📋</Text>
              </View>
              <Text className={styles.entryText}>我的预约</Text>
            </View>
            <View className={styles.entryItem} onClick={() => handleQuickEntry('approval')}>
              <View className={`${styles.entryIcon} ${styles.entryIcon3}`}>
                <Text>✅</Text>
              </View>
              <Text className={styles.entryText}>审批中心</Text>
            </View>
            <View className={styles.entryItem} onClick={() => handleQuickEntry('checkIn')}>
              <View className={`${styles.entryIcon} ${styles.entryIcon4}`}>
                <Text>📝</Text>
              </View>
              <Text className={styles.entryText}>使用登记</Text>
            </View>
          </View>
        </View>

        <View className={styles.noticeSection}>
          <View className={styles.noticeCard}>
            <Text className={styles.noticeIcon}>📢</Text>
            <View className={styles.noticeContent}>
              <Text className={styles.noticeTitle}>预约须知</Text>
              <Text className={styles.noticeText}>
                研讨间预约需经组长、辅导员、管理员三级审批，请提前1-3天提交申请。退订请提前24小时操作。
              </Text>
            </View>
          </View>
        </View>

        {stats.upcoming && (
          <View className={styles.upcomingSection}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>即将开始</Text>
            </View>
            <View
              className={styles.upcomingCard}
              onClick={() => Taro.navigateTo({ url: `/pages/bookingDetail/index?id=${stats.upcoming.id}` })}
            >
              <View className={styles.upcomingHeader}>
                <Text className={styles.upcomingTitle}>
                  {stats.upcoming.date === today ? '今天' : stats.upcoming.date} {stats.upcoming.startTime}
                </Text>
                <StatusBadge status={stats.upcoming.status} type="booking" size="sm" />
              </View>
              <Text className={styles.upcomingRoom}>{stats.upcoming.room.name}</Text>
              <Text className={styles.upcomingPurpose}>{stats.upcoming.purpose}</Text>
            </View>
          </View>
        )}

        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>热门研讨间</Text>
          <View className={styles.moreBtn} onClick={handleViewMoreRooms}>
            <Text className={styles.moreText}>查看更多</Text>
            <Text className={styles.moreIcon}>›</Text>
          </View>
        </View>

        <View className={styles.roomList}>
          {availableRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onClick={() => handleRoomClick(room)}
            />
          ))}
        </View>

        {availableRooms.length === 0 && (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>🏢</Text>
            <Text className={styles.emptyText}>暂无可预约研讨间</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default IndexPage;
