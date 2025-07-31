package com.roomx.service;

import com.roomx.model.dto.NotificationDTO;
import com.roomx.model.dto.PageResult;

public interface NotificationService {
    // 获取用户通知列表
    PageResult<NotificationDTO> getUserNotifications(Long userId, int pageNum, int pageSize);
    
    // 获取用户未读通知数量
    Long getUnreadCount(Long userId);
    
    // 标记通知为已读
    void markAsRead(Long notificationId, Long userId);
    
    // 标记用户所有通知为已读
    void markAllAsRead(Long userId);
    
    // 删除通知
    void deleteNotification(Long notificationId, Long userId);
    
    // 创建通知
    void createNotification(NotificationDTO notificationDTO);
    
    // 批量创建通知
    void createNotifications(Iterable<NotificationDTO> notificationDTOs);
} 