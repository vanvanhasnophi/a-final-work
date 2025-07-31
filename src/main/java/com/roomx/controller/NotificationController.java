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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.roomx.annotation.RequireAuth;
import com.roomx.model.dto.NotificationDTO;
import com.roomx.model.dto.PageResult;
import com.roomx.service.NotificationService;
import com.roomx.service.UserService;

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

    // 获取当前用户的未读通知数量
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount() {
        Long userId = getCurrentUserId();
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

    // 标记所有通知为已读
    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead() {
        Long userId = getCurrentUserId();
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok().build();
    }

    // 删除通知
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        notificationService.deleteNotification(id, userId);
        return ResponseEntity.ok().build();
    }

    // 获取当前用户ID
    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = (String) auth.getPrincipal();
        return userService.getUserInfoByUsername(username).getId();
    }
} 