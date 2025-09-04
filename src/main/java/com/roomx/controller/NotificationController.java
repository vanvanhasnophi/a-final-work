package com.roomx.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.roomx.annotation.RequireAuth;
import com.roomx.constant.enums.UserRole;
import com.roomx.model.dto.NotificationDTO;
import com.roomx.model.dto.PageResult;
import com.roomx.model.dto.UserInfoDTO;
import com.roomx.service.NotificationService;
import com.roomx.service.UserService;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/notifications")
@RequireAuth
public class NotificationController {
    
    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private UserService userService;

    // 获取当前用户的通知列表
    @GetMapping
    public ResponseEntity<PageResult<NotificationDTO>> getNotifications(
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "20") int pageSize) {
        
        Long userId = getCurrentUserId();
        PageResult<NotificationDTO> result = notificationService.getUserNotifications(userId, pageNum, pageSize);
        return ResponseEntity.ok(result);
    }

    // 获取指定用户的通知列表
    @GetMapping("/user/{userId}")
    public ResponseEntity<PageResult<NotificationDTO>> getNotificationsByUser(@PathVariable Long userId,
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "20") int pageSize) {
        PageResult<NotificationDTO> result = notificationService.getUserNotifications(userId, pageNum, pageSize);
        return ResponseEntity.ok(result);
    }

    // 获取当前用户的未读通知数量
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount() {
        Long userId = getCurrentUserId();
        Long count = notificationService.getUnreadCount(userId);
        Map<String, Long> result = new HashMap<>();
        result.put("unreadCount", count);
        return ResponseEntity.ok(result);
    }

    // 获取指定用户未读通知数
    @GetMapping("/user/{userId}/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCountByUser(@PathVariable Long userId) {
        Long count = notificationService.getUnreadCount(userId);
        Map<String, Long> result = new HashMap<>();
        result.put("unreadCount", count);
        return ResponseEntity.ok(result);
    }

    // 标记通知为已读
    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        notificationService.markAsRead(id, userId);
        return ResponseEntity.ok().build();
    }

    // 标记指定用户所有通知为已读
    @PostMapping("/user/{userId}/read-all")
    public ResponseEntity<Void> markAllAsReadByUser(@PathVariable Long userId) {
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok().build();
    }

    // 删除通知
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long id) {
        String threadName = Thread.currentThread().getName();
        log.info("=== 开始处理删除通知请求 === notificationId={}, thread={}", id, threadName);
        
        try {
            Long userId = getCurrentUserId();
            log.info("=== 调用Service删除通知 === notificationId={}, userId={}, thread={}", id, userId, threadName);
            notificationService.deleteNotification(id, userId);
            log.info("=== 删除通知成功 === notificationId={}, thread={}", id, threadName);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("=== 删除通知失败 === notificationId={}, thread={}, error={}", id, threadName, e.getMessage(), e);
            throw e; // 重新抛出异常让全局异常处理器处理
        }
    }

    // 删除指定用户所有通知
    @DeleteMapping("/user/{userId}")
    public ResponseEntity<Void> deleteAllByUser(@PathVariable Long userId) {
        notificationService.deleteAllByUserId(userId);
        return ResponseEntity.ok().build();
    }

    // 获取指定用户通知统计
    @GetMapping("/user/{userId}/stats")
    public ResponseEntity<Map<String, Object>> getStatsByUser(@PathVariable Long userId) {
        // TODO: 实现统计逻辑
        Map<String, Object> stats = new HashMap<>();
        stats.put("total", notificationService.getUserNotifications(userId, 1, 1).getTotal());
        stats.put("unread", notificationService.getUnreadCount(userId));
        return ResponseEntity.ok(stats);
    }

    // 管理员发送测试通知给自己
    @PostMapping("/admin/send-test-notification")
    @RequireAuth(roles = {UserRole.ADMIN})
    public ResponseEntity<Map<String, String>> sendTestNotificationToSelf() {
        String threadName = Thread.currentThread().getName();
        log.info("=== Admin发送测试通知接口调用 === thread={}", threadName);
        
        try {
            Long adminUserId = getCurrentUserId();
            log.info("=== Admin用户ID: {} === thread={}", adminUserId, threadName);
            
            // 发送测试通知
            notificationService.sendTestNotificationToAdmin(adminUserId);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "测试通知发送成功");
            response.put("status", "success");
            
            log.info("=== Admin测试通知发送成功 === userId={}, thread={}", adminUserId, threadName);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("=== Admin发送测试通知失败 === thread={}, error={}", threadName, e.getMessage(), e);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "发送测试通知失败: " + e.getMessage());
            response.put("status", "error");
            
            return ResponseEntity.badRequest().body(response);
        }
    }

    private Long getCurrentUserId() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || auth.getPrincipal() == null) {
                throw new IllegalStateException("用户未认证");
            }
            
            Object principal = auth.getPrincipal();
            String username;
            
            // 安全地获取用户名
            if (principal instanceof String) {
                username = (String) principal;
            } else {
                // 如果是其他类型，尝试调用toString()或其他方法
                username = principal.toString();
                log.warn("认证主体不是String类型: {}, 使用toString(): {}", principal.getClass().getName(), username);
            }
            
            UserInfoDTO userInfo = userService.getUserInfoByUsername(username);
            if (userInfo == null) {
                throw new IllegalArgumentException("用户不存在: " + username);
            }
            
            return userInfo.getId();
        } catch (Exception e) {
            log.error("获取当前用户ID失败: {}", e.getMessage(), e);
            throw new IllegalStateException("获取用户信息失败", e);
        }
    }
}