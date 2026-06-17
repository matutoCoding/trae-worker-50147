import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import Calendar from '@/components/Calendar';
import TimeSlot from '@/components/TimeSlot';
import RoomCard from '@/components/RoomCard';
import { useRoomStore } from '@/store/useRoomStore';
import { useBookingStore } from '@/store/useBookingStore';
import { getToday, getAvailableTimeSlots } from '@/utils/conflict';
import type { Room } from '@/types/room';

const filterOptions = [
  { key: 'all', label: '全部' },
  { key: 'floor1', label: '一楼' },
  { key: 'floor2', label: '二楼' },
  { key: 'floor3', label: '三楼' },
  { key: 'capacity4', label: '4人以下' },
  { key: 'capacity8', label: '4-8人' },
  { key: 'capacityMore', label: '8人以上' },
  { key: 'projector', label: '有投影仪' }
];

const BookingPage: React.FC = () => {
  const rooms = useRoomStore((state) => state.rooms);
  const filterRooms = useRoomStore((state) => state.filterRooms);
  const bookings = useBookingStore((state) => state.bookings);
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [activeFilters, setActiveFilters] = useState<string[]>(['all']);
  const [showTimeSlotModal, setShowTimeSlotModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<Array<{ startTime: string; endTime: string }>>([]);
  const [refreshing, setRefreshing] = useState(false);

  const filteredRooms = useMemo(() => {
    if (activeFilters.includes('all')) {
      return rooms.filter((r) => r.status === 'available');
    }

    let filters: Parameters<typeof filterRooms>[0] = {};

    activeFilters.forEach((filter) => {
      switch (filter) {
        case 'floor1':
          filters.floor = '一楼';
          break;
        case 'floor2':
          filters.floor = '二楼';
          break;
        case 'floor3':
          filters.floor = '三楼';
          break;
        case 'capacity4':
          filters.minCapacity = 1;
          break;
        case 'capacity8':
          filters.minCapacity = 4;
          break;
        case 'capacityMore':
          filters.minCapacity = 8;
          break;
        case 'projector':
          filters.hasEquipment = ['投影仪'];
          break;
      }
    });

    return filterRooms(filters);
  }, [rooms, activeFilters, filterRooms]);

  const timeSlots = useMemo(() => {
    if (!selectedRoom) return [];
    return getAvailableTimeSlots(
      selectedDate,
      selectedRoom.id,
      bookings,
      selectedRoom.openTime,
      selectedRoom.closeTime,
      60
    );
  }, [selectedRoom, selectedDate, bookings]);

  useEffect(() => {
    console.log('[BookingPage] Page mounted');
  }, []);

  useDidShow(() => {
    console.log('[BookingPage] Page shown');
  });

  usePullDownRefresh(() => {
    console.log('[BookingPage] Pull to refresh');
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 1000);
  });

  const handleFilterClick = (filterKey: string) => {
    console.log('[BookingPage] Filter clicked:', filterKey);
    
    if (filterKey === 'all') {
      setActiveFilters(['all']);
      return;
    }

    setActiveFilters((prev) => {
      const newFilters = prev.filter((f) => f !== 'all');
      if (prev.includes(filterKey)) {
        const result = newFilters.filter((f) => f !== filterKey);
        return result.length === 0 ? ['all'] : result;
      } else {
        return [...newFilters, filterKey];
      }
    });
  };

  const handleRoomClick = (room: Room) => {
    console.log('[BookingPage] Room clicked:', room.name);
    setSelectedRoom(room);
    setSelectedSlots([]);
    setShowTimeSlotModal(true);
  };

  const handleTimeSlotClick = (slot: { startTime: string; endTime: string; available: boolean }) => {
    if (!slot.available) return;

    console.log('[BookingPage] Time slot clicked:', slot.startTime);

    setSelectedSlots((prev) => {
      const exists = prev.find((s) => s.startTime === slot.startTime);
      if (exists) {
        return prev.filter((s) => s.startTime !== slot.startTime);
      } else {
        return [...prev, { startTime: slot.startTime, endTime: slot.endTime }].sort((a, b) =>
          a.startTime.localeCompare(b.startTime)
        );
      }
    });
  };

  const handleCloseModal = () => {
    setShowTimeSlotModal(false);
    setSelectedRoom(null);
    setSelectedSlots([]);
  };

  const handleConfirmBooking = () => {
    if (!selectedRoom || selectedSlots.length === 0) {
      Taro.showToast({ title: '请选择时段', icon: 'none' });
      return;
    }

    const mergedStartTime = selectedSlots[0].startTime;
    const mergedEndTime = selectedSlots[selectedSlots.length - 1].endTime;

    console.log('[BookingPage] Confirm booking:', {
      room: selectedRoom.name,
      date: selectedDate,
      startTime: mergedStartTime,
      endTime: mergedEndTime
    });

    Taro.navigateTo({
      url: `/pages/bookingForm/index?roomId=${selectedRoom.id}&date=${selectedDate}&startTime=${mergedStartTime}&endTime=${mergedEndTime}`
    });

    handleCloseModal();
  };

  const getSelectedSummary = () => {
    if (selectedSlots.length === 0) return '未选择';
    if (selectedSlots.length === 1) {
      return `${selectedSlots[0].startTime} - ${selectedSlots[0].endTime}`;
    }
    return `${selectedSlots[0].startTime} - ${selectedSlots[selectedSlots.length - 1].endTime}`;
  };

  return (
    <ScrollView className={styles.pageContainer} scrollY refresherEnabled refresherTriggered={refreshing}>
      <View className={styles.calendarSection}>
        <Calendar
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          minDate={getToday()}
        />
      </View>

      <View className={styles.filterSection}>
        <ScrollView className={styles.filterScroll} scrollX>
          <View className={styles.filterTags}>
            {filterOptions.map((option) => (
              <View
                key={option.key}
                className={`${styles.filterTag} ${activeFilters.includes(option.key) ? styles.active : ''}`}
                onClick={() => handleFilterClick(option.key)}
              >
                <Text className={styles.tagText}>{option.label}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      <View className={styles.roomListSection}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>可预约研讨间</Text>
          <Text className={styles.roomCount}>共 {filteredRooms.length} 间</Text>
        </View>

        <View className={styles.roomList}>
          {filteredRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onClick={() => handleRoomClick(room)}
            />
          ))}
        </View>

        {filteredRooms.length === 0 && (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>🔍</Text>
            <Text className={styles.emptyText}>暂无符合条件的研讨间</Text>
            <Text className={styles.emptySubText}>请尝试调整筛选条件</Text>
          </View>
        )}
      </View>

      {showTimeSlotModal && selectedRoom && (
        <View className={styles.timeSlotModal} onClick={handleCloseModal}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>选择时段</Text>
              <View className={styles.closeBtn} onClick={handleCloseModal}>
                <Text className={styles.closeIcon}>✕</Text>
              </View>
            </View>

            <View className={styles.modalRoomInfo}>
              <Image
                className={styles.modalRoomImage}
                src={selectedRoom.imageUrl}
                mode="aspectFill"
              />
              <View>
                <Text className={styles.modalRoomName}>{selectedRoom.name}</Text>
                <Text className={styles.modalRoomMeta}>
                  {selectedRoom.building} · {selectedRoom.floor} · {selectedRoom.capacity}人
                </Text>
              </View>
            </View>

            <View className={styles.timeSlotSection}>
              <Text className={styles.timeSlotTitle}>
                {selectedDate} 可选时段
              </Text>
              <View className={styles.timeSlotGrid}>
                {timeSlots.map((slot, index) => (
                  <TimeSlot
                    key={index}
                    startTime={slot.startTime}
                    endTime={slot.endTime}
                    available={slot.available}
                    selected={selectedSlots.some((s) => s.startTime === slot.startTime)}
                    conflictInfo={slot.conflictInfo}
                    onClick={() => handleTimeSlotClick(slot)}
                  />
                ))}
              </View>
            </View>

            <View className={styles.legend}>
              <View className={styles.legendItem}>
                <View className={`${styles.legendDot} ${styles.legendAvailable}`} />
                <Text className={styles.legendText}>可预约</Text>
              </View>
              <View className={styles.legendItem}>
                <View className={`${styles.legendDot} ${styles.legendSelected}`} />
                <Text className={styles.legendText}>已选择</Text>
              </View>
              <View className={styles.legendItem}>
                <View className={`${styles.legendDot} ${styles.legendUnavailable}`} />
                <Text className={styles.legendText}>已预约</Text>
              </View>
            </View>

            <View className={styles.selectedSummary}>
              <Text className={styles.summaryLabel}>已选时段</Text>
              <Text className={styles.summaryTime}>{getSelectedSummary()}</Text>
            </View>

            <View className={styles.modalActions}>
              <View className={styles.cancelBtn} onClick={handleCloseModal}>
                <Text className={styles.cancelBtnText}>取消</Text>
              </View>
              <View
                className={`${styles.confirmBtn} ${selectedSlots.length === 0 ? styles.disabled : ''}`}
                onClick={handleConfirmBooking}
              >
                <Text className={styles.confirmBtnText}>
                  下一步 ({selectedSlots.length}个时段)
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default BookingPage;
