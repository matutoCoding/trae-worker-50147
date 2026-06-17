import React, { useState, useMemo } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import StatusBadge from '@/components/StatusBadge';
import { useUserStore } from '@/store/useUserStore';
import { useBookingStore } from '@/store/useBookingStore';
import { formatDate } from '@/utils/date';
import type { Booking, BookingStatus } from '@/types/booking';

const roleMap = {
  student: '学生',
  leader: '组长',
  counselor: '辅导员',
  admin: '管理员'
};

const tabFilters: { label: string; status: BookingStatus | 'all' }[] = [
  { label: '全部', status: 'all' },
  { label: '待审批', status: 'pending_leader' },
  { label: '已通过', status: 'approved' },
  { label: '使用中', status: 'checked_in' },
  { label: '已完成', status: 'completed' }
];

const MinePage: React.FC = () => {
  const currentUser = useUserStore((state) => state.currentUser);
  const borrowRecords = useUserStore((state) => state.getUserBorrowRecords(currentUser.id));
  const getUserBookings = useBookingStore((state) => state.getUserBookings);
  const [activeTab, setActiveTab] = useState<BookingStatus | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const myBookings = useMemo(() => {
    return getUserBookings(currentUser.id);
  }, [getUserBookings, currentUser.id]);

  const stats = useMemo(() => {
    const total = myBookings.length;
    const pending = myBookings.filter(
      (b) => b.status === 'pending_leader' || b.status === 'pending_counselor' || b.status === 'pending_admin'
    ).length;
    const approved = myBookings.filter((b) => b.status === 'approved').length;
    const completed = myBookings.filter((b) => b.status === 'completed').length;
    return { total, pending, approved, completed };
  }, [myBookings]);

  const filteredBookings = useMemo(() => {
    if (activeTab === 'all') {
      return myBookings.slice(0, 3);
    }
    return myBookings.filter((b) => b.status === activeTab).slice(0, 3);
  }, [myBookings, activeTab]);

  usePullDownRefresh(() => {
    console.log('[MinePage] Pull to refresh');
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 1000);
  });

  useDidShow(() => {
    console.log('[MinePage] Page shown');
  });

  const handleBookingClick = (booking: Booking) => {
    console.log('[MinePage] Booking clicked:', booking.bookingNo);
    Taro.navigateTo({ url: `/pages/bookingDetail/index?id=${booking.id}` });
  };

  const handleViewAllBookings = () => {
    console.log('[MinePage] View all bookings');
    Taro.switchTab({ url: '/pages/booking/index' });
  };

  const handleMenuClick = (type: string) => {
    console.log('[MinePage] Menu clicked:', type);
    switch (type) {
      case 'myBookings':
        Taro.switchTab({ url: '/pages/booking/index' });
        break;
      case 'approval':
        Taro.switchTab({ url: '/pages/approval/index' });
        break;
      case 'borrow':
        Taro.showToast({ title: '设备借用记录', icon: 'none' });
        break;
      case 'help':
        Taro.showToast({ title: '使用帮助', icon: 'none' });
        break;
      case 'about':
        Taro.showToast({ title: '关于我们 v1.0.0', icon: 'none' });
        break;
    }
  };

  return (
    <ScrollView className={styles.pageContainer} scrollY refresherEnabled refresherTriggered={refreshing}>
      <View className={styles.header}>
        <View className={styles.userInfo}>
          <Image className={styles.userAvatar} src={currentUser.avatar} mode="aspectFill" />
          <View className={styles.userInfoContent}>
            <Text className={styles.userName}>{currentUser.name}</Text>
            <Text className={styles.userDept}>{currentUser.department}</Text>
            <Text className={styles.userRole}>{roleMap[currentUser.role]}</Text>
          </View>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.statsCard}>
          <View className={styles.statsRow}>
            <View className={styles.statItem}>
              <Text className={styles.statNumber}>{stats.total}</Text>
              <Text className={styles.statLabel}>全部预约</Text>
            </View>
            <View className={styles.statDivider} />
            <View className={styles.statItem}>
              <Text className={styles.statNumber}>{stats.pending}</Text>
              <Text className={styles.statLabel}>待审批</Text>
            </View>
            <View className={styles.statDivider} />
            <View className={styles.statItem}>
              <Text className={styles.statNumber}>{stats.approved}</Text>
              <Text className={styles.statLabel}>已通过</Text>
            </View>
            <View className={styles.statDivider} />
            <View className={styles.statItem}>
              <Text className={styles.statNumber}>{stats.completed}</Text>
              <Text className={styles.statLabel}>已完成</Text>
            </View>
          </View>
        </View>

        <View className={styles.tabSection}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>我的预约</Text>
            <View className={styles.moreBtn} onClick={handleViewAllBookings}>
              <Text className={styles.moreText}>查看全部</Text>
              <Text className={styles.moreIcon}>›</Text>
            </View>
          </View>

          <ScrollView className={styles.tabList} scrollX>
            {tabFilters.map((tab) => (
              <View
                key={tab.status}
                className={`${styles.tabItem} ${activeTab === tab.status ? styles.active : ''}`}
                onClick={() => setActiveTab(tab.status)}
              >
                <Text>{tab.label}</Text>
              </View>
            ))}
          </ScrollView>

          <View className={styles.bookingList}>
            {filteredBookings.map((booking) => (
              <View
                key={booking.id}
                className={styles.bookingItem}
                onClick={() => handleBookingClick(booking)}
              >
                <View className={styles.bookingHeader}>
                  <Text className={styles.bookingRoom}>{booking.room.name}</Text>
                  <StatusBadge status={booking.status} type="booking" size="sm" />
                </View>
                <View className={styles.bookingMeta}>
                  <View className={styles.bookingMetaItem}>
                    <Text className={styles.metaIcon}>📅</Text>
                    <Text>{formatDate(booking.date, 'YYYY-MM-DD')} {booking.startTime}-{booking.endTime}</Text>
                  </View>
                  <View className={styles.bookingMetaItem}>
                    <Text className={styles.metaIcon}>🎯</Text>
                    <Text>{booking.purpose}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {filteredBookings.length === 0 && (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>📋</Text>
              <Text className={styles.emptyText}>暂无预约记录</Text>
            </View>
          )}
        </View>

        <View className={styles.borrowSection}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>设备借用</Text>
            <View className={styles.moreBtn} onClick={() => handleMenuClick('borrow')}>
              <Text className={styles.moreText}>查看全部</Text>
              <Text className={styles.moreIcon}>›</Text>
            </View>
          </View>

          <View className={styles.borrowList}>
            {borrowRecords.slice(0, 2).map((record) => (
              <View key={record.id} className={styles.borrowItem}>
                <View className={styles.borrowInfo}>
                  <Text className={styles.borrowName}>{record.equipmentName}</Text>
                  <Text className={styles.borrowTime}>借用时间：{record.borrowTime}</Text>
                </View>
                <Text className={`${styles.borrowStatus} ${styles[record.status]}`}>
                  {record.status === 'borrowed' ? '借用中' : '已归还'}
                </Text>
              </View>
            ))}
          </View>

          {borrowRecords.length === 0 && (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>📦</Text>
              <Text className={styles.emptyText}>暂无借用记录</Text>
            </View>
          )}
        </View>

        <View className={styles.menuSection}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>常用功能</Text>
          </View>

          <View className={styles.menuCard}>
            <View className={styles.menuItem} onClick={() => handleMenuClick('myBookings')}>
              <View className={`${styles.menuIcon} ${styles.menuIcon1}`}>
                <Text>📅</Text>
              </View>
              <View className={styles.menuContent}>
                <Text className={styles.menuTitle}>我的预约</Text>
                <Text className={styles.menuDesc}>查看和管理所有预约记录</Text>
              </View>
              <Text className={styles.menuArrow}>›</Text>
            </View>

            <View className={styles.menuItem} onClick={() => handleMenuClick('approval')}>
              <View className={`${styles.menuIcon} ${styles.menuIcon2}`}>
                <Text>✅</Text>
              </View>
              <View className={styles.menuContent}>
                <Text className={styles.menuTitle}>审批中心</Text>
                <Text className={styles.menuDesc}>处理待审批的预约申请</Text>
              </View>
              <Text className={styles.menuArrow}>›</Text>
            </View>

            <View className={styles.menuItem} onClick={() => handleMenuClick('help')}>
              <View className={`${styles.menuIcon} ${styles.menuIcon3}`}>
                <Text>❓</Text>
              </View>
              <View className={styles.menuContent}>
                <Text className={styles.menuTitle}>使用帮助</Text>
                <Text className={styles.menuDesc}>预约规则和常见问题</Text>
              </View>
              <Text className={styles.menuArrow}>›</Text>
            </View>

            <View className={styles.menuItem} onClick={() => handleMenuClick('about')}>
              <View className={`${styles.menuIcon} ${styles.menuIcon4}`}>
                <Text>ℹ️</Text>
              </View>
              <View className={styles.menuContent}>
                <Text className={styles.menuTitle}>关于我们</Text>
                <Text className={styles.menuDesc}>版本信息和联系我们</Text>
              </View>
              <Text className={styles.menuArrow}>›</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default MinePage;
