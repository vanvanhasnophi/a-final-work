import dayjs from 'dayjs';

// 格式化日期时间显示
export const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return '';
  
  try {
    const date = dayjs(dateTimeString);
    if (!date.isValid()) return dateTimeString;
    
    return date.format('YYYY-MM-DD HH:mm');
  } catch (error) {
    console.error('日期格式化错误:', error);
    return dateTimeString;
  }
};

// 格式化日期显示
export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = dayjs(dateString);
    if (!date.isValid()) return dateString;
    
    return date.format('YYYY-MM-DD');
  } catch (error) {
    console.error('日期格式化错误:', error);
    return dateString;
  }
};

// 格式化时间显示
export const formatTime = (timeString) => {
  if (!timeString) return '';
  
  try {
    const time = dayjs(timeString);
    if (!time.isValid()) return timeString;
    
    return time.format('HH:mm');
  } catch (error) {
    console.error('时间格式化错误:', error);
    return timeString;
  }
};

// 格式化相对时间（如：3小时前、2天前等）
export const formatRelativeTime = (dateTimeString) => {
  if (!dateTimeString) return '';
  
  try {
    const date = dayjs(dateTimeString);
    if (!date.isValid()) return dateTimeString;
    
    const now = dayjs();
    const diffInMinutes = now.diff(date, 'minute');
    
    if (diffInMinutes < 1) return '刚刚';
    if (diffInMinutes < 60) return `${diffInMinutes}分钟前`;
    
    const diffInHours = now.diff(date, 'hour');
    if (diffInHours < 24) return `${diffInHours}小时前`;
    
    const diffInDays = now.diff(date, 'day');
    if (diffInDays < 7) return `${diffInDays}天前`;
    
    return date.format('MM-DD HH:mm');
  } catch (error) {
    console.error('相对时间格式化错误:', error);
    return dateTimeString;
  }
};

// 格式化时间段显示
export const formatTimeRange = (startTime, endTime, options = {}) => {
  if (!startTime || !endTime) return '';
  const { structured = false } = options;

  try {
    const start = dayjs(startTime);
    const end = dayjs(endTime);

    if (!start.isValid() || !end.isValid()) {
      const text = `${startTime} 至 ${endTime}`;
      return structured ? { text, crossDay: false, startRaw: startTime, endRaw: endTime } : text;
    }

    const sameDay = start.isSame(end, 'day');

    if (sameDay) {
      const text = `${start.format('MM-DD')} ${start.format('HH:mm')} - ${end.format('HH:mm')}`;
      return structured ? { text, crossDay: false, startFormatted: start.format('MM-DD HH:mm'), endFormatted: end.format('HH:mm'), start, end } : text;
    }

    // 跨日：需要在 UI 层换行，仍返回结构化信息
    const startStr = start.format('MM-DD HH:mm');
    const endStr = end.format('MM-DD HH:mm');
    const text = `${startStr} - ${endStr}`;
    return structured ? { text, crossDay: true, startFormatted: startStr, endFormatted: endStr, start, end } : text;
  } catch (error) {
    console.error('时间段格式化错误:', error);
    const text = `${startTime} 至 ${endTime}`;
    return structured ? { text, crossDay: false, startRaw: startTime, endRaw: endTime } : text;
  }
};