import request from '../api/index';
import { footprintAPI } from '../api/footprint';

class FootprintService {
  constructor() {
    this.currentUserId = null;
    this.currentUserRole = null;
  }

  setCurrentUser(userId, userRole) {
    this.currentUserId = userId;
    this.currentUserRole = userRole;
  }

  // 创建动态记录
  async createFootprint(footprintData) {
    try {
      const response = await footprintAPI.createFootprint(footprintData);
      return response.data;
    } catch (error) {
      console.error('创建动态失败:', error);
      throw error;
    }
  }

  // 获取用户相关的动态（包括操作记录和相关记录）
  async getUserFootprints(userId, type = 'operations', page = 0, size = 10) {
    try {
      const response = await footprintAPI.getUserFootprints(userId, {
        type, page, size
      });
      return response.data;
    } catch (error) {
      console.error('获取用户动态失败:', error);
      throw error;
    }
  }

  // 获取房间相关的动态
  async getRoomFootprints(roomId, type = 'direct', page = 0, size = 10) {
    try {
      const response = await request.get(`/api/footprints/room/${roomId}`, {
        params: { type, page, size }
      });
      return response.data;
    } catch (error) {
      console.error('获取房间动态失败:', error);
      throw error;
    }
  }

  // 获取申请相关的动态
  async getApplicationFootprints(applicationId, type = 'direct', page = 0, size = 10) {
    try {
      const response = await request.get(`/api/footprints/application/${applicationId}`, {
        params: { type, page, size }
      });
      return response.data;
    } catch (error) {
      console.error('获取申请动态失败:', error);
      throw error;
    }
  }

  // 获取所有动态（分页）
  async getAllFootprints(page = 0, size = 20) {
    try {
      const response = await footprintAPI.getAllFootprints({
        page, size
      });
      return response.data;
    } catch (error) {
      console.error('获取所有动态失败:', error);
      throw error;
    }
  }

  // 获取当前用户的动态
  async getMyFootprints(type = 'operations', page = 0, size = 10) {
    if (!this.currentUserId) {
      throw new Error('用户未登录');
    }
    return this.getUserFootprints(this.currentUserId, type, page, size);
  }

  // 批量创建动态记录
  async createBatchFootprints(footprintsData) {
    try {
      const response = await request.post('/api/footprints/batch', footprintsData);
      return response.data;
    } catch (error) {
      console.error('批量创建动态失败:', error);
      throw error;
    }
  }

  // 根据动态类型过滤可见性
  filterVisibleFootprints(footprints) {
    if (!Array.isArray(footprints)) return [];
    
    return footprints.filter(footprint => {
      if (!footprint.visible) return false;
      
      // 根据用户角色过滤
      switch (footprint.operator) {
        case 'admin':
          return this.currentUserRole === 'admin';
        case 'approver':
          return ['admin', 'approver'].includes(this.currentUserRole);
        case 'operator':
          return ['admin', 'approver', 'operator'].includes(this.currentUserRole);
        case 'none':
          return false;
        default:
          return true;
      }
    });
  }

  // 格式化动态显示
  formatFootprintForDisplay(footprint) {
    return {
      ...footprint,
      displayTime: this.formatTime(footprint.timestamp),
      actionDisplay: this.getActionDisplayName(footprint.action),
      typeInfo: this.parseActionType(footprint.action)
    };
  }

  // 解析操作类型
  parseActionType(action) {
    const parts = action.split(' ');
    return {
      category: parts[0] || 'unknown',
      operation: parts[1] || 'unknown',
      fullAction: action
    };
  }

  // 获取操作的中文显示名称
  getActionDisplayName(action) {
    const actionMap = {
      // 用户操作
      'user create': '创建用户',
      'user update': '更新用户',
      'user delete': '删除用户',
      'user password': '修改密码',

      // 申请操作
      'app submit': '提交申请',
      'app approve': '批准申请',
      'app reject': '驳回申请',
      'app cancel': '取消申请',
      'app close': '关闭申请',
      'app delete': '删除申请',
      'app checkin': '申请签到',

      // 房间操作
      'room create': '创建房间',
      'room update': '更新房间',
      'room delete': '删除房间',

      // 值班操作
      'duty assign': '安排值班',
      'duty create': '创建值班',
      'duty update': '更新值班',
      'duty delete': '删除值班',

      // 系统操作
      'system': '系统操作',
      'system upgrade': '系统升级'
    };

    return actionMap[action] || action;
  }

  // 格式化时间显示
  formatTime(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // 1分钟内
    if (diff < 60 * 1000) {
      return '刚刚';
    }
    
    // 1小时内
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      return `${minutes}分钟前`;
    }
    
    // 1天内
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `${hours}小时前`;
    }
    
    // 7天内
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      return `${days}天前`;
    }
    
    // 超过7天显示具体日期
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // 获取操作图标
  getActionIcon(action) {
    const iconMap = {
      'user create': '👤',
      'user update': '✏️',
      'user delete': '🗑️',
      'user password': '🔒',
      'app submit': '📝',
      'app approve': '✅',
      'app reject': '❌',
      'app cancel': '🚫',
      'app close': '🔒',
      'app delete': '🗑️',
      'app checkin': '📍',
      'room create': '🏠',
      'room update': '🔧',
      'room delete': '🗑️',
      'duty assign': '📅',
      'duty create': '➕',
      'duty update': '📝',
      'duty delete': '🗑️',
      'system': '⚙️',
      'system upgrade': '🆙'
    };
    
    return iconMap[action] || '📄';
  }
}

// 导出单例实例
export const footprintService = new FootprintService();
export default footprintService;

// 导出具体方法供直接使用
export const createFootprint = (data) => footprintService.createFootprint(data);
export const getUserFootprints = (userId, type, page, size) => footprintService.getUserFootprints(userId, type, page, size);
export const getAllFootprints = (page, size, filters) => footprintService.getAllFootprints(page, size, filters);
export const getVisibleFootprints = (userRole, page, size, filters) => footprintService.getVisibleFootprints(userRole, page, size, filters);
export const filterVisibleFootprints = (footprints, userRole) => footprintService.filterVisibleFootprints(footprints, userRole);
export const formatFootprintForDisplay = (footprint) => footprintService.formatFootprintForDisplay(footprint);
