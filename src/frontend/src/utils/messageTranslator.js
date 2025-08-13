/**
 * 消息转换工具
 * 将后端传来的英文消息转换成中文
 */

// 错误消息映射表
const ERROR_MESSAGE_MAP = {
  // 认证相关错误
  'Invalid username or password': '用户名或密码错误',
  'Username already exists': '用户名已存在',
  'User not found': '用户不存在',
  'Token expired': '登录已过期',
  'Invalid token': '无效的登录状态',
  'Session expired': 'session已过期',
  'Session invalid': 'session无效',
  'User logged in elsewhere': '账号在其他地方登录',
  'Session kicked out': '登录已被挤下线',
  
  // 权限相关错误
  'Access denied': '拒绝访问',
  'Insufficient permissions': '权限不足',
  'Unauthorized access': '未授权的访问',
  'Forbidden': '禁止访问',
  
  // 数据操作错误
  'Data not found': '数据不存在',
  'Record not found': '记录不存在',
  'Application not found': '申请记录不存在',
  'Room not found': '教室不存在',
  'User not found': '用户不存在',
  'Operation failed': '操作失败',
  'Save failed': '保存失败',
  'Update failed': '更新失败',
  'Delete failed': '删除失败',
  'Create failed': '创建失败',
  
  // 业务逻辑错误
  'Invalid application status': '申请状态无效',
  'Application already approved': '申请已批准',
  'Application already rejected': '申请已驳回',
  'Room is not available': '教室不可用',
  'Time conflict': '时间冲突',
  'Room is occupied': '教室已被占用',
  'Invalid time range': '时间范围无效',
  'Start time must be before end time': '开始时间必须早于结束时间',
  'Date cannot be in the past': '日期不能是过去的时间',
  
  // 网络和系统错误
  'Network error': '网络错误',
  'Server error': '服务器错误',
  'Internal server error': '服务器内部错误',
  'Service unavailable': '服务不可用',
  'Request timeout': '请求超时',
  'Connection failed': '连接失败',
  'Database error': '数据库错误',
  'System error': '系统错误',
  
  // 数据验证错误
  'Invalid input': '输入不正确',
  'Required field missing': '必填字段缺失',
  'Invalid format': '格式不正确',
  'Invalid email format': '邮箱格式不正确',
  'Invalid phone format': '电话号码格式不正确',
  'Password too short': '密码长度不足',
  'Password too weak': '密码强度不足',
  'Username too short': '用户名长度不足',
  'Username contains invalid characters': '用户名包含非法字符',
  
  // 并发和冲突错误
  'Concurrent modification': '并发修改冲突',
  'Data conflict': '数据冲突',
  'Optimistic lock failed': '乐观锁失败',
  'Version conflict': '版本冲突',
  
  // 文件相关错误
  'File not found': '文件不存在',
  'File too large': '文件过大',
  'Invalid file type': '文件类型不支持',
  'Upload failed': '上传失败',
  'Download failed': '下载失败',
  
  // 通用错误
  'Unknown error': '未知错误',
  'Error occurred': '发生错误',
  'Something went wrong': '出现问题',
  'Please try again': '请重试',
  'Please check your input': '请检查输入',
  'Operation not allowed': '操作不允许',
  'Resource not available': '资源不可用',
  'Service temporarily unavailable': '服务暂时不可用',
  
  // 成功消息
  'Success': '操作成功',
  'Created successfully': '创建成功',
  'Updated successfully': '更新成功',
  'Deleted successfully': '删除成功',
  'Saved successfully': '保存成功',
  'Login successful': '登录成功',
  'Logout successful': '登出成功',
  'Registration successful': '注册成功',
  'Password changed successfully': '密码修改成功',
  'Application submitted successfully': '申请提交成功',
  'Application approved successfully': '申请批准成功',
  'Application rejected successfully': '申请驳回成功',
};

// 消息类型映射
const MESSAGE_TYPE_MAP = {
  'error': 'error',
  'success': 'success',
  'warning': 'warning',
  'info': 'info',
};

/**
 * 转换消息内容
 * @param {string} message - 原始消息
 * @param {string} defaultMessage - 默认消息（如果找不到映射）
 * @returns {string} 转换后的中文消息
 */
export function translateMessage(message, defaultMessage = null) {
  if (!message) {
    return defaultMessage || '未知错误';
  }
  
  // 如果message不是字符串，尝试提取字符串信息
  let messageStr = message;
  if (typeof message === 'object') {
    if (message.error) {
      messageStr = message.error;
    } else if (message.message) {
      messageStr = message.message;
    } else {
      messageStr = JSON.stringify(message);
    }
  } else if (typeof message !== 'string') {
    messageStr = String(message);
  }
  
  // 直接匹配
  if (ERROR_MESSAGE_MAP[messageStr]) {
    return ERROR_MESSAGE_MAP[messageStr];
  }
  
  // 模糊匹配（包含关键词）
  for (const [key, value] of Object.entries(ERROR_MESSAGE_MAP)) {
    if (messageStr.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  
  // 如果都没有匹配到，返回默认消息或原始消息
  return defaultMessage || messageStr;
}

/**
 * 转换错误响应
 * @param {Object} error - 错误对象
 * @param {string} defaultMessage - 默认消息
 * @returns {Object} 转换后的错误对象
 */
export function translateErrorResponse(error, defaultMessage = null) {
  if (!error) {
    return { message: defaultMessage || '未知错误' };
  }
  
  let message = '';
  
  // 处理不同类型的错误响应
  if (typeof error === 'string') {
    message = translateMessage(error, defaultMessage);
  } else if (error.message) {
    message = translateMessage(error.message, defaultMessage);
  } else if (error.error) {
    message = translateMessage(error.error, defaultMessage);
  } else if (error.data) {
    if (typeof error.data === 'string') {
      message = translateMessage(error.data, defaultMessage);
    } else if (error.data.message) {
      message = translateMessage(error.data.message, defaultMessage);
    } else if (error.data.error) {
      message = translateMessage(error.data.error, defaultMessage);
    } else {
      message = defaultMessage || '请求失败';
    }
  } else {
    message = defaultMessage || '未知错误';
  }
  
  return {
    ...error,
    message,
    originalMessage: error.message || error.error || error.data
  };
}

/**
 * 显示转换后的消息
 * @param {Object} messageApi - Ant Design message API
 * @param {string} type - 消息类型 ('success', 'error', 'warning', 'info')
 * @param {string} originalMessage - 原始消息
 * @param {string} defaultMessage - 默认消息
 * @param {Object} options - 其他选项
 */
export function showTranslatedMessage(messageApi, type, originalMessage, defaultMessage = null, options = {}) {
  const translatedMessage = translateMessage(originalMessage, defaultMessage);
  
  messageApi.open({
    type: MESSAGE_TYPE_MAP[type] || type,
    content: translatedMessage,
    duration: options.duration || 3,
    ...options
  });
}

/**
 * 批量转换消息
 * @param {Array} messages - 消息数组
 * @returns {Array} 转换后的消息数组
 */
export function translateMessages(messages) {
  return messages.map(msg => ({
    ...msg,
    content: translateMessage(msg.content, msg.defaultMessage)
  }));
}

export default {
  translateMessage,
  translateErrorResponse,
  showTranslatedMessage,
  translateMessages
}; 