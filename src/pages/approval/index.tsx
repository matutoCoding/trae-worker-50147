import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Textarea } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import StatusBadge from '@/components/StatusBadge';
import { useUserStore } from '@/store/useUserStore';
import { useBookingStore } from '@/store/useBookingStore';
import { useApprovalStore } from '@/store/useApprovalStore';
import { canApprove } from '@/utils/approvalFlow';
import { formatDate, getDayOfWeek } from '@/utils/date';
import type { Booking } from '@/types/booking';
import classnames from 'classnames';

const ApprovalPage: React.FC = () => {
  const currentUser = useUserStore((state) => state.currentUser);
  const bookings = useBookingStore((state) => state.bookings);
  const approveBooking = useApprovalStore((state) => state.approveBooking);
  const rejectBooking = useApprovalStore((state) => state.rejectBooking);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [refreshing, setRefreshing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const pendingApprovals = useMemo(() => {
    return bookings.filter((booking) => {
      if (!booking.approvalRecord) return false;
      if (booking.status === 'rejected' || booking.status === 'cancelled' ||
          booking.status === 'completed' || booking.status === 'approved' ||
          booking.status === 'checked_in') return false;
      return canApprove(currentUser, booking.approvalRecord);
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [bookings, currentUser]);

  const approvalHistory = useMemo(() => {
    return bookings.filter((booking) => {
      if (!booking.approvalRecord) return false;
      const myApproval = booking.approvalRecord.nodes.find(
        (n) => n.approverId === currentUser.id && n.status !== 'pending'
      );
      return !!myApproval;
    }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [bookings, currentUser.id]);

  usePullDownRefresh(() => {
    console.log('[ApprovalPage] Pull to refresh');
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 1000);
  });

  useDidShow(() => {
    console.log('[ApprovalPage] Page shown');
  });

  const handleViewDetail = (booking: Booking) => {
    Taro.navigateTo({ url: `/pages/approvalDetail/index?id=${booking.id}` });
  };

  const handleApprove = (booking: Booking) => {
    console.log('[ApprovalPage] Approve booking:', booking.bookingNo);
    Taro.showModal({
      title: '确认通过',
      content: '确定要通过该预约申请吗？',
      success: (res) => {
        if (res.confirm) {
          try {
            const result = approveBooking(booking.id, currentUser, '同意申请');
            const toastMsg = result?.newStatus === 'approved' ? '审批通过，预约成功！' : '审批通过，已流转至下一节点';
            Taro.showToast({ title: toastMsg, icon: 'success' });
          } catch (error: any) {
            console.error('[ApprovalPage] Approve error:', error);
            Taro.showToast({ title: error.message || '操作失败', icon: 'none' });
          }
        }
      }
    });
  };

  const handleReject = (booking: Booking) => {
    console.log('[ApprovalPage] Reject booking:', booking.bookingNo);
    setSelectedBooking(booking);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) {
      Taro.showToast({ title: '请填写驳回原因', icon: 'none' });
      return;
    }

    if (selectedBooking) {
      try {
        rejectBooking(selectedBooking.id, currentUser, rejectReason.trim());
        Taro.showToast({ title: '已驳回', icon: 'success' });
        setShowRejectModal(false);
        setSelectedBooking(null);
        setRejectReason('');
      } catch (error: any) {
        console.error('[ApprovalPage] Reject error:', error);
        Taro.showToast({ title: error.message || '操作失败', icon: 'none' });
      }
    }
  };

  const getMyApprovalInfo = (booking: Booking) => {
    if (!booking.approvalRecord) return null;
    return booking.approvalRecord.nodes.find((n) => n.approverId === currentUser.id);
  };

  return (
    <View className={styles.pageContainer}>
      <View className={styles.tabs}>
        <View
          className={`${styles.tabItem} ${activeTab === 'pending' ? styles.active : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <Text className={styles.tabText}>待我审批</Text>
          {pendingApprovals.length > 0 && (
            <View className={styles.tabBadge}>
              <Text className={styles.badgeText}>{pendingApprovals.length}</Text>
            </View>
          )}
        </View>
        <View
          className={`${styles.tabItem} ${activeTab === 'history' ? styles.active : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <Text className={styles.tabText}>我已审批</Text>
        </View>
      </View>

      <ScrollView scrollY refresherEnabled refresherTriggered={refreshing}>
        <View className={styles.tabContent}>
          {activeTab === 'pending' && (
            <View className={styles.bookingList}>
              {pendingApprovals.map((booking) => (
                <View
                  key={booking.id}
                  className={styles.bookingCard}
                  onClick={() => handleViewDetail(booking)}
                >
                  <View className={styles.cardHeader}>
                    <View className={styles.roomInfo}>
                      <Text className={styles.roomName}>{booking.room.name}</Text>
                      <Text className={styles.applicantInfo}>
                        申请人：{booking.user.name} · {booking.user.department}
                      </Text>
                    </View>
                    <StatusBadge status={booking.status} type="booking" size="sm" />
                  </View>

                  <View className={styles.dateRow}>
                    <Text className={styles.dateText}>
                      {formatDate(booking.date, 'MM月DD日')} {getDayOfWeek(booking.date)}
                    </Text>
                    <Text className={styles.timeText}>
                      {booking.startTime} - {booking.endTime}
                    </Text>
                  </View>

                  <View className={styles.purposeRow}>
                    <Text className={styles.purposeLabel}>用途：</Text>
                    <Text className={styles.purposeText}>{booking.purpose}</Text>
                  </View>

                  <View className={styles.participantRow}>
                    <Text className={styles.participantLabel}>参会人：</Text>
                    <Text className={styles.participantText}>
                      {booking.participants.join('、')}
                    </Text>
                  </View>

                  <View className={styles.cardFooter}>
                    <Text className={styles.submitTime}>
                      提交时间：{formatDate(booking.createdAt, 'MM-DD HH:mm')}
                    </Text>
                    <View className={styles.actionButtons} onClick={(e) => e.stopPropagation()}>
                      <View className={styles.rejectBtn} onClick={() => handleReject(booking)}>
                        <Text className={styles.rejectBtnText}>驳回</Text>
                      </View>
                      <View className={styles.approveBtn} onClick={() => handleApprove(booking)}>
                        <Text className={styles.approveBtnText}>通过</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}

              {pendingApprovals.length === 0 && (
                <View className={styles.emptyState}>
                  <Text className={styles.emptyIcon}>✅</Text>
                  <Text className={styles.emptyText}>暂无待审批事项</Text>
                  <Text className={styles.emptySubText}>所有申请已处理完毕</Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'history' && (
            <View className={styles.bookingList}>
              {approvalHistory.map((booking) => {
                const myApproval = getMyApprovalInfo(booking);
                const cardClass = classnames(styles.bookingCard, {
                  [styles.approved]: myApproval?.status === 'approved',
                  [styles.rejected]: myApproval?.status === 'rejected'
                });

                return (
                  <View
                    key={booking.id}
                    className={cardClass}
                    onClick={() => handleViewDetail(booking)}
                  >
                    <View className={styles.cardHeader}>
                      <View className={styles.roomInfo}>
                        <Text className={styles.roomName}>{booking.room.name}</Text>
                        <Text className={styles.applicantInfo}>
                          申请人：{booking.user.name} · {booking.user.department}
                        </Text>
                      </View>
                      <StatusBadge status={booking.status} type="booking" size="sm" />
                    </View>

                    <View className={styles.dateRow}>
                      <Text className={styles.dateText}>
                        {formatDate(booking.date, 'MM月DD日')} {getDayOfWeek(booking.date)}
                      </Text>
                      <Text className={styles.timeText}>
                        {booking.startTime} - {booking.endTime}
                      </Text>
                    </View>

                    <View className={styles.purposeRow}>
                      <Text className={styles.purposeLabel}>用途：</Text>
                      <Text className={styles.purposeText}>{booking.purpose}</Text>
                    </View>

                    <View className={styles.cardFooter}>
                      <View className={styles.approvalInfo}>
                        <View>
                          <Text className={styles.approverText}>
                            {myApproval?.status === 'approved' ? '已通过' : '已驳回'}
                          </Text>
                          <Text className={styles.approvalTime}>
                            {myApproval?.processedAt && formatDate(myApproval.processedAt, 'MM-DD HH:mm')}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {myApproval?.comment && (
                      <View className={styles.commentRow}>
                        <Text className={styles.commentLabel}>我的意见：</Text>
                        <Text className={styles.commentText}>{myApproval.comment}</Text>
                      </View>
                    )}
                  </View>
                );
              })}

              {approvalHistory.length === 0 && (
                <View className={styles.emptyState}>
                  <Text className={styles.emptyIcon}>📋</Text>
                  <Text className={styles.emptyText}>暂无审批记录</Text>
                  <Text className={styles.emptySubText}>您处理的审批将显示在这里</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {showRejectModal && (
        <View className={styles.rejectModal} onClick={() => setShowRejectModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>驳回申请</Text>

            <View className={styles.textareaWrapper}>
              <Textarea
                className={styles.textarea}
                placeholder="请填写驳回原因..."
                placeholderClass={styles.textareaPlaceholder}
                value={rejectReason}
                onInput={(e) => setRejectReason(e.detail.value)}
                maxlength={200}
                autoHeight
              />
            </View>

            <View className={styles.modalActions}>
              <View className={styles.modalCancelBtn} onClick={() => setShowRejectModal(false)}>
                <Text className={styles.modalCancelText}>取消</Text>
              </View>
              <View className={styles.modalConfirmBtn} onClick={handleConfirmReject}>
                <Text className={styles.modalConfirmText}>确认驳回</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default ApprovalPage;
