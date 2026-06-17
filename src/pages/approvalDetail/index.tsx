import React, { useState } from 'react';
import { View, Text, Image, ScrollView, Textarea } from '@tarojs/components';
import Taro, { useRouter, useDidShow, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import StatusBadge from '@/components/StatusBadge';
import { useBookingStore } from '@/store/useBookingStore';
import { useApprovalStore } from '@/store/useApprovalStore';
import { useUserStore } from '@/store/useUserStore';
import { formatDate, formatDateTime } from '@/utils/date';
import { canApprove, getApprovalProgress } from '@/utils/approvalFlow';
import type { Booking } from '@/types/booking';

type ModalType = 'approve' | 'reject' | 'rollback' | null;

const ApprovalDetailPage: React.FC = () => {
  const router = useRouter();
  const bookingId = router.params.id as string;
  const getBookingById = useBookingStore((state) => state.getBookingById);
  const updateBookingApproval = useBookingStore((state) => state.updateBookingApproval);
  const updateBookingStatus = useBookingStore((state) => state.updateBookingStatus);
  const approveBooking = useApprovalStore((state) => state.approveBooking);
  const rejectBooking = useApprovalStore((state) => state.rejectBooking);
  const rollbackBooking = useApprovalStore((state) => state.rollbackBooking);
  const currentUser = useUserStore((state) => state.currentUser);

  const [booking, setBooking] = useState<Booking | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [comment, setComment] = useState('');

  const loadBooking = () => {
    const found = getBookingById(bookingId);
    setBooking(found);
    if (!found) {
      Taro.showToast({ title: '预约不存在', icon: 'none' });
    }
  };

  useDidShow(() => {
    console.log('[ApprovalDetailPage] Page shown, bookingId:', bookingId);
    loadBooking();
  });

  usePullDownRefresh(() => {
    console.log('[ApprovalDetailPage] Pull to refresh');
    setRefreshing(true);
    setTimeout(() => {
      loadBooking();
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 500);
  });

  const canCurrentUserApprove = React.useMemo(() => {
    if (!booking?.approvalRecord) return false;
    return canApprove(currentUser, booking.approvalRecord);
  }, [booking, currentUser]);

  const canRollback = React.useMemo(() => {
    if (!booking?.approvalRecord) return false;
    const progress = getApprovalProgress(booking.approvalRecord);
    return canCurrentUserApprove && progress.currentStep > 0;
  }, [booking, canCurrentUserApprove]);

  const showActions = canCurrentUserApprove && booking?.status !== 'rejected' && booking?.status !== 'cancelled';

  const handleApprove = () => {
    if (!booking) return;
    console.log('[ApprovalDetailPage] Approve clicked:', booking.bookingNo);
    setModalType('approve');
    setComment('');
  };

  const handleReject = () => {
    if (!booking) return;
    console.log('[ApprovalDetailPage] Reject clicked:', booking.bookingNo);
    setModalType('reject');
    setComment('');
  };

  const handleRollback = () => {
    if (!booking) return;
    console.log('[ApprovalDetailPage] Rollback clicked:', booking.bookingNo);
    setModalType('rollback');
    setComment('');
  };

  const confirmAction = () => {
    if (!booking || !modalType) return;

    if (modalType === 'reject' && !comment.trim()) {
      Taro.showToast({ title: '请输入驳回原因', icon: 'none' });
      return;
    }

    if (modalType === 'rollback' && !comment.trim()) {
      Taro.showToast({ title: '请输入回退原因', icon: 'none' });
      return;
    }

    console.log('[ApprovalDetailPage] Confirm action:', { modalType, comment });

    try {
      let result = null;
      let toastMsg = '';

      if (modalType === 'approve') {
        result = approveBooking(booking.id, currentUser, comment || '同意');
        toastMsg = result?.newStatus === 'approved' ? '审批通过，预约成功！' : '审批通过，已流转至下一节点';
      } else if (modalType === 'reject') {
        result = rejectBooking(booking.id, currentUser, comment);
        toastMsg = '已驳回，申请人可查看驳回原因';
      } else if (modalType === 'rollback') {
        result = rollbackBooking(booking.id, comment);
        toastMsg = '已回退至上一审批节点';
      }

      if (result) {
        Taro.showToast({ title: toastMsg, icon: 'success', duration: 2000 });
      }

      setModalType(null);
      setTimeout(() => {
        loadBooking();
      }, 800);
    } catch (error: any) {
      console.error('[ApprovalDetailPage] Action failed:', error);
      Taro.showToast({ title: error.message || '操作失败', icon: 'none' });
    }
  };

  const closeModal = () => {
    setModalType(null);
    setComment('');
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

  const progress = booking.approvalRecord ? getApprovalProgress(booking.approvalRecord) : null;

  return (
    <ScrollView className={styles.pageContainer} scrollY refresherEnabled refresherTriggered={refreshing}>
      <View className={styles.content}>
        <View className={styles.headerCard}>
          <Text className={styles.bookingNo}>预约号：{booking.bookingNo}</Text>
          <View className={styles.approvalTip}>
            <Text>⏳ 待我审批</Text>
          </View>
          <Text className={styles.roomName}>{booking.room.name}</Text>
          <Text className={styles.bookingTime}>
            {formatDate(booking.date, 'YYYY年MM月DD日')} {booking.startTime} - {booking.endTime}
          </Text>
        </View>

        <View className={styles.infoCard}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>👤</Text>
            申请人信息
          </Text>
          <View className={styles.userCard}>
            <Image className={styles.userAvatar} src={booking.user.avatar} mode="aspectFill" />
            <View className={styles.userInfo}>
              <Text className={styles.userName}>{booking.user.name}</Text>
              <Text className={styles.userDept}>{booking.user.department}</Text>
              {booking.user.studentId && (
                <Text className={styles.userDept}>学号：{booking.user.studentId}</Text>
              )}
            </View>
          </View>
        </View>

        <View className={styles.infoCard}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>📝</Text>
            预约详情
          </Text>
          <View className={styles.infoList}>
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

        {booking.approvalRecord && (
          <View className={styles.approvalSection}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>✅</Text>
              审批流程
            </Text>
            <View className={styles.approvalFlow}>
              {booking.approvalRecord.nodes.map((node, index) => {
                const isCurrent = progress && index === progress.currentStep && node.status === 'pending';
                return (
                  <View
                    key={node.id}
                    className={`${styles.approvalNode} ${isCurrent ? styles.current : ''}`}
                  >
                    <View className={`${styles.nodeDot} ${styles[node.status]}`} />
                    <View className={styles.nodeLine} />
                    <View className={styles.nodeContent}>
                      <View className={styles.nodeHeader}>
                        <View>
                          <Text className={styles.nodeName}>{node.nodeName}</Text>
                          {isCurrent && (
                            <Text className={styles.currentNodeTip}>当前节点</Text>
                          )}
                        </View>
                        <Text className={`${styles.nodeBadge} ${styles[node.status]}`}>
                          <StatusBadge status={node.status} type="approval" size="sm" />
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
                        <Text className={styles.nodeInfo}>
                          {isCurrent ? '请您进行审批' : '等待审批中...'}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </View>

      {showActions && (
        <View className={styles.bottomBar}>
          <View className={styles.btnReject} onClick={handleReject}>
            <Text>驳回</Text>
          </View>
          {canRollback && (
            <View className={styles.btnRollback} onClick={handleRollback}>
              <Text>回退</Text>
            </View>
          )}
          <View className={styles.btnApprove} onClick={handleApprove}>
            <Text>通过</Text>
          </View>
        </View>
      )}

      {modalType && (
        <View className={styles.modalOverlay} onClick={closeModal}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>
              {modalType === 'approve' ? '确认通过' :
               modalType === 'reject' ? '确认驳回' : '确认回退'}
            </Text>
            {modalType === 'approve' && (
              <Text className={styles.modalText}>
                确认通过该预约申请？通过后将流转至下一审批节点。
              </Text>
            )}
            {modalType === 'reject' && (
              <Text className={styles.modalText}>
                确认驳回该预约申请？驳回后申请将被拒绝，请填写驳回原因。
              </Text>
            )}
            {modalType === 'rollback' && (
              <Text className={styles.modalText}>
                确认回退至上一审批节点？请填写回退原因。
              </Text>
            )}
            {modalType !== 'approve' && (
              <Textarea
                className={styles.modalTextarea}
                placeholder={modalType === 'reject' ? '请输入驳回原因...' : '请输入回退原因...'}
                value={comment}
                onInput={(e) => setComment(e.detail.value)}
                maxlength={200}
              />
            )}
            {modalType === 'approve' && (
              <Textarea
                className={styles.modalTextarea}
                placeholder="请输入审批意见（选填）..."
                value={comment}
                onInput={(e) => setComment(e.detail.value)}
                maxlength={200}
              />
            )}
            <View className={styles.modalActions}>
              <View className={styles.modalBtnCancel} onClick={closeModal}>
                <Text>取消</Text>
              </View>
              <View
                className={`${styles.modalBtnConfirm} ${
                  modalType === 'approve' ? styles.success :
                  modalType === 'reject' ? styles.danger : styles.warning
                }`}
                onClick={confirmAction}
              >
                <Text>
                  {modalType === 'approve' ? '确认通过' :
                   modalType === 'reject' ? '确认驳回' : '确认回退'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default ApprovalDetailPage;
