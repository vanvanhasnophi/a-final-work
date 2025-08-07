package com.roomx.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.roomx.annotation.RequireAuth;
import com.roomx.constant.enums.UserRole;
import com.roomx.service.DataRefreshService;
import com.roomx.service.impl.DataRefreshServiceImpl;

@RestController
@RequestMapping("/api/cache")
@RequireAuth(roles = {UserRole.ADMIN})
public class CacheController {
    
    @Autowired
    private DataRefreshService dataRefreshService;
    
    @Autowired
    private DataRefreshServiceImpl dataRefreshServiceImpl;
    
    /**
     * 获取缓存状态信息
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getCacheStatus() {
        Map<String, Object> status = new HashMap<>();
        
        long lastRefreshTime = dataRefreshServiceImpl.getLastRefreshTime();
        status.put("lastRefreshTime", lastRefreshTime);
        status.put("lastRefreshTimeFormatted", new java.util.Date(lastRefreshTime));
        status.put("cacheAge", System.currentTimeMillis() - lastRefreshTime);
        
        // 获取缓存数据统计
        @SuppressWarnings("unchecked")
        java.util.concurrent.ConcurrentHashMap<String, Long> stats = 
            dataRefreshServiceImpl.getCachedData("stats", java.util.concurrent.ConcurrentHashMap.class);
        
        if (stats != null) {
            status.put("userCount", stats.get("userCount"));
            status.put("roomCount", stats.get("roomCount"));
            status.put("applicationCount", stats.get("applicationCount"));
            status.put("pendingApplicationCount", stats.get("pendingApplicationCount"));
        }
        
        return ResponseEntity.ok(status);
    }
    
    /**
     * 手动刷新用户缓存
     */
    @PostMapping("/refresh/users")
    public ResponseEntity<Map<String, String>> refreshUserCache() {
        dataRefreshService.refreshUserCache();
        Map<String, String> response = new HashMap<>();
        response.put("message", "用户缓存刷新成功");
        response.put("timestamp", new java.util.Date().toString());
        return ResponseEntity.ok(response);
    }
    
    /**
     * 手动刷新教室缓存
     */
    @PostMapping("/refresh/rooms")
    public ResponseEntity<Map<String, String>> refreshRoomCache() {
        dataRefreshService.refreshRoomCache();
        Map<String, String> response = new HashMap<>();
        response.put("message", "教室缓存刷新成功");
        response.put("timestamp", new java.util.Date().toString());
        return ResponseEntity.ok(response);
    }
    
    /**
     * 手动刷新申请缓存
     */
    @PostMapping("/refresh/applications")
    public ResponseEntity<Map<String, String>> refreshApplicationCache() {
        dataRefreshService.refreshApplicationCache();
        Map<String, String> response = new HashMap<>();
        response.put("message", "申请缓存刷新成功");
        response.put("timestamp", new java.util.Date().toString());
        return ResponseEntity.ok(response);
    }
    
    /**
     * 手动刷新所有缓存
     */
    @PostMapping("/refresh/all")
    public ResponseEntity<Map<String, String>> refreshAllCache() {
        dataRefreshService.refreshAllCache();
        Map<String, String> response = new HashMap<>();
        response.put("message", "所有缓存刷新成功");
        response.put("timestamp", new java.util.Date().toString());
        return ResponseEntity.ok(response);
    }
    
    /**
     * 清理过期数据
     */
    @PostMapping("/cleanup")
    public ResponseEntity<Map<String, String>> cleanupExpiredData() {
        dataRefreshService.cleanupExpiredData();
        Map<String, String> response = new HashMap<>();
        response.put("message", "过期数据清理成功");
        response.put("timestamp", new java.util.Date().toString());
        return ResponseEntity.ok(response);
    }
    
    /**
     * 清除所有缓存
     */
    @PostMapping("/clear")
    public ResponseEntity<Map<String, String>> clearCache() {
        dataRefreshServiceImpl.clearCache();
        Map<String, String> response = new HashMap<>();
        response.put("message", "所有缓存已清除");
        response.put("timestamp", new java.util.Date().toString());
        return ResponseEntity.ok(response);
    }
} 