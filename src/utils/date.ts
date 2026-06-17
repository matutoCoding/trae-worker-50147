import dayjs from 'dayjs';

export const formatDate = (date: string | Date, format: string = 'YYYY-MM-DD'): string => {
  return dayjs(date).format(format);
};

export const formatDateTime = (date: string | Date, format: string = 'YYYY-MM-DD HH:mm:ss'): string => {
  return dayjs(date).format(format);
};

export const formatTime = (time: string, format: string = 'HH:mm'): string => {
  return dayjs(`2000-01-01 ${time}`).format(format);
};

export const getToday = (): string => {
  return dayjs().format('YYYY-MM-DD');
};

export const getDateList = (startDate: string, days: number): string[] => {
  const dates: string[] = [];
  const start = dayjs(startDate);
  for (let i = 0; i < days; i++) {
    dates.push(start.add(i, 'day').format('YYYY-MM-DD'));
  }
  return dates;
};

export const getWeekDays = (date: string): string[] => {
  const start = dayjs(date).startOf('week');
  return getDateList(start.format('YYYY-MM-DD'), 7);
};

export const getMonthDays = (year: number, month: number): string[] => {
  const start = dayjs(`${year}-${String(month).padStart(2, '0')}-01`);
  const daysInMonth = start.daysInMonth();
  return getDateList(start.format('YYYY-MM-DD'), daysInMonth);
};

export const isToday = (date: string): boolean => {
  return dayjs(date).isSame(dayjs(), 'day');
};

export const isPast = (date: string): boolean => {
  return dayjs(date).isBefore(dayjs(), 'day');
};

export const isFuture = (date: string): boolean => {
  return dayjs(date).isAfter(dayjs(), 'day');
};

export const getDayOfWeek = (date: string): string => {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return days[dayjs(date).day()];
};

export const getShortDayOfWeek = (date: string): string => {
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  return days[dayjs(date).day()];
};

export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

export const getDuration = (startTime: string, endTime: string): number => {
  return timeToMinutes(endTime) - timeToMinutes(startTime);
};

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) {
    return `${hours}小时${mins}分钟`;
  } else if (hours > 0) {
    return `${hours}小时`;
  } else {
    return `${mins}分钟`;
  }
};
