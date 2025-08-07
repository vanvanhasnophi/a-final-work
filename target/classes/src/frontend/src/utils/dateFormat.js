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
export const formatTimeRange = (startTime, endTime) => {
  if (!startTime || !endTime) return '';
  
  try {
    const start = dayjs(startTime);
    const end = dayjs(endTime);
    
    if (!start.isValid() || !end.isValid()) {
      return `${startTime} 至 ${endTime}`;
    }
    
    // 如果是同一天，只显示时间
    if (start.isSame(end, 'day')) {
      return `${start.format('MM-DD')} ${start.format('HH:mm')} - ${end.format('HH:mm')}`;
    }
    
    // 不同天，显示完整日期时间
    return `${start.format('MM-DD HH:mm')} - ${end.format('MM-DD HH:mm')}`;
  } catch (error) {
    console.error('时间段格式化错误:', error);
    return `${startTime} 至 ${endTime}`;
  }
}; 