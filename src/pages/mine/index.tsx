import React, { useState, useMemo } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import StatusBadge from '@/components/StatusBadge';
import { useUserStore } from '@/store/useUserStore';
import { useBookingStore } from '@/store/useBookingStore';
import { formatDate, timeToMinutes } from '@/utils/date';
import type { Booking, BookingStatus } from '@/types/booking';

const roleMap = {
  student: '学生',
  leader: '组长',
  counselor: '辅导员',
  admin: '管理员'
};

type TabFilterKey = 'all' | 'pending' | 'approved' | 'checked_in' | 'completed' | 'rejected';

const tabFilters: { label: string; key: TabFilterKey }[] = [
  { label: '全部', key: 'all' },
  { label: '待审批', key: 'pending' },
  { label: '已通过', key: 'approved' },
  { label: '使用中', key: 'checked_in' },
  { label: '已完成', key: 'completed' },
  { label: '已驳回', key: 'rejected' }
];

const isCheckInTimeReached = (booking: Booking): boolean => {
  const now = new Date();
  const todayStr = formatDate(now, 'YYYY-MM-DD');
  if (booking.date < todayStr) return true;
  if (booking.date > todayStr) return false;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = timeToMinutes(booking.startTime);
  return nowMinutes >= startMinutes - 15;
};

const MinePage: React.FC = () => {
  const currentUser = useUserStore((state) => state.currentUser);
  const borrowRecords = useUserStore((state) => state.getUserBorrowRecords(currentUser.id));
  const getUserBookings = useBookingStore((state) => state.getUserBookings);
  const checkIn = useBookingStore((state) => state.checkIn);
  const checkOut = useBookingStore((state) => state.checkOut);
  const [activeTab, setActiveTab] = useState<TabFilterKey>('all');
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
    const rejected = myBookings.filter((b) => b.status === 'rejected').length;
    return { total, pending, approved, completed, rejected };
  }, [myBookings]);

  const filteredBookings = useMemo(() => {
    switch (activeTab) {
      case 'pending':
        return myBookings.filter((b) =>
          b.status === 'pending_leader' || b.status === 'pending_counselor' || b.status === 'pending_admin'
        );
      case 'approved':
        return myBookings.filter((b) => b.status === 'approved');
      case 'checked_in':
        return myBookings.filter((b) => b.status === 'checked_in');
      case 'completed':
        return myBookings.filter((b) => b.status === 'completed');
      case 'rejected':
        return myBookings.filter((b) => b.status === 'rejected');
      case 'all':
      default:
        return myBookings;
    }
  }, [myBookings, activeTab]);

  usePullDownRefresh(() => {
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
    Taro.navigateTo({ url: `/pages/bookingDetail/index?id=${booking.id}` });
  };

  const handleCheckIn = (booking: Booking, e: any) => {
    e.stopPropagation();
    if (!isCheckInTimeReached(booking)) {
      Taro.showToast({
        title: `未到签到时间，${booking.startTime} 前可签到`,
        icon: 'none',
        duration: 2500
      });
      return;
    }
    Taro.showModal({
      title: '确认签到',
      content: `确认签到使用「${booking.room.name}」？`,
      success: (res) => {
        if (res.confirm) {
          checkIn(booking.id);
          Taro.showToast({ title: '签到成功', icon: 'success' });
        }
      }
    });
  };

  const handleCheckOut = (booking: Booking, e: any) => {
    e.stopPropagation();
    const unreturnedItems = booking.equipmentUsage?.filter((eq) => eq.borrowed && !eq.returned);
    if (unreturnedItems && unreturnedItems.length > 0) {
      Taro.showToast({
        title: `还有${unreturnedItems.length}件设备未归还，请先归还`,
        icon: 'none',
        duration: 2500
      });
      return;
    }
    Taro.showModal({
      title: '确认签退',
      content: '确认使用完毕并签退？',
      success: (res) => {
        if (res.confirm) {
          checkOut(booking.id);
          Taro.showToast({ title: '签退成功', icon: 'success' });
        }
      }
    });
  };

  const handleEditBooking = (booking: Booking, e: any) => {
    e.stopPropagation();
    const params = [
      `editBookingId=${booking.id}`,
      `roomId=${booking.roomId}`,
      `date=${booking.date}`,
      `startTime=${booking.startTime}`,
      `endTime=${booking.endTime}`,
      `purpose=${encodeURIComponent(booking.purpose)}`,
      `participantCount=${booking.participantCount}`,
      `participants=${encodeURIComponent(booking.participants.join(','))}`,
      `equipmentNeeds=${encodeURIComponent(booking.equipmentNeeds.join(','))}`,
      `remarks=${encodeURIComponent(booking.remarks || '')}`
    ].join('&');
    Taro.navigateTo({ url: `/pages/bookingForm/index?${params}` });
  };

  const handleViewAllBookings = () => {
    Taro.switchTab({ url: '/pages/booking/index' });
  };

  const handleMenuClick = (type: string) => {
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

  const renderActionBtn = (booking: Booking) => {
    const isOwner = booking.userId === currentUser.id;
    if (!isOwner) return null;

    const canCheckIn = booking.status === 'approved';
    const canCheckOut = booking.status === 'checked_in';
    const canCancel = ['pending_leader', 'pending_counselor', 'pending_admin', 'approved'].includes(booking.status);
    const checkInReached = canCheckIn && isCheckInTimeReached(booking);

    return (
      <View className={styles.actionRow}>
        {canCheckIn && checkInReached && (
          <View className={styles.actionBtnPrimary} onClick={(e) => handleCheckIn(booking, e)}>
            <Text>签到</Text>
          </View>
        )}
        {canCheckIn && !checkInReached && (
          <View className={styles.actionBtnDisabled}>
            <Text>未到签到时间</Text>
          </View>
        )}
        {canCheckOut && (
          <View className={styles.actionBtnSuccess} onClick={(e) => handleCheckOut(booking, e)}>
            <Text>签退</Text>
          </View>
        )}
        {canCancel && (
          <View className={styles.actionBtnSecondary} onClick={(e) => { e.stopPropagation(); handleBookingClick(booking); }}>
            <Text>详情</Text>
          </View>
        )}
        {booking.status === 'rejected' && (
          <View className={styles.actionBtnPrimary} onClick={(e) => handleEditBooking(booking, e)}>
            <Text>重新编辑</Text>
          </View>
        )}
        {booking.status === 'completed' && (
          <View className={styles.actionBtnSecondary} onClick={(e) => { e.stopPropagation(); handleBookingClick(booking); }}>
            <Text>查看详情</Text>
          </View>
        )}
      </View>
    );
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
                key={tab.key}
                className={`${styles.tabItem} ${activeTab === tab.key ? styles.active : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <Text>{tab.label}</Text>
                {tab.key !== 'all' && (
                  <Text className={styles.tabCount}>
                    {tab.key === 'pending' ? stats.pending :
                     tab.key === 'approved' ? stats.approved :
                     tab.key === 'checked_in' ? myBookings.filter(b => b.status === 'checked_in').length :
                     tab.key === 'completed' ? stats.completed :
                     tab.key === 'rejected' ? stats.rejected : 0}
                  </Text>
                )}
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
                {renderActionBtn(booking)}
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
