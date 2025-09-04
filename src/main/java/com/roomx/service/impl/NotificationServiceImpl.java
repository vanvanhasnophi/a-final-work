package com.roomx.service.impl;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.roomx.model.dto.NotificationDTO;
import com.roomx.model.dto.PageResult;
import com.roomx.model.entity.Notification;
import com.roomx.repository.NotificationRepository;
import com.roomx.service.NotificationService;
import com.roomx.websocket.NotificationWebSocketHandler;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class NotificationServiceImpl implements NotificationService {
    
    @Autowired
    private NotificationRepository notificationRepository;
    
    @Autowired
    private NotificationWebSocketHandler webSocketHandler;

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
    @Transactional
    public void deleteNotification(Long notificationId, Long userId) {
        String threadName = Thread.currentThread().getName();
        log.info("=== Service层开始删除通知 === notificationId={}, userId={}, thread={}", notificationId, userId, threadName);
        
        try {
            // 使用删除操作，如果记录不存在会返回0，如果删除成功会返回1
            log.info("=== 执行数据库删除操作 === notificationId={}, userId={}, thread={}", notificationId, userId, threadName);
            int deletedCount = notificationRepository.deleteByIdAndUserId(notificationId, userId);
            log.info("=== 数据库删除操作完成 === notificationId={}, deletedCount={}, thread={}", notificationId, deletedCount, threadName);
            
            if (deletedCount == 0) {
                // 再次检查是否是权限问题还是记录不存在
                log.info("=== 删除计数为0，检查通知是否存在 === notificationId={}, thread={}", notificationId, threadName);
                Optional<Notification> notificationOpt = notificationRepository.findById(notificationId);
                if (notificationOpt.isEmpty()) {
                    log.info("=== 重复删除请求，通知已被其他请求删除 === notificationId={}, thread={}", notificationId, threadName);
                    // 当作重复请求处理，返回成功但状态不同，不抛异常
                    return; 
                } else {
                    log.warn("=== 用户无权删除通知 === notificationId={}, notificationUserId={}, requestUserId={}, thread={}", 
                            notificationId, notificationOpt.get().getUserId(), userId, threadName);
                    throw new IllegalArgumentException("无权操作此通知");
                }
            }
            
            log.info("=== Service层删除通知成功 === notificationId={}, deletedCount={}, thread={}", notificationId, deletedCount, threadName);
            
        } catch (IllegalArgumentException e) {
            log.error("=== Service层删除通知业务异常 === notificationId={}, thread={}, error={}", notificationId, threadName, e.getMessage());
            throw e; // 重新抛出业务异常
        } catch (Exception e) {
            log.error("=== Service层删除通知系统异常 === notificationId={}, thread={}, error={}", notificationId, threadName, e.getMessage(), e);
            // 检查通知是否已经被删除（处理并发删除情况）
            if (!notificationRepository.existsById(notificationId)) {
                log.info("=== 通知已经被删除，忽略错误 === notificationId={}, thread={}", notificationId, threadName);
                return; // 静默处理，因为通知已经不存在了
            }
            throw e;
        }
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
        
        // 保存通知
        Notification savedNotification = notificationRepository.save(notification);
        
        // 立即通过WebSocket推送通知给用户
        try {
            NotificationDTO savedDTO = NotificationDTO.fromEntity(savedNotification);
            webSocketHandler.sendNotificationToUser(notificationDTO.getUserId(), savedDTO);
            log.info("通知已推送给用户: userId={}, notificationId={}, title={}", 
                    notificationDTO.getUserId(), savedNotification.getId(), savedNotification.getTitle());
        } catch (Exception e) {
            log.warn("WebSocket推送通知失败: userId={}, notificationId={}, error={}", 
                    notificationDTO.getUserId(), savedNotification.getId(), e.getMessage());
        }
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
        
        // 批量保存
        List<Notification> savedNotifications = notificationRepository.saveAll(notifications);
        
        // 为每个用户推送通知
        for (Notification savedNotification : savedNotifications) {
            try {
                NotificationDTO savedDTO = NotificationDTO.fromEntity(savedNotification);
                webSocketHandler.sendNotificationToUser(savedNotification.getUserId(), savedDTO);
                log.info("批量通知已推送给用户: userId={}, notificationId={}, title={}", 
                        savedNotification.getUserId(), savedNotification.getId(), savedNotification.getTitle());
            } catch (Exception e) {
                log.warn("WebSocket批量推送通知失败: userId={}, notificationId={}, error={}", 
                        savedNotification.getUserId(), savedNotification.getId(), e.getMessage());
            }
        }
    }
    
    @Override
    @Transactional
    public void sendTestNotificationToAdmin(Long adminUserId) {
        String threadName = Thread.currentThread().getName();
        log.info("=== 开始为Admin创建测试通知 === adminUserId={}, thread={}", adminUserId, threadName);
        
        try {
            // 创建测试通知
            NotificationDTO testNotification = new NotificationDTO();
            testNotification.setUserId(adminUserId);
            testNotification.setTitle("系统测试通知");
            testNotification.setContent("这是管理员触发的测试通知，用于验证通知系统功能。发送时间：" + new Date());
            testNotification.setType("SYSTEM");
            testNotification.setPriority("NORMAL");
            testNotification.setActionType("VIEW");
            testNotification.setActionTarget("NOTIFICATION_CENTER");
            testNotification.setRelatedType("SYSTEM_TEST");
            testNotification.setRelatedId(adminUserId);
            
            // 创建通知
            createNotification(testNotification);
            
            log.info("=== Admin测试通知创建成功 === adminUserId={}, title={}, thread={}", 
                    adminUserId, testNotification.getTitle(), threadName);
                    
        } catch (Exception e) {
            log.error("=== Admin测试通知创建失败 === adminUserId={}, thread={}, error={}", 
                    adminUserId, threadName, e.getMessage(), e);
            throw new RuntimeException("创建测试通知失败: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public void deleteAllByUserId(Long userId) {
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreateTimeDesc(userId, PageRequest.of(0, Integer.MAX_VALUE)).getContent();
        notificationRepository.deleteAll(notifications);
    }
}
