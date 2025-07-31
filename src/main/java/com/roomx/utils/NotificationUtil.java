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
        String title = approved ? "申请已批准" : "申请已拒绝";
        String content = String.format("您的申请「%s」%s。%s", 
            applicationTitle, 
            approved ? "已获得批准" : "被拒绝", 
            reason != null ? "原因：" + reason : "");
        
        sendApplicationNotification(userId, title, content, approved ? "normal" : "high");
    }
    
    /**
     * 发送房间状态变更通知
     */
    public void sendRoomStatusChangeNotification(Long userId, String roomName, String oldStatus, String newStatus) {
        String title = "房间状态变更";
        String content = String.format("房间「%s」状态从「%s」变更为「%s」", roomName, oldStatus, newStatus);
        
        sendRoomNotification(userId, title, content, "normal");
    }
    
    /**
     * 发送系统维护通知
     */
    public void sendSystemMaintenanceNotification(Long userId, String maintenanceInfo) {
        String title = "系统维护通知";
        String content = "系统将进行维护：" + maintenanceInfo;
        
        sendSystemNotification(userId, title, content, "high");
    }
} 