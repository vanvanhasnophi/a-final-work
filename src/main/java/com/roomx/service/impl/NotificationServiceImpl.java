package com.roomx.service.impl;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.roomx.model.dto.NotificationDTO;
import com.roomx.model.dto.PageResult;
import com.roomx.model.entity.Notification;
import com.roomx.repository.NotificationRepository;
import com.roomx.service.NotificationService;

@Service
public class NotificationServiceImpl implements NotificationService {
    
    @Autowired
    private NotificationRepository notificationRepository;

    @Override
    public PageResult<NotificationDTO> getUserNotifications(Long userId, int pageNum, int pageSize) {
        Pageable pageable = PageRequest.of(pageNum - 1, pageSize);
        Page<Notification> page = notificationRepository.findByUserIdOrderByCreateTimeDesc(userId, pageable);
        
        PageResult<NotificationDTO> result = new PageResult<>();
        result.setRecords(page.getContent().stream()
                .map(NotificationDTO::fromEntity)
                .collect(Collectors.toList()));
        result.setTotal(page.getTotalElements());
        result.setPageNum(pageNum);
        result.setPageSize(pageSize);
        
        return result;
    }

    @Override
    public Long getUnreadCount(Long userId) {
        return notificationRepository.countUnreadByUserId(userId);
    }

    @Override
    public void markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("通知不存在"));
        
        // 验证通知是否属于该用户
        if (!notification.getUserId().equals(userId)) {
            throw new IllegalArgumentException("无权操作此通知");
        }
        
        notification.setIsRead(true);
        notification.setReadTime(new Date());
        notificationRepository.save(notification);
    }

    @Override
    public void markAllAsRead(Long userId) {
        List<Notification> unreadNotifications = notificationRepository.findByUserIdAndIsReadFalseOrderByCreateTimeDesc(userId);
        
        Date now = new Date();
        unreadNotifications.forEach(notification -> {
            notification.setIsRead(true);
            notification.setReadTime(now);
        });
        
        notificationRepository.saveAll(unreadNotifications);
    }

    @Override
    public void deleteNotification(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("通知不存在"));
        
        // 验证通知是否属于该用户
        if (!notification.getUserId().equals(userId)) {
            throw new IllegalArgumentException("无权操作此通知");
        }
        
        notificationRepository.delete(notification);
    }

    @Override
    public void createNotification(NotificationDTO notificationDTO) {
        Notification notification = new Notification();
        notification.setTitle(notificationDTO.getTitle());
        notification.setContent(notificationDTO.getContent());
        notification.setType(notificationDTO.getType());
        notification.setPriority(notificationDTO.getPriority());
        notification.setUserId(notificationDTO.getUserId());
        notification.setIsRead(false);
        notification.setCreateTime(new Date());
        notification.setActionType(notificationDTO.getActionType());
        notification.setActionTarget(notificationDTO.getActionTarget());
        notification.setRelatedId(notificationDTO.getRelatedId());
        notification.setRelatedType(notificationDTO.getRelatedType());
        
        notificationRepository.save(notification);
    }

    @Override
    public void createNotifications(Iterable<NotificationDTO> notificationDTOs) {
        List<Notification> notifications = new ArrayList<>();
        for (NotificationDTO dto : notificationDTOs) {
            Notification notification = new Notification();
            notification.setTitle(dto.getTitle());
            notification.setContent(dto.getContent());
            notification.setType(dto.getType());
            notification.setPriority(dto.getPriority());
            notification.setUserId(dto.getUserId());
            notification.setIsRead(false);
            notification.setCreateTime(new Date());
            notification.setActionType(dto.getActionType());
            notification.setActionTarget(dto.getActionTarget());
            notification.setRelatedId(dto.getRelatedId());
            notification.setRelatedType(dto.getRelatedType());
            notifications.add(notification);
        }
        
        notificationRepository.saveAll(notifications);
    }
} 