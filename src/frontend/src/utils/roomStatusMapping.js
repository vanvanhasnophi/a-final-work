// 教室状态映射工具函数
export const getRoomStatusDisplayName = (status) => {
  const statusMapping = {
    'AVAILABLE': '空闲',
    'RESERVED': '已预约',
    'USING': '使用中',
    'MAINTENANCE': '维修中',
    'CLEANING': '清洁中',
    'PENDING_CLEANING': '待清洁',
    'PENDING_MAINTENANCE': '待维修',
    'UNAVAILABLE': '不可用'
  };
  return statusMapping[status] || status || '未知状态';
};

// 教室状态颜色映射
export const getRoomStatusColor = (status) => {
  const colorMapping = {
    'AVAILABLE': 'success',
    'RESERVED': 'processing',
    'USING': 'warning',
    'MAINTENANCE': 'error',
    'CLEANING': 'default',
    'PENDING_CLEANING': 'orange',
    'PENDING_MAINTENANCE': 'volcano',
    'UNAVAILABLE': 'default'
  };
  return colorMapping[status] || 'default';
};

// 教室状态图标映射（已弃用，保持兼容性）
export const getRoomStatusIcon = (status) => {
  return ''; // 不再使用图标
};

// 教室状态选项（用于表单）
export const roomStatusOptions = [
  { value: 'AVAILABLE', label: '空闲', color: 'success' },
  { value: 'RESERVED', label: '已预约', color: 'processing' },
  { value: 'USING', label: '使用中', color: 'warning' },
  { value: 'MAINTENANCE', label: '维修中', color: 'error' },
  { value: 'CLEANING', label: '清洁中', color: 'default' },
  { value: 'PENDING_CLEANING', label: '待清洁', color: 'orange' },
  { value: 'PENDING_MAINTENANCE', label: '待维修', color: 'volcano' },
  { value: 'UNAVAILABLE', label: '不可用', color: 'default' }
];

// 判断教室是否可用
export const isRoomAvailable = (status) => {
  return status === 'AVAILABLE';
};

// 判断教室是否可预约
export const isRoomReservable = (status) => {
  return status === 'AVAILABLE' || status === 'PENDING_CLEANING' || status === 'PENDING_MAINTENANCE';
};

// 判断教室是否需要维护
export const isRoomNeedsMaintenance = (status) => {
  return status === 'MAINTENANCE' || status === 'PENDING_MAINTENANCE';
};

// 判断教室是否需要清洁
export const isRoomNeedsCleaning = (status) => {
  return status === 'CLEANING' || status === 'PENDING_CLEANING';
}; 