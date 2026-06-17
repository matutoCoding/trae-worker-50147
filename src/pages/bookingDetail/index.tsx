import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro, { useRouter, useDidShow, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import StatusBadge from '@/components/StatusBadge';
import { useBookingStore } from '@/store/useBookingStore';
import { useUserStore } from '@/store/useUserStore';
import { formatDate, formatDateTime, isCheckInTimeReached as checkTimeReached } from '@/utils/date';
import { BOOKING_STATUS_MAP } from '@/types/booking';
import type { Booking, EquipmentUsageItem } from '@/types/booking';
import { mockEquipmentOptions } from '@/data/rooms';

const BookingDetailPage: React.FC = () => {
  const router = useRouter();
  const bookingId = router.params.id as string;
  const getBookingById = useBookingStore((state) => state.getBookingById);
  const cancelBooking = useBookingStore((state) => state.cancelBooking);
  const checkIn = useBookingStore((state) => state.checkIn);
  const checkOut = useBookingStore((state) => state.checkOut);
  const updateActualAttendance = useBookingStore((state) => state.updateActualAttendance);
  const updateEquipmentUsage = useBookingStore((state) => state.updateEquipmentUsage);
  const currentUser = useUserStore((state) => state.currentUser);
  const borrowRecords = useUserStore((state) => state.borrowRecords);
  const [booking, setBooking] = useState<Booking | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [attendanceInput, setAttendanceInput] = useState('');
  const [showAttendanceEdit, setShowAttendanceEdit] = useState(false);

  const loadBooking = () => {
    const found = getBookingById(bookingId);
    setBooking(found);
    if (found) {
      setAttendanceInput(found.actualAttendanceCount?.toString() || '');
    }
    if (!found) {
      Taro.showToast({ title: '预约不存在', icon: 'none' });
    }
  };

  useDidShow(() => {
    loadBooking();
  });

  usePullDownRefresh(() => {
    setRefreshing(true);
    setTimeout(() => {
      loadBooking();
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 500);
  });

  const handleCancel = () => {
    if (!booking) return;
    setShowCancelModal(true);
  };

  const confirmCancel = () => {
    if (!booking) return;
    if (!cancelReason.trim()) {
      Taro.showToast({ title: '请输入取消原因', icon: 'none' });
      return;
    }
    cancelBooking(booking.id, cancelReason, currentUser);
    setShowCancelModal(false);
    Taro.showToast({ title: '已取消预约', icon: 'success' });
    setTimeout(() => loadBooking(), 500);
  };

  const handleCheckIn = () => {
    if (!booking) return;
    if (!checkTimeReached(booking.date, booking.startTime, 15)) {
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
          setTimeout(() => loadBooking(), 500);
        }
      }
    });
  };

  const handleCheckOut = () => {
    if (!booking) return;
    const unreturnedInBooking = booking.equipmentUsage?.filter((e) => e.borrowed && !e.returned) || [];
    const unreturnedInUserStore = borrowRecords.filter(
      (r) => r.bookingId === booking.id && r.borrowerId === currentUser.id && r.status === 'borrowed'
    );
    const totalUnreturned = unreturnedInBooking.length + unreturnedInUserStore.length;
    if (totalUnreturned > 0) {
      Taro.showToast({
        title: `还有${totalUnreturned}件设备未归还，请先归还`,
        icon: 'none',
        duration: 2500
      });
      return;
    }
    Taro.showModal({
      title: '确认签退',
      content: '确认使用完毕并签退？请确保设备已归还、房间整洁。',
      success: (res) => {
        if (res.confirm) {
          checkOut(booking.id);
          Taro.showToast({ title: '签退成功', icon: 'success' });
          setTimeout(() => loadBooking(), 500);
        }
      }
    });
  };

  const handleEdit = () => {
    if (!booking) return;
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

  const handleGoToApproval = () => {
    if (!booking) return;
    Taro.navigateTo({ url: `/pages/approvalDetail/index?id=${booking.id}` });
  };

  const handleAttendanceSave = () => {
    if (!booking) return;
    const count = parseInt(attendanceInput, 10);
    if (isNaN(count) || count < 0) {
      Taro.showToast({ title: '请输入有效人数', icon: 'none' });
      return;
    }
    updateActualAttendance(booking.id, count);
    setShowAttendanceEdit(false);
    Taro.showToast({ title: '已保存', icon: 'success' });
    setTimeout(() => loadBooking(), 300);
  };

  const initEquipmentUsage = () => {
    if (!booking) return;
    const usage: EquipmentUsageItem[] = mockEquipmentOptions.map((eq) => ({
      equipmentId: eq.id,
      equipmentName: eq.name,
      borrowed: false,
      returned: false
    }));
    updateEquipmentUsage(booking.id, usage);
    setTimeout(() => loadBooking(), 300);
  };

  const handleEquipmentBorrow = (eqId: string) => {
    if (!booking) return;
    const currentUsage = booking.equipmentUsage || [];
    const usage = currentUsage.length > 0 ? [...currentUsage] :
      mockEquipmentOptions.map((eq) => ({
        equipmentId: eq.id,
        equipmentName: eq.name,
        borrowed: false,
        returned: false
      }));

    const updated = usage.map((item) => {
      if (item.equipmentId === eqId && !item.borrowed) {
        return {
          ...item,
          borrowed: true,
          borrowTime: formatDateTime(new Date().toISOString())
        };
      }
      return item;
    });
    updateEquipmentUsage(booking.id, updated);
    Taro.showToast({ title: '登记成功', icon: 'success' });
    setTimeout(() => loadBooking(), 300);
  };

  const handleEquipmentReturn = (eqId: string) => {
    if (!booking || !booking.equipmentUsage) return;
    const updated = booking.equipmentUsage.map((item) => {
      if (item.equipmentId === eqId && item.borrowed && !item.returned) {
        return {
          ...item,
          returned: true,
          returnTime: formatDateTime(new Date().toISOString())
        };
      }
      return item;
    });
    updateEquipmentUsage(booking.id, updated);
    Taro.showToast({ title: '归还成功', icon: 'success' });
    setTimeout(() => loadBooking(), 300);
  };

  const approvalProgress = useMemo(() => {
    if (!booking?.approvalRecord) return null;
    const nodes = booking.approvalRecord.nodes;
    const completed = nodes.filter((n) => n.status === 'approved').length;
    const total = nodes.length;
    return { completed, total, percentage: Math.round((completed / total) * 100) };
  }, [booking]);

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
  const canManageUsage = isOwner && (booking.status === 'checked_in' || booking.status === 'completed');
  const checkInTimeReached = canCheckIn && checkTimeReached(booking.date, booking.startTime, 15);
  const showActions = canCancel || canCheckIn || canCheckOut || canEdit;

  const equipmentUsageList = booking.equipmentUsage && booking.equipmentUsage.length > 0
    ? booking.equipmentUsage
    : mockEquipmentOptions.map((eq) => ({
        equipmentId: eq.id,
        equipmentName: eq.name,
        borrowed: false,
        returned: false
      }));

  const borrowedCount = equipmentUsageList.filter((e) => e.borrowed).length;
  const returnedCount = equipmentUsageList.filter((e) => e.returned).length;

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

        {canCheckIn && !checkInTimeReached && (
          <View className={styles.quickActionCardDisabled}>
            <View className={styles.quickActionLeft}>
              <Text className={styles.quickActionIcon}>✋</Text>
              <View>
                <Text className={styles.quickActionTitleDisabled}>未到签到时间</Text>
                <Text className={styles.quickActionDescDisabled}>
                  {booking.date > formatDate(new Date(), 'YYYY-MM-DD')
                    ? `预约日期为${formatDate(booking.date, 'MM月DD日')}，当天 ${booking.startTime} 前可签到`
                    : `${booking.startTime} 前可签到，请稍后再来`}
                </Text>
              </View>
            </View>
          </View>
        )}

        {checkInTimeReached && (
          <View className={styles.quickActionCard} onClick={handleCheckIn}>
            <View className={styles.quickActionLeft}>
              <Text className={styles.quickActionIcon}>✋</Text>
              <View>
                <Text className={styles.quickActionTitle}>立即签到</Text>
                <Text className={styles.quickActionDesc}>已到使用时间，点击一键确认签到</Text>
              </View>
            </View>
            <View className={styles.quickActionArrow}>›</View>
          </View>
        )}

        {canCheckOut && (
          <View className={`${styles.quickActionCard} ${styles.quickActionPurple}`} onClick={handleCheckOut}>
            <View className={styles.quickActionLeft}>
              <Text className={styles.quickActionIcon}>🏁</Text>
              <View>
                <Text className={styles.quickActionTitle}>立即签退</Text>
                <Text className={styles.quickActionDesc}>使用完毕，点击完成签退</Text>
              </View>
            </View>
            <View className={styles.quickActionArrow}>›</View>
          </View>
        )}

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
              <Text className={styles.infoValue}>
                预约 {booking.participantCount} 人
                {booking.actualAttendanceCount !== undefined && booking.status !== 'approved' && (
                  <Text className={styles.infoValueHighlight}> ，实际到场 {booking.actualAttendanceCount} 人</Text>
                )}
              </Text>
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

        {canManageUsage && (
          <View className={styles.infoCard}>
            <View className={styles.sectionHeaderRow}>
              <Text className={styles.sectionTitle}>
                <Text className={styles.sectionIcon}>👥</Text>
                实际到场人数
              </Text>
              {!showAttendanceEdit && (
                <Text className={styles.editLink} onClick={() => setShowAttendanceEdit(true)}>
                  {booking.actualAttendanceCount !== undefined ? '修改' : '补充'}
                </Text>
              )}
            </View>
            {showAttendanceEdit ? (
              <View className={styles.attendanceEdit}>
                <Input
                  type="number"
                  className={styles.attendanceInput}
                  value={attendanceInput}
                  placeholder="请输入实际到场人数"
                  onInput={(e) => setAttendanceInput(e.detail.value)}
                />
                <View className={styles.attendanceBtnGroup}>
                  <View className={styles.btnSmallSecondary} onClick={() => setShowAttendanceEdit(false)}>
                    <Text>取消</Text>
                  </View>
                  <View className={styles.btnSmallPrimary} onClick={handleAttendanceSave}>
                    <Text>保存</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View className={styles.infoItem}>
                <Text className={styles.infoLabel}>实际到场</Text>
                <Text className={styles.infoValue}>
                  {booking.actualAttendanceCount !== undefined
                    ? `${booking.actualAttendanceCount} 人`
                    : <Text style={{ color: '#999' }}>暂未登记，点击"补充"填写</Text>}
                </Text>
              </View>
            )}
          </View>
        )}

        {canManageUsage && (
          <View className={styles.infoCard}>
            <View className={styles.sectionHeaderRow}>
              <Text className={styles.sectionTitle}>
                <Text className={styles.sectionIcon}>📦</Text>
                设备借用和归还
                <Text className={styles.equipmentCount}>(已借{borrowedCount}/已还{returnedCount})</Text>
              </Text>
            </View>
            {!booking.equipmentUsage || booking.equipmentUsage.length === 0 ? (
              <View className={styles.initEquipmentBtn} onClick={initEquipmentUsage}>
                <Text>初始化设备列表</Text>
              </View>
            ) : (
              <View className={styles.equipmentList}>
                {equipmentUsageList.map((eq) => (
                  <View key={eq.equipmentId} className={styles.equipmentRow}>
                    <View className={styles.equipmentRowLeft}>
                      <Text className={styles.eqName}>{eq.equipmentName}</Text>
                      <View className={styles.eqStatusRow}>
                        {eq.borrowed ? (
                          <>
                            <Text className={styles.eqBorrowed}>已借出</Text>
                            {eq.borrowTime && <Text className={styles.eqTime}>借出：{eq.borrowTime}</Text>}
                          </>
                        ) : (
                          <Text className={styles.eqAvailable}>未借出</Text>
                        )}
                        {eq.returned && (
                          <>
                            <Text className={styles.eqReturned}>已归还</Text>
                            {eq.returnTime && <Text className={styles.eqTime}>归还：{eq.returnTime}</Text>}
                          </>
                        )}
                      </View>
                    </View>
                    {booking.status === 'checked_in' && (
                      <View>
                        {!eq.borrowed ? (
                          <View className={styles.btnEqBorrow} onClick={() => handleEquipmentBorrow(eq.equipmentId)}>
                            <Text>借出</Text>
                          </View>
                        ) : !eq.returned ? (
                          <View className={styles.btnEqReturn} onClick={() => handleEquipmentReturn(eq.equipmentId)}>
                            <Text>归还</Text>
                          </View>
                        ) : null}
                      </View>
                    )}
                    {booking.status === 'completed' && !eq.borrowed && (
                      <View className={styles.btnEqBorrow} onClick={() => handleEquipmentBorrow(eq.equipmentId)}>
                        <Text>补登借出</Text>
                      </View>
                    )}
                    {booking.status === 'completed' && eq.borrowed && !eq.returned && (
                      <View className={styles.btnEqReturn} onClick={() => handleEquipmentReturn(eq.equipmentId)}>
                        <Text>补登归还</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {(booking.checkInTime || booking.checkOutTime || booking.status === 'checked_in' || booking.status === 'completed') && (
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

        {booking.rejectedReason && (
          <View className={styles.infoCard}>
            <View className={styles.rejectSection}>
              <Text className={styles.rejectTitle}>❌ 驳回原因</Text>
              <Text className={styles.rejectReason}>{booking.rejectedReason}</Text>
              {booking.rejectedBy && (
                <Text className={styles.rejectReason} style={{ marginTop: '8rpx', opacity: 0.8 }}>
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

        {booking.approvalRecord && (
          <View className={styles.approvalSection}>
            <View className={styles.sectionHeaderRow}>
              <Text className={styles.sectionTitle}>
                <Text className={styles.sectionIcon}>✅</Text>
                审批流程
              </Text>
              {approvalProgress && (
                <Text className={styles.progressText}>
                  {approvalProgress.completed}/{approvalProgress.total}
                </Text>
              )}
              <Text className={styles.editLink} onClick={handleGoToApproval}>查看详情</Text>
            </View>
            <View className={styles.approvalFlow}>
              {booking.approvalRecord.nodes.map((node) => {
                const isCurrent = node.status === 'pending';
                return (
                  <View
                    key={node.id}
                    className={`${styles.approvalNode} ${isCurrent ? styles.approvalNodeCurrent : ''}`}
                  >
                    <View className={`${styles.nodeDot} ${styles[node.status]} ${isCurrent ? styles.nodeDotCurrent : ''}`} />
                    <View className={`${styles.nodeLine} ${node.status === 'approved' ? styles.nodeLineDone : ''}`} />
                    <View className={`${styles.nodeContent} ${isCurrent ? styles.nodeContentCurrent : ''}`}>
                      <View className={styles.nodeHeader}>
                        <View className={styles.nodeHeaderLeft}>
                          <Text className={styles.nodeName}>{node.nodeName}</Text>
                          {isCurrent && <Text className={styles.nodeCurrentTag}>当前审批</Text>}
                        </View>
                        <Text className={`${styles.nodeStatus} ${styles[node.status]}`}>
                          {node.status === 'pending' ? '待审批' :
                           node.status === 'approved' ? '已通过' :
                           node.status === 'rejected' ? '已驳回' : '已跳过'}
                        </Text>
                      </View>
                      {node.approverName && (
                        <Text className={styles.nodeInfo}>
                          处理人：{node.approverName}
                          {node.processedAt && ` · ${formatDateTime(node.processedAt)}`}
                        </Text>
                      )}
                      {!node.approverName && node.status === 'pending' && (
                        <Text className={styles.nodeInfo}>等待审批人处理...</Text>
                      )}
                      {node.comment ? (
                        <View className={styles.nodeComment}>
                          <Text style={{ fontWeight: 'bold', marginBottom: '8rpx', display: 'block' }}>审批意见：</Text>
                          <Text>{node.comment}</Text>
                        </View>
                      ) : node.status === 'approved' ? (
                        <View className={styles.nodeComment}>
                          <Text>（无审批意见）</Text>
                        </View>
                      ) : null}
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
          {canEdit && (
            <View className={styles.btnPrimary} onClick={handleEdit}>
              <Text>重新编辑</Text>
            </View>
          )}
          {canCheckIn && checkInTimeReached && (
            <View className={styles.btnPrimary} onClick={handleCheckIn}>
              <Text>立即签到</Text>
            </View>
          )}
          {canCheckIn && !checkInTimeReached && (
            <View className={`${styles.btnPrimary} ${styles.disabled}`}>
              <Text>未到签到时间</Text>
            </View>
          )}
          {canCheckOut && (
            <View className={`${styles.btnPrimary} ${styles.success}`} onClick={handleCheckOut}>
              <Text>立即签退</Text>
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
