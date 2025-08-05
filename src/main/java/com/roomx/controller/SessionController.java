package com.roomx.controller;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.roomx.service.SessionMonitorService;
import com.roomx.service.SessionMonitorService.SessionInfo;

@RestController
@RequestMapping("/api/admin/sessions")
public class SessionController {
    
    private final SessionMonitorService sessionMonitorService;
    
    public SessionController(SessionMonitorService sessionMonitorService) {
        this.sessionMonitorService = sessionMonitorService;
    }
    
    /**
     * 获取所有活跃会话
     */
    @GetMapping
    public ResponseEntity<List<SessionInfo>> getAllActiveSessions() {
        Map<String, SessionInfo> sessions = sessionMonitorService.getAllActiveSessions();
        List<SessionInfo> sessionList = sessions.values().stream()
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(sessionList);
    }
    
    /**
     * 获取指定用户的会话信息
     */
    @GetMapping("/{username}")
    public ResponseEntity<SessionInfo> getUserSession(@PathVariable String username) {
        SessionInfo sessionInfo = sessionMonitorService.getUserSession(username);
        if (sessionInfo != null) {
            return ResponseEntity.ok(sessionInfo);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * 强制用户下线
     */
    @DeleteMapping("/{username}")
    public ResponseEntity<String> forceLogout(@PathVariable String username) {
        boolean success = sessionMonitorService.forceLogout(username);
        if (success) {
            return ResponseEntity.ok("用户 " + username + " 已被强制下线");
        } else {
            return ResponseEntity.badRequest().body("强制下线失败");
        }
    }
    
    /**
     * 清理过期会话
     */
    @DeleteMapping("/cleanup")
    public ResponseEntity<String> cleanupExpiredSessions() {
        int cleanedCount = sessionMonitorService.cleanupExpiredSessions();
        return ResponseEntity.ok("清理了 " + cleanedCount + " 个过期会话");
    }
} 