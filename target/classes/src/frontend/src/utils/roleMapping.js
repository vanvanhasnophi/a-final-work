// 用户角色中文映射工具函数
export const getRoleDisplayName = (role) => {
  const roleMapping = {
    'APPLIER': '申请人',
    'APPROVER': '审批人',
    'ADMIN': '管理员',
    'SERVICE': '服务人员',
    'MAINTAINER': '维护人员'
  };
  return roleMapping[role] || role || '普通用户';
}; 