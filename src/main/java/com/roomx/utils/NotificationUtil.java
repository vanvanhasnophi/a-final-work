package com.roomx.utils;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.roomx.model.dto.NotificationDTO;
import com.roomx.service.NotificationService;

@Component
public class NotificationUtil {
    
    @Autowired
    private NotificationService notificationService;
    
    /**
     * 发送申请相关通知
     */
    public void sendApplicationNotification(Long userId, String title, String content, String priority) {
        NotificationDTO notification = new NotificationDTO();
        notification.setUserId(userId);
        notification.setTitle(title);
        notification.setContent(content);
        notification.setType("application");
        notification.setPriority(priority != null ? priority : "normal");
        
        notificationService.createNotification(notification);
    }
    
    /**
     * 发送房间相关通知
     */
    public void sendRoomNotification(Long userId, String title, String content, String priority) {
        NotificationDTO notification = new NotificationDTO();
        notification.setUserId(userId);
        notification.setTitle(title);
        notification.setContent(content);
        notification.setType("room");
        notification.setPriority(priority != null ? priority : "normal");
        
        notificationService.createNotification(notification);
    }
    
    /**
     * 发送系统通知
     */
    public void sendSystemNotification(Long userId, String title, String content, String priority) {
        NotificationDTO notification = new NotificationDTO();
        notification.setUserId(userId);
        notification.setTitle(title);
        notification.setContent(content);
        notification.setType("system");
        notification.setPriority(priority != null ? priority : "normal");
        
        notificationService.createNotification(notification);
    }
    
    /**
     * 发送用户相关通知
     */
    public void sendUserNotification(Long userId, String title, String content, String priority) {
        NotificationDTO notification = new NotificationDTO();
        notification.setUserId(userId);
        notification.setTitle(title);
        notification.setContent(content);
        notification.setType("user");
        notification.setPriority(priority != null ? priority : "normal");
        
        notificationService.createNotification(notification);
    }
    
    /**
     * 批量发送通知
     */
    public void sendBatchNotifications(List<NotificationDTO> notifications) {
        notificationService.createNotifications(notifications);
    }
    
    /**
     * 发送申请审批结果通知
     */
    public void sendApplicationApprovalNotification(Long userId, String applicationTitle, boolean approved, String reason) {
        String titleKey = approved ? "notification.application.approved.title" : "notification.application.rejected.title";
        String contentKey = approved ? "notification.application.approved.content" : "notification.application.rejected.content";
        
        // 创建包含参数的通知
        NotificationDTO notification = new NotificationDTO();
        notification.setUserId(userId);
        notification.setTitle(titleKey);
        notification.setContent(contentKey + "|" + applicationTitle + (reason != null ? "|" + reason : ""));
        notification.setType("application");
        notification.setPriority(approved ? "normal" : "high");
        
        notificationService.createNotification(notification);
    }
    
    /**
     * 发送房间状态变更通知
     */
    public void sendRoomStatusChangeNotification(Long userId, String roomName, String oldStatus, String newStatus) {
        NotificationDTO notification = new NotificationDTO();
        notification.setUserId(userId);
        notification.setTitle("notification.room.statusChange.title");
        notification.setContent("notification.room.statusChange.content|" + roomName + "|" + oldStatus + "|" + newStatus);
        notification.setType("room");
        notification.setPriority("normal");
        
        notificationService.createNotification(notification);
    }
    
    /**
     * 发送系统维护通知
     */
    public void sendSystemMaintenanceNotification(Long userId, String maintenanceInfo) {
        NotificationDTO notification = new NotificationDTO();
        notification.setUserId(userId);
        notification.setTitle("notification.system.maintenance.title");
        notification.setContent("notification.system.maintenance.content|" + maintenanceInfo);
        notification.setType("system");
        notification.setPriority("high");
        
        notificationService.createNotification(notification);
    }
} 