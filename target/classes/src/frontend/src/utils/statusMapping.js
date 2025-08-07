// 申请状态中文映射工具函数
export const getApplicationStatusDisplayName = (status) => {
  const statusMapping = {
    'PENDING': '待审批',
    'APPROVED': '已批准',
    'REJECTED': '已驳回',
    'COMPLETED': '已完成',
    'CANCELLED': '已取消',
    'EXPIRED': '已过期'
  };
  return statusMapping[status] || status || '未知状态';
};

// 申请状态颜色映射工具函数
export const getApplicationStatusColor = (status) => {
  const colorMapping = {
    'PENDING': 'processing',    // 蓝色 - 处理中
    'APPROVED': 'success',      // 绿色 - 成功
    'REJECTED': 'error',        // 红色 - 错误
    'COMPLETED': 'default',     // 灰色 - 默认
    'CANCELLED': 'warning',     // 橙色 - 警告
    'EXPIRED': 'error'          // 红色 - 错误
  };
  return colorMapping[status] || 'default';
}; 