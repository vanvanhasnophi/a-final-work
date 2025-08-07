// 审批权限中文映射工具函数
export const getPermissionDisplayName = (permission) => {
  const permissionMapping = {
    'READ_ONLY': '只读',
    'RESTRICTED': '受限',
    'NORMAL': '正常',
    'EXTENDED': '扩展'
  };
  return permissionMapping[permission] || permission || '未设置';
}; 