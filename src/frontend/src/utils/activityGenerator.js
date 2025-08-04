import { ActivityType } from './activityTypes';
import activityService from '../services/activityService';

// 活动生成器类
class ActivityGenerator {
  // 生成申请相关活动
  static generateApplicationActivity(type, application, user) {
    const activity = {
      type,
      user: user.nickname || user.username,
      userId: user.id,
      room: application.roomName,
      roomId: application.roomId,
      applicationId: application.id,
      description: application.reason || '申请使用教室'
    };

    return activityService.addActivity(activity);
  }

  // 生成教室相关活动
  static generateRoomActivity(type, room, user) {
    const activity = {
      type,
      user: user.nickname || user.username,
      userId: user.id,
      room: room.name,
      roomId: room.id,
      description: `教室: ${room.name}`
    };

    return activityService.addActivity(activity);
  }

  // 生成用户相关活动
  static generateUserActivity(type, user, details = {}) {
    const activity = {
      type,
      user: user.nickname || user.username,
      userId: user.id,
      description: details.description || '用户操作'
    };

    return activityService.addActivity(activity);
  }

  // 生成系统活动
  static generateSystemActivity(type, details = {}) {
    const activity = {
      type,
      user: '系统',
      userId: 0,
      description: details.description || '系统操作'
    };

    return activityService.addActivity(activity);
  }

  // 申请创建活动
  static applicationCreated(application, user) {
    return this.generateApplicationActivity(ActivityType.APPLICATION_CREATED, application, user);
  }

  // 申请获批活动
  static applicationApproved(application, user) {
    return this.generateApplicationActivity(ActivityType.APPLICATION_APPROVED, application, user);
  }

  // 申请被拒活动
  static applicationRejected(application, user) {
    return this.generateApplicationActivity(ActivityType.APPLICATION_REJECTED, application, user);
  }

  // 申请取消活动
  static applicationCancelled(application, user) {
    return this.generateApplicationActivity(ActivityType.APPLICATION_CANCELLED, application, user);
  }

  // 申请完成活动
  static applicationCompleted(application, user) {
    return this.generateApplicationActivity(ActivityType.APPLICATION_COMPLETED, application, user);
  }

  // 申请过期活动
  static applicationExpired(application, user) {
    return this.generateApplicationActivity(ActivityType.APPLICATION_EXPIRED, application, user);
  }

  // 教室创建活动
  static roomCreated(room, user) {
    return this.generateRoomActivity(ActivityType.ROOM_CREATED, room, user);
  }

  // 教室更新活动
  static roomUpdated(room, user) {
    return this.generateRoomActivity(ActivityType.ROOM_UPDATED, room, user);
  }

  // 教室删除活动
  static roomDeleted(room, user) {
    return this.generateRoomActivity(ActivityType.ROOM_DELETED, room, user);
  }

  // 教室状态变更活动
  static roomStatusChanged(room, user, oldStatus, newStatus) {
    const activity = {
      type: ActivityType.ROOM_STATUS_CHANGED,
      user: user.nickname || user.username,
      userId: user.id,
      room: room.name,
      roomId: room.id,
      description: `状态从 ${oldStatus} 变更为 ${newStatus}`
    };
    return activityService.addActivity(activity);
  }

  // 教室开始维修活动
  static roomMaintenanceStarted(room, user) {
    return this.generateRoomActivity(ActivityType.ROOM_MAINTENANCE_STARTED, room, user);
  }

  // 教室维修完成活动
  static roomMaintenanceCompleted(room, user) {
    return this.generateRoomActivity(ActivityType.ROOM_MAINTENANCE_COMPLETED, room, user);
  }

  // 教室开始清洁活动
  static roomCleaningStarted(room, user) {
    return this.generateRoomActivity(ActivityType.ROOM_CLEANING_STARTED, room, user);
  }

  // 教室清洁完成活动
  static roomCleaningCompleted(room, user) {
    return this.generateRoomActivity(ActivityType.ROOM_CLEANING_COMPLETED, room, user);
  }

  // 用户注册活动
  static userRegistered(user) {
    return this.generateUserActivity(ActivityType.USER_REGISTERED, user, {
      description: '新用户注册了账号'
    });
  }

  // 用户更新活动
  static userUpdated(user) {
    return this.generateUserActivity(ActivityType.USER_UPDATED, user, {
      description: '更新了个人信息'
    });
  }

  // 用户登录活动
  static userLogin(user) {
    return this.generateUserActivity(ActivityType.USER_LOGIN, user, {
      description: '用户登录了系统'
    });
  }

  // 系统维护活动
  static systemMaintenance(details = {}) {
    return this.generateSystemActivity(ActivityType.SYSTEM_MAINTENANCE, {
      description: details.description || '系统进行了维护'
    });
  }

  // 系统备份活动
  static systemBackup(details = {}) {
    return this.generateSystemActivity(ActivityType.SYSTEM_BACKUP, {
      description: details.description || '系统进行了备份'
    });
  }
}

export default ActivityGenerator; 