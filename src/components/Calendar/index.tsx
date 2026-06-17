import React, { useState, useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { getDateList, isToday, isPast, isFuture, getShortDayOfWeek, getToday } from '@/utils/date';
import dayjs from 'dayjs';

interface CalendarProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  disabledDates?: string[];
  minDate?: string;
  maxDate?: string;
}

const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  onSelectDate,
  disabledDates = [],
  minDate,
  maxDate
}) => {
  const [currentMonth, setCurrentMonth] = useState(dayjs(selectedDate || getToday()).format('YYYY-MM'));

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const calendarDays = useMemo(() => {
    const year = dayjs(currentMonth).year();
    const month = dayjs(currentMonth).month();
    
    const firstDay = dayjs(currentMonth).startOf('month');
    const lastDay = dayjs(currentMonth).endOf('month');
    
    const startPadding = firstDay.day();
    const totalDays = lastDay.date();
    
    const days: Array<{ date: string; isCurrentMonth: boolean; isDisabled: boolean }> = [];
    
    const prevMonthLastDay = firstDay.subtract(1, 'day').date();
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = firstDay.subtract(i + 1, 'day').format('YYYY-MM-DD');
      days.push({ date, isCurrentMonth: false, isDisabled: true });
    }
    
    for (let i = 1; i <= totalDays; i++) {
      const date = dayjs(currentMonth).date(i).format('YYYY-MM-DD');
      const isDisabled = disabledDates.includes(date) ||
        (minDate && dayjs(date).isBefore(minDate, 'day')) ||
        (maxDate && dayjs(date).isAfter(maxDate, 'day')) ||
        isPast(date) && !isToday(date);
      days.push({ date, isCurrentMonth: true, isDisabled });
    }
    
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = lastDay.add(i, 'day').format('YYYY-MM-DD');
      days.push({ date, isCurrentMonth: false, isDisabled: true });
    }
    
    return days;
  }, [currentMonth, disabledDates, minDate, maxDate]);

  const handlePrevMonth = () => {
    setCurrentMonth(dayjs(currentMonth).subtract(1, 'month').format('YYYY-MM'));
  };

  const handleNextMonth = () => {
    setCurrentMonth(dayjs(currentMonth).add(1, 'month').format('YYYY-MM'));
  };

  const handleDateClick = (date: string, isDisabled: boolean) => {
    if (!isDisabled) {
      onSelectDate(date);
    }
  };

  return (
    <View className={styles.calendar}>
      <View className={styles.calendarHeader}>
        <View className={styles.navBtn} onClick={handlePrevMonth}>
          <Text className={styles.navIcon}>‹</Text>
        </View>
        <Text className={styles.monthText}>
          {dayjs(currentMonth).format('YYYY年MM月')}
        </Text>
        <View className={styles.navBtn} onClick={handleNextMonth}>
          <Text className={styles.navIcon}>›</Text>
        </View>
      </View>

      <View className={styles.weekHeader}>
        {weekDays.map((day, index) => (
          <Text
            key={index}
            className={classnames(styles.weekDay, {
              [styles.weekend]: index === 0 || index === 6
            })}
          >
            {day}
          </Text>
        ))}
      </View>

      <View className={styles.daysGrid}>
        {calendarDays.map((day, index) => {
          const dayNumber = dayjs(day.date).date();
          const isSelected = day.date === selectedDate;
          const isTodayDate = isToday(day.date);
          const isWeekend = dayjs(day.date).day() === 0 || dayjs(day.date).day() === 6;

          const dayClass = classnames(styles.dayCell, {
            [styles.currentMonth]: day.isCurrentMonth,
            [styles.otherMonth]: !day.isCurrentMonth,
            [styles.selected]: isSelected,
            [styles.today]: isTodayDate && !isSelected,
            [styles.disabled]: day.isDisabled,
            [styles.weekendDay]: isWeekend && !isSelected && !day.isDisabled
          });

          return (
            <View
              key={index}
              className={dayClass}
              onClick={() => handleDateClick(day.date, day.isDisabled)}
            >
              <Text className={styles.dayNumber}>{dayNumber}</Text>
              {isTodayDate && <View className={styles.todayDot} />}
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default Calendar;
