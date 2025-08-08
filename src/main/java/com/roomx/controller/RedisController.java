package com.roomx.controller;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.cache.CacheManager;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.roomx.annotation.RequireAuth;
import com.roomx.constant.enums.UserRole;
import com.roomx.service.RedisService;

/**
 * Redis 管理控制器
 * 提供Redis缓存的监控和管理功能
 */
@RestController
@RequestMapping("/api/redis")
@RequireAuth(roles = {UserRole.ADMIN})
@ConditionalOnBean(RedisService.class)
@ConditionalOnProperty(name = "redis.enabled", havingValue = "true")
public class RedisController {

    @Autowired(required = false)
    private RedisService redisService;

    @Autowired
    private CacheManager cacheManager;

    /**
     * 获取Redis连接状态
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getRedisStatus() {
        Map<String, Object> status = new HashMap<>();
        
        try {
            // 测试Redis连接
            String testKey = "health:check:" + System.currentTimeMillis();
            redisService.set(testKey, "ok", 10, TimeUnit.SECONDS);
            String result = redisService.get(testKey, String.class);
            redisService.delete(testKey);
            
            status.put("connected", "ok".equals(result));
            status.put("message", "Redis连接正常");
            status.put("cacheManager", cacheManager.getClass().getSimpleName());
            
        } catch (Exception e) {
            status.put("connected", false);
            status.put("message", "Redis连接失败: " + e.getMessage());
        }
        
        return ResponseEntity.ok(status);
    }

    /**
     * 获取Redis信息
     */
    @GetMapping("/info")
    public ResponseEntity<Map<String, String>> getRedisInfo() {
        Map<String, String> result = new HashMap<>();
        
        if (redisService != null) {
            try {
                String info = redisService.getRedisInfo();
                result.put("info", info);
                result.put("status", "success");
            } catch (Exception e) {
                result.put("error", e.getMessage());
                result.put("status", "error");
            }
        } else {
            result.put("message", "Redis服务不可用，当前使用内存缓存");
            result.put("status", "unavailable");
        }
        
        return ResponseEntity.ok(result);
    }

    /**
     * 测试缓存操作
     */
    @PostMapping("/test")
    public ResponseEntity<Map<String, Object>> testCache(@RequestBody Map<String, String> request) {
        Map<String, Object> result = new HashMap<>();
        
        if (redisService == null) {
            result.put("error", "Redis服务不可用");
            return ResponseEntity.ok(result);
        }
        
        try {
            String key = request.getOrDefault("key", "test:cache:" + System.currentTimeMillis());
            String value = request.getOrDefault("value", "test_value");
            long ttl = Long.parseLong(request.getOrDefault("ttl", "300")); // 默认5分钟
            
            // 设置缓存
            long startTime = System.currentTimeMillis();
            redisService.set(key, value, ttl, TimeUnit.SECONDS);
            long setTime = System.currentTimeMillis() - startTime;
            
            // 获取缓存
            startTime = System.currentTimeMillis();
            String cachedValue = redisService.get(key, String.class);
            long getTime = System.currentTimeMillis() - startTime;
            
            // 检查过期时间
            Long expireTime = redisService.getExpire(key, TimeUnit.SECONDS);
            
            result.put("key", key);
            result.put("setValue", value);
            result.put("getValue", cachedValue);
            result.put("match", value.equals(cachedValue));
            result.put("setTime", setTime + "ms");
            result.put("getTime", getTime + "ms");
            result.put("ttl", expireTime + "s");
            result.put("status", "success");
            
        } catch (Exception e) {
            result.put("error", e.getMessage());
            result.put("status", "error");
        }
        
        return ResponseEntity.ok(result);
    }

    /**
     * 清除指定缓存
     */
    @DeleteMapping("/cache/{key}")
    public ResponseEntity<Map<String, String>> deleteCache(@PathVariable String key) {
        Map<String, String> result = new HashMap<>();
        
        if (redisService == null) {
            result.put("error", "Redis服务不可用");
            return ResponseEntity.ok(result);
        }
        
        try {
            Boolean deleted = redisService.delete(key);
            result.put("key", key);
            result.put("deleted", deleted.toString());
            result.put("message", deleted ? "缓存删除成功" : "缓存不存在或删除失败");
            result.put("status", "success");
        } catch (Exception e) {
            result.put("error", e.getMessage());
            result.put("status", "error");
        }
        
        return ResponseEntity.ok(result);
    }

    /**
     * 获取缓存信息
     */
    @GetMapping("/cache/{key}")
    public ResponseEntity<Map<String, Object>> getCacheInfo(@PathVariable String key) {
        Map<String, Object> result = new HashMap<>();
        
        if (redisService == null) {
            result.put("error", "Redis服务不可用");
            return ResponseEntity.ok(result);
        }
        
        try {
            Boolean exists = redisService.hasKey(key);
            result.put("key", key);
            result.put("exists", exists);
            
            if (exists) {
                Object value = redisService.get(key);
                Long ttl = redisService.getExpire(key, TimeUnit.SECONDS);
                result.put("value", value);
                result.put("ttl", ttl);
                result.put("type", value != null ? value.getClass().getSimpleName() : "null");
            }
            
            result.put("status", "success");
        } catch (Exception e) {
            result.put("error", e.getMessage());
            result.put("status", "error");
        }
        
        return ResponseEntity.ok(result);
    }

    /**
     * 清空所有缓存（危险操作！）
     */
    @PostMapping("/flush")
    public ResponseEntity<Map<String, String>> flushAll() {
        Map<String, String> result = new HashMap<>();
        
        if (redisService == null) {
            result.put("error", "Redis服务不可用");
            return ResponseEntity.ok(result);
        }
        
        try {
            String flushResult = redisService.flushDb();
            result.put("message", flushResult);
            result.put("status", "success");
        } catch (Exception e) {
            result.put("error", e.getMessage());
            result.put("status", "error");
        }
        
        return ResponseEntity.ok(result);
    }
}
