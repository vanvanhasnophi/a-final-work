package com.roomx.service.impl;

import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.roomx.model.entity.User;
import com.roomx.service.RedisService;

/**
 * Redis 缓存使用示例
 * 演示如何在业务服务中使用Redis缓存
 */
@Service
@ConditionalOnBean(RedisService.class)
public class RedisCacheExampleService {

    @Autowired(required = false)
    private RedisService redisService;

    /**
     * 示例1：使用Spring Cache注解
     * 自动将方法结果缓存到Redis
     */
    @Cacheable(value = "user-details", key = "#userId")
    public String getUserDetails(Long userId) {
        // 模拟耗时的数据库查询
        try {
            Thread.sleep(1000); // 模拟1秒查询时间
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        return "用户详情数据 for userId: " + userId;
    }

    /**
     * 示例2：更新缓存
     */
    @CachePut(value = "user-details", key = "#userId")
    public String updateUserDetails(Long userId, String details) {
        // 更新数据库后，同时更新缓存
        return "更新后的用户详情: " + details;
    }

    /**
     * 示例3：删除缓存
     */
    @CacheEvict(value = "user-details", key = "#userId")
    public void deleteUserDetails(Long userId) {
        // 从数据库删除后，同时删除缓存
        System.out.println("删除用户详情缓存: " + userId);
    }

    /**
     * 示例4：直接使用RedisService
     * 更灵活的缓存操作
     */
    public void sessionCacheExample(String sessionId, User user) {
        if (redisService == null) {
            return;
        }

        String sessionKey = "session:" + sessionId;
        
        // 缓存会话信息，30分钟过期
        redisService.set(sessionKey, user, 30, TimeUnit.MINUTES);
        
        // 获取会话信息
        User cachedUser = redisService.get(sessionKey, User.class);
        System.out.println("缓存的用户: " + cachedUser);
        
        // 检查会话是否存在
        boolean sessionExists = redisService.hasKey(sessionKey);
        System.out.println("会话存在: " + sessionExists);
        
        // 延长会话时间
        redisService.expire(sessionKey, 60, TimeUnit.MINUTES);
    }

    /**
     * 示例5：使用Hash存储用户配置
     */
    public void userPreferencesExample(Long userId) {
        if (redisService == null) {
            return;
        }

        String prefKey = "user:preferences:" + userId;
        
        // 设置用户配置
        redisService.hSet(prefKey, "theme", "dark");
        redisService.hSet(prefKey, "language", "zh-CN");
        redisService.hSet(prefKey, "notifications", "true");
        
        // 获取用户配置
        String theme = redisService.hGet(prefKey, "theme", String.class);
        String language = redisService.hGet(prefKey, "language", String.class);
        
        System.out.println("用户主题: " + theme);
        System.out.println("用户语言: " + language);
        
        // 设置Hash过期时间
        redisService.expire(prefKey, 7, TimeUnit.DAYS);
    }

    /**
     * 示例6：使用List实现消息队列
     */
    public void messageQueueExample() {
        if (redisService == null) {
            return;
        }

        String queueKey = "message:queue:notifications";
        
        // 推送消息到队列
        redisService.rPush(queueKey, "用户登录通知");
        redisService.rPush(queueKey, "申请审批通知");
        redisService.rPush(queueKey, "系统维护通知");
        
        // 从队列中取出消息处理
        while (redisService.lSize(queueKey) > 0) {
            Object message = redisService.lPop(queueKey);
            System.out.println("处理消息: " + message);
        }
    }

    /**
     * 示例7：使用Set实现去重统计
     */
    public void uniqueVisitorExample(String pageUrl, String userId) {
        if (redisService == null) {
            return;
        }

        String visitorKey = "page:visitors:" + pageUrl;
        
        // 添加访问用户到集合（自动去重）
        redisService.sAdd(visitorKey, userId);
        
        // 获取独立访客数
        Long uniqueVisitors = redisService.sSize(visitorKey);
        System.out.println("页面独立访客数: " + uniqueVisitors);
        
        // 检查用户是否访问过
        boolean hasVisited = redisService.sIsMember(visitorKey, userId);
        System.out.println("用户是否访问过: " + hasVisited);
        
        // 设置统计数据过期时间（每天重置）
        redisService.expire(visitorKey, 1, TimeUnit.DAYS);
    }

    /**
     * 获取Redis服务状态
     */
    public String getRedisStatus() {
        if (redisService == null) {
            return "Redis服务不可用，使用内存缓存";
        }
        
        try {
            // 测试Redis连接
            String testKey = "health:check:" + System.currentTimeMillis();
            redisService.set(testKey, "ok", 10, TimeUnit.SECONDS);
            String result = redisService.get(testKey, String.class);
            redisService.delete(testKey);
            
            return "ok".equals(result) ? "Redis连接正常" : "Redis连接异常";
        } catch (Exception e) {
            return "Redis连接失败: " + e.getMessage();
        }
    }
}
