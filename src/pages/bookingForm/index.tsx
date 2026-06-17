import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Input, Textarea, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { useRoomStore } from '@/store/useRoomStore';
import { useBookingStore } from '@/store/useBookingStore';
import { useUserStore } from '@/store/useUserStore';
import { getDateList, getDayOfWeek, formatDate } from '@/utils/date';
import { checkBookingConflict, checkTimeRangeValid } from '@/utils/conflict';
import { mockEquipmentOptions } from '@/data/rooms';
import type { BookingFormData } from '@/types/booking';

const BookingFormPage: React.FC = () => {
  const router = useRouter();
  const roomId = router.params.roomId as string;
  const initialDate = router.params.date as string;

  const getRoomById = useRoomStore((state) => state.getRoomById);
  const addBooking = useBookingStore((state) => state.addBooking);
  const bookings = useBookingStore((state) => state.bookings);
  const currentUser = useUserStore((state) => state.currentUser);

  const room = useMemo(() => getRoomById(roomId), [roomId, getRoomById]);

  const dateList = useMemo(() => getDateList(7), []);

  const [formData, setFormData] = useState<BookingFormData>({
    roomId: roomId || '',
    date: initialDate || dateList[0],
    startTime: '09:00',
    endTime: '10:00',
    purpose: '',
    participantCount: 2,
    participants: [],
    equipmentNeeds: [],
    remarks: ''
  });

  const [conflictInfo, setConflictInfo] = useState<{ hasConflict: boolean; message: string }>({
    hasConflict: false,
    message: ''
  });

  const [timeValid, setTimeValid] = useState<{ valid: boolean; message: string }>({
    valid: true,
    message: ''
  });

  const [participantInput, setParticipantInput] = useState('');

  useEffect(() => {
    if (!room) return;

    const conflict = checkBookingConflict(
      formData.roomId,
      formData.date,
      formData.startTime,
      formData.endTime,
      bookings
    );
    setConflictInfo({ hasConflict: conflict.hasConflict, message: conflict.message });

    const valid = checkTimeRangeValid(
      formData.startTime,
      formData.endTime,
      room.openTime,
      room.closeTime
    );
    setTimeValid(valid);
  }, [formData.roomId, formData.date, formData.startTime, formData.endTime, bookings, room]);

  useDidShow(() => {
    console.log('[BookingFormPage] Page shown');
    if (!room) {
      Taro.showToast({ title: '研讨间不存在', icon: 'none' });
    }
  });

  const isFormValid = useMemo(() => {
    return (
      formData.roomId &&
      formData.date &&
      formData.startTime &&
      formData.endTime &&
      formData.purpose.trim() &&
      formData.participantCount > 0 &&
      !conflictInfo.hasConflict &&
      timeValid.valid
    );
  }, [formData, conflictInfo, timeValid]);

  const handleDateSelect = (date: string) => {
    console.log('[BookingFormPage] Date selected:', date);
    setFormData((prev) => ({ ...prev, date }));
  };

  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    console.log('[BookingFormPage] Time changed:', { field, value });
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePurposeChange = (e: any) => {
    setFormData((prev) => ({ ...prev, purpose: e.detail.value }));
  };

  const handleCountChange = (delta: number) => {
    if (!room) return;
    const newCount = formData.participantCount + delta;
    if (newCount >= 1 && newCount <= room.capacity) {
      setFormData((prev) => ({ ...prev, participantCount: newCount }));
    }
  };

  const handleParticipantAdd = () => {
    if (!participantInput.trim()) return;
    if (formData.participants.length >= formData.participantCount - 1) {
      Taro.showToast({ title: '参会人数已达上限', icon: 'none' });
      return;
    }
    setFormData((prev) => ({
      ...prev,
      participants: [...prev.participants, participantInput.trim()]
    }));
    setParticipantInput('');
  };

  const handleParticipantRemove = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      participants: prev.participants.filter((_, i) => i !== index)
    }));
  };

  const handleEquipmentToggle = (eqName: string) => {
    setFormData((prev) => ({
      ...prev,
      equipmentNeeds: prev.equipmentNeeds.includes(eqName)
        ? prev.equipmentNeeds.filter((e) => e !== eqName)
        : [...prev.equipmentNeeds, eqName]
    }));
  };

  const handleRemarksChange = (e: any) => {
    setFormData((prev) => ({ ...prev, remarks: e.detail.value }));
  };

  const handleSubmit = () => {
    if (!isFormValid || !room) {
      if (conflictInfo.hasConflict) {
        Taro.showToast({ title: conflictInfo.message, icon: 'none' });
      } else if (!timeValid.valid) {
        Taro.showToast({ title: timeValid.message, icon: 'none' });
      } else {
        Taro.showToast({ title: '请完善表单信息', icon: 'none' });
      }
      return;
    }

    console.log('[BookingFormPage] Submitting booking:', formData);

    try {
      const newBooking = addBooking(formData, currentUser, room);
      console.log('[BookingFormPage] Booking created:', newBooking.bookingNo);
      Taro.showModal({
        title: '提交成功',
        content: `预约申请已提交，预约号：${newBooking.bookingNo}\n请等待审批：组长→辅导员→管理员`,
        showCancel: false,
        confirmText: '我知道了',
        success: () => {
          Taro.navigateBack();
        }
      });
    } catch (error: any) {
      console.error('[BookingFormPage] Submit failed:', error);
      Taro.showToast({ title: error.message || '提交失败', icon: 'none' });
    }
  };

  const handleCancel = () => {
    console.log('[BookingFormPage] Cancel clicked');
    Taro.showModal({
      title: '确认取消',
      content: '取消后已填写的信息将丢失，确认取消吗？',
      success: (res) => {
        if (res.confirm) {
          Taro.navigateBack();
        }
      }
    });
  };

  if (!room) {
    return (
      <View className={styles.pageContainer}>
        <View className={styles.content}>
          <Text>加载中...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView className={styles.pageContainer} scrollY>
      <View className={styles.content}>
        {conflictInfo.hasConflict && (
          <View className={styles.conflictAlert}>
            <Text className={styles.conflictIcon}>⚠️</Text>
            <Text className={styles.conflictText}>{conflictInfo.message}</Text>
          </View>
        )}

        {!timeValid.valid && !conflictInfo.hasConflict && (
          <View className={styles.conflictAlert}>
            <Text className={styles.conflictIcon}>⚠️</Text>
            <Text className={styles.conflictText}>{timeValid.message}</Text>
          </View>
        )}

        {!conflictInfo.hasConflict && timeValid.valid && formData.startTime && formData.endTime && (
          <View className={styles.successAlert}>
            <Text className={styles.successIcon}>✅</Text>
            <Text className={styles.successText}>该时段可以预约</Text>
          </View>
        )}

        <View className={styles.formSection}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>🏢</Text>
            研讨间信息
          </Text>
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>研讨间</Text>
            <View className={styles.formValue}>
              <Text>{room.name}</Text>
              <Text className={styles.formArrow}>›</Text>
            </View>
          </View>
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>位置</Text>
            <View className={styles.formValue}>
              <Text>{room.building} {room.floor} · 容纳{room.capacity}人</Text>
            </View>
          </View>
        </View>

        <View className={styles.formSection}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>📅</Text>
            预约日期
          </Text>
          <ScrollView className={styles.datePicker} scrollX>
            {dateList.map((date) => (
              <View
                key={date}
                className={`${styles.dateItem} ${formData.date === date ? styles.selected : ''}`}
                onClick={() => handleDateSelect(date)}
              >
                <Text className={styles.dateWeek}>{getDayOfWeek(date)}</Text>
                <Text className={styles.dateDay}>{formatDate(date, 'MM/DD')}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <View className={styles.formSection}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>🕐</Text>
            预约时段
          </Text>
          <View className={styles.formItem}>
            <Text className={styles.formLabel}><Text className={styles.required}>*</Text>使用时间</Text>
            <View className={styles.timePicker}>
              <View
                className={styles.timeSlot}
                onClick={() => {
                  Taro.showActionSheet({
                    itemList: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'],
                    success: (res) => {
                      const times = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];
                      handleTimeChange('startTime', times[res.tapIndex]);
                    }
                  });
                }}
              >
                <Text className={styles.timeIcon}>⏰</Text>
                <Text>{formData.startTime}</Text>
              </View>
              <Text className={styles.timeDivider}>至</Text>
              <View
                className={styles.timeSlot}
                onClick={() => {
                  Taro.showActionSheet({
                    itemList: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'],
                    success: (res) => {
                      const times = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];
                      handleTimeChange('endTime', times[res.tapIndex]);
                    }
                  });
                }}
              >
                <Text className={styles.timeIcon}>⏰</Text>
                <Text>{formData.endTime}</Text>
              </View>
            </View>
          </View>
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>开放时间</Text>
            <View className={styles.formValue}>
              <Text>{room.openTime} - {room.closeTime}</Text>
            </View>
          </View>
        </View>

        <View className={styles.formSection}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>📝</Text>
            预约信息
          </Text>
          <View className={styles.formItem}>
            <Text className={styles.formLabel}><Text className={styles.required}>*</Text>使用用途</Text>
            <Input
              className={styles.formInput}
              placeholder="请输入使用用途，如：小组讨论、项目评审等"
              value={formData.purpose}
              onInput={handlePurposeChange}
              maxlength={50}
            />
          </View>
          <View className={styles.formItem}>
            <Text className={styles.formLabel}><Text className={styles.required}>*</Text>参会人数</Text>
            <View className={styles.counter}>
              <View
                className={`${styles.counterBtn} ${formData.participantCount <= 1 ? styles.disabled : ''}`}
                onClick={() => handleCountChange(-1)}
              >
                <Text>−</Text>
              </View>
              <Text className={styles.counterValue}>{formData.participantCount}</Text>
              <View
                className={`${styles.counterBtn} ${formData.participantCount >= room.capacity ? styles.disabled : ''}`}
                onClick={() => handleCountChange(1)}
              >
                <Text>+</Text>
              </View>
              <Text style={{ fontSize: '$font-size-sm', color: '$color-text-tertiary' }}>
                (最多{room.capacity}人)
              </Text>
            </View>
          </View>
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>参会人员</Text>
            <View style={{ display: 'flex', gap: '$spacing-sm', marginBottom: '$spacing-sm' }}>
              <Input
                className={styles.formInput}
                style={{ flex: 1 }}
                placeholder="请输入参会人姓名"
                value={participantInput}
                onInput={(e) => setParticipantInput(e.detail.value)}
                onConfirm={handleParticipantAdd}
              />
              <View
                style={{
                  padding: '$spacing-sm $spacing-lg',
                  backgroundColor: '$color-primary',
                  borderRadius: '$radius-md',
                  color: '$color-text-white',
                  fontSize: '$font-size-md'
                }}
                onClick={handleParticipantAdd}
              >
                <Text>添加</Text>
              </View>
            </View>
            {formData.participants.length > 0 && (
              <View className={styles.tagList}>
                {formData.participants.map((p, i) => (
                  <View
                    key={i}
                    className={`${styles.tagItem} ${styles.selected}`}
                    onClick={() => handleParticipantRemove(i)}
                  >
                    <Text>{p} ×</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        <View className={styles.formSection}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>📦</Text>
            设备需求
          </Text>
          <View className={styles.tagList}>
            {mockEquipmentOptions.map((eq) => (
              <View
                key={eq.id}
                className={`${styles.tagItem} ${formData.equipmentNeeds.includes(eq.name) ? styles.selected : ''}`}
                onClick={() => handleEquipmentToggle(eq.name)}
              >
                <Text className={styles.tagIcon}>{eq.icon}</Text>
                <Text>{eq.name}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.formSection}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>💬</Text>
            备注说明
          </Text>
          <Textarea
            className={styles.formTextarea}
            placeholder="请输入其他需要说明的信息（选填）"
            value={formData.remarks}
            onInput={handleRemarksChange}
            maxlength={200}
          />
        </View>

        <View className={styles.formSection}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>✅</Text>
            审批流程
          </Text>
          <View className={styles.approvalFlow}>
            <Text className={styles.approvalTitle}>提交后将进入以下审批流程</Text>
            <View className={styles.approvalSteps}>
              <View className={styles.approvalStep}>
                <View className={styles.stepIcon}>1</View>
                <Text className={styles.stepName}>组长<br />审批</Text>
              </View>
              <View className={styles.stepLine} />
              <View className={styles.approvalStep}>
                <View className={styles.stepIcon}>2</View>
                <Text className={styles.stepName}>辅导员<br />审批</Text>
              </View>
              <View className={styles.stepLine} />
              <View className={styles.approvalStep}>
                <View className={styles.stepIcon}>3</View>
                <Text className={styles.stepName}>管理员<br />审批</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.btnCancel} onClick={handleCancel}>
          <Text>取消</Text>
        </View>
        <View
          className={`${styles.btnSubmit} ${!isFormValid ? styles.disabled : ''}`}
          onClick={handleSubmit}
        >
          <Text>提交申请</Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default BookingFormPage;
