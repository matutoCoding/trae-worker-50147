import React, { useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useDidShow, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import StatusBadge from '@/components/StatusBadge';
import { useBookingStore } from '@/store/useBookingStore';
import { useUserStore } from '@/store/useUserStore';
import { formatDate, formatDateTime } from '@/utils/date';
import { BOOKING_STATUS_MAP } from '@/types/booking';
import type { Booking } from '@/types/booking';

const BookingDetailPage: React.FC = () => {
  const router = useRouter();
  const bookingId = router.params.id as string;
  const getBookingById = useBookingStore((state) => state.getBookingById);
  const cancelBooking = useBookingStore((state) => state.cancelBooking);
  const checkIn = useBookingStore((state) => state.checkIn);
  const checkOut = useBookingStore((state) => state.checkOut);
  const currentUser = useUserStore((state) => state.currentUser);
  const [booking, setBooking] = useState<Booking | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);

  const loadBooking = () => {
    const found = getBookingById(bookingId);
    setBooking(found);
    if (!found) {
      Taro.showToast({ title: '预约不存在', icon: 'none' });
    }
  };

  useDidShow(() => {
    console.log('[BookingDetailPage] Page shown, bookingId:', bookingId);
    loadBooking();
  });

  usePullDownRefresh(() => {
    console.log('[BookingDetailPage] Pull to refresh');
    setRefreshing(true);
    setTimeout(() => {
      loadBooking();
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 500);
  });

  const handleCancel = () => {
    if (!booking) return;
    console.log('[BookingDetailPage] Cancel clicked:', booking.bookingNo);
    setShowCancelModal(true);
  };

  const confirmCancel = () => {
    if (!booking) return;
    if (!cancelReason.trim()) {
      Taro.showToast({ title: '请输入取消原因', icon: 'none' });
      return;
    }
    console.log('[BookingDetailPage] Confirm cancel:', { reason: cancelReason });
    cancelBooking(booking.id, cancelReason, currentUser);
    setShowCancelModal(false);
    Taro.showToast({ title: '已取消预约', icon: 'success' });
    setTimeout(() => {
      loadBooking();
    }, 500);
  };

  const handleCheckIn = () => {
    if (!booking) return;
    console.log('[BookingDetailPage] Check in:', booking.bookingNo);
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
    console.log('[BookingDetailPage] Check out:', booking.bookingNo);
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

  const handleGoToCheckIn = () => {
    if (!booking) return;
    Taro.navigateTo({ url: `/pages/checkIn/index?id=${booking.id}` });
  };

  const handleEdit = () => {
    if (!booking) return;
    console.log('[BookingDetailPage] Edit clicked:', booking.bookingNo);
    Taro.showToast({ title: '驳回后可修改', icon: 'none' });
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

  const statusInfo = BOOKING_STATUS_MAP[booking.status];
  const isOwner = booking.userId === currentUser.id;
  const canCancel = isOwner && ['pending_leader', 'pending_counselor', 'pending_admin', 'approved'].includes(booking.status);
  const canCheckIn = isOwner && booking.status === 'approved';
  const canCheckOut = isOwner && booking.status === 'checked_in';
  const canEdit = booking.status === 'rejected' && isOwner;

  const showActions = canCancel || canCheckIn || canCheckOut || canEdit;

  return (
    <ScrollView className={styles.pageContainer} scrollY refresherEnabled refresherTriggered={refreshing}>
      <View className={styles.content}>
        <View className={styles.headerCard}>
          <Text className={styles.bookingNo}>预约号：{booking.bookingNo}</Text>
          <View className={styles.bookingStatus}>
            <StatusBadge status={booking.status} type="booking" size="md" />
          </View>
          <Text className={styles.roomName}>{booking.room.name}</Text>
          <Text className={styles.bookingTime}>
            {formatDate(booking.date, 'YYYY年MM月DD日')} {booking.startTime} - {booking.endTime}
          </Text>
        </View>

        <View className={styles.infoCard}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>📝</Text>
            预约信息
          </Text>
          <View className={styles.infoList}>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>申请人</Text>
              <Text className={styles.infoValue}>{booking.user.name} ({booking.user.department})</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>使用用途</Text>
              <Text className={styles.infoValue}>{booking.purpose}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>参会人数</Text>
              <Text className={styles.infoValue}>{booking.participantCount}人</Text>
            </View>
            {booking.participants.length > 0 && (
              <View className={styles.infoItem}>
                <Text className={styles.infoLabel}>参会人员</Text>
                <View className={styles.tagList}>
                  {booking.participants.map((p, i) => (
                    <Text key={i} className={styles.tagItem}>{p}</Text>
                  ))}
                </View>
              </View>
            )}
            {booking.equipmentNeeds.length > 0 && (
              <View className={styles.infoItem}>
                <Text className={styles.infoLabel}>设备需求</Text>
                <View className={styles.tagList}>
                  {booking.equipmentNeeds.map((eq, i) => (
                    <Text key={i} className={styles.tagItem}>{eq}</Text>
                  ))}
                </View>
              </View>
            )}
            {booking.remarks && (
              <View className={styles.infoItem}>
                <Text className={styles.infoLabel}>备注</Text>
                <Text className={styles.infoValue}>{booking.remarks}</Text>
              </View>
            )}
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>提交时间</Text>
              <Text className={styles.infoValue}>{formatDateTime(booking.createdAt)}</Text>
            </View>
          </View>
        </View>

        {booking.rejectedReason && (
          <View className={styles.infoCard}>
            <View className={styles.rejectSection}>
              <Text className={styles.rejectTitle}>❌ 驳回原因</Text>
              <Text className={styles.rejectReason}>{booking.rejectedReason}</Text>
              {booking.rejectedBy && (
                <Text className={styles.rejectReason} style={{ marginTop: '$spacing-xs', opacity: 0.8 }}>
                  驳回人：{booking.rejectedBy}
                </Text>
              )}
            </View>
          </View>
        )}

        {booking.cancelledReason && (
          <View className={styles.infoCard}>
            <View className={styles.rejectSection}>
              <Text className={styles.rejectTitle}>⚠️ 取消原因</Text>
              <Text className={styles.rejectReason}>{booking.cancelledReason}</Text>
            </View>
          </View>
        )}

        {(booking.checkInTime || booking.checkOutTime) && (
          <View className={styles.infoCard}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>⏰</Text>
              使用记录
            </Text>
            <View className={styles.infoList}>
              {booking.checkInTime && (
                <View className={styles.infoItem}>
                  <Text className={styles.infoLabel}>签到时间</Text>
                  <Text className={styles.infoValue}>{formatDateTime(booking.checkInTime)}</Text>
                </View>
              )}
              {booking.checkOutTime && (
                <View className={styles.infoItem}>
                  <Text className={styles.infoLabel}>签退时间</Text>
                  <Text className={styles.infoValue}>{formatDateTime(booking.checkOutTime)}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {booking.approvalRecord && (
          <View className={styles.approvalSection}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>✅</Text>
              审批流程
            </Text>
            <View className={styles.approvalFlow}>
              {booking.approvalRecord.nodes.map((node) => (
                <View key={node.id} className={styles.approvalNode}>
                  <View className={`${styles.nodeDot} ${styles[node.status]}`} />
                  <View className={styles.nodeLine} />
                  <View className={styles.nodeContent}>
                    <View className={styles.nodeHeader}>
                      <Text className={styles.nodeName}>{node.nodeName}</Text>
                      <Text className={`${styles.nodeStatus} ${styles[node.status]}`}>
                        {node.status === 'pending' ? '待审批' :
                         node.status === 'approved' ? '已通过' :
                         node.status === 'rejected' ? '已驳回' : '已跳过'}
                      </Text>
                    </View>
                    {node.approverName && (
                      <Text className={styles.nodeInfo}>
                        {node.approverName} · {node.processedAt ? formatDateTime(node.processedAt) : ''}
                      </Text>
                    )}
                    {node.comment && (
                      <View className={styles.nodeComment}>
                        <Text>{node.comment}</Text>
                      </View>
                    )}
                    {node.status === 'pending' && !node.approverName && (
                      <Text className={styles.nodeInfo}>等待审批中...</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {showActions && (
        <View className={styles.bottomBar}>
          {canEdit && (
            <View className={styles.btnPrimary} onClick={handleEdit}>
              <Text>重新编辑</Text>
            </View>
          )}
          {canCheckIn && (
            <View className={styles.btnPrimary} onClick={handleGoToCheckIn}>
              <Text>使用登记</Text>
            </View>
          )}
          {canCheckOut && (
            <View className={`${styles.btnPrimary} ${styles.success}`} onClick={handleCheckOut}>
              <Text>签退</Text>
            </View>
          )}
          {canCancel && (
            <View className={`${styles.btnSecondary} ${styles.danger}`} onClick={handleCancel}>
              <Text>取消预约</Text>
            </View>
          )}
        </View>
      )}

      {showCancelModal && (
        <View style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '0 40rpx'
        }} onClick={() => setShowCancelModal(false)}>
          <View style={{
            backgroundColor: '#fff',
            borderRadius: '16rpx',
            padding: '32rpx',
            width: '100%',
            maxWidth: '600rpx'
          }} onClick={(e) => e.stopPropagation()}>
            <Text style={{ fontSize: '32rpx', fontWeight: 'bold', marginBottom: '24rpx' }}>取消预约</Text>
            <Text style={{ fontSize: '28rpx', color: '#666', marginBottom: '24rpx' }}>请输入取消原因：</Text>
            <textarea
              placeholder="请输入取消原因"
              value={cancelReason}
              onInput={(e) => setCancelReason(e.detail.value)}
              style={{
                width: '100%',
                height: '160rpx',
                padding: '16rpx',
                backgroundColor: '#f5f7fa',
                borderRadius: '8rpx',
                fontSize: '28rpx',
                marginBottom: '24rpx',
                boxSizing: 'border-box'
              }}
              maxlength={200}
            />
            <View style={{ display: 'flex', gap: '16rpx' }}>
              <View
                style={{
                  flex: 1,
                  padding: '20rpx',
                  textAlign: 'center',
                  border: '2rpx solid #ddd',
                  borderRadius: '8rpx',
                  fontSize: '28rpx',
                  color: '#666'
                }}
                onClick={() => setShowCancelModal(false)}
              >
                <Text>取消</Text>
              </View>
              <View
                style={{
                  flex: 1,
                  padding: '20rpx',
                  textAlign: 'center',
                  backgroundColor: '#FF4D4F',
                  borderRadius: '8rpx',
                  fontSize: '28rpx',
                  color: '#fff'
                }}
                onClick={confirmCancel}
              >
                <Text>确认取消</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default BookingDetailPage;
