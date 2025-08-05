package com.roomx.service.impl;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.roomx.service.UserSessionService;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

@Service
public class UserSessionServiceImpl implements UserSessionService {
    
    private static final Logger logger = LoggerFactory.getLogger(UserSessionServiceImpl.class);
    
    // 存储用户会话信息：用户名 -> (会话ID, 创建时间)
    private final Map<String, SessionInfo> userSessions = new ConcurrentHashMap<>();
    
    // 会话过期时间（小时）
    private static final int SESSION_EXPIRY_HOURS = 24;
    
    // 定时清理任务
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
    
    @PostConstruct
    public void init() {
        // 启动定时清理任务，每小时清理一次过期会话
        scheduler.scheduleAtFixedRate(this::cleanupExpiredSessions, 1, 1, TimeUnit.HOURS);
        logger.info("用户会话管理服务已启动");
    }
    
    @PreDestroy
    public void destroy() {
        scheduler.shutdown();
        try {
            if (!scheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                scheduler.shutdownNow();
            }
        } catch (InterruptedException e) {
            scheduler.shutdownNow();
            Thread.currentThread().interrupt();
        }
        logger.info("用户会话管理服务已关闭");
    }
    
    @Override
    public String generateSessionId(String username) {
        String sessionId = UUID.randomUUID().toString();
        LocalDateTime now = LocalDateTime.now();
        
        // 如果用户已有会话，先记录日志
        SessionInfo existingSession = userSessions.get(username);
        if (existingSession != null) {
            logger.info("用户 {} 已有活跃会话，将创建新会话。旧会话ID: {}", username, existingSession.sessionId);
        }
        
        // 创建新会话
        SessionInfo sessionInfo = new SessionInfo(sessionId, now);
        userSessions.put(username, sessionInfo);
        
        logger.info("为用户 {} 生成新会话ID: {}", username, sessionId);
        return sessionId;
    }
    
    @Override
    public boolean validateSession(String username, String sessionId) {
        SessionInfo sessionInfo = userSessions.get(username);
        
        if (sessionInfo == null) {
            logger.debug("用户 {} 没有活跃会话", username);
            return false;
        }
        
        if (!sessionInfo.sessionId.equals(sessionId)) {
            logger.warn("用户 {} 的会话ID不匹配。期望: {}, 实际: {}", 
                username, sessionInfo.sessionId, sessionId);
            return false;
        }
        
        // 检查会话是否过期
        if (isSessionExpired(sessionInfo)) {
            logger.warn("用户 {} 的会话已过期", username);
            userSessions.remove(username);
            return false;
        }
        
        logger.debug("用户 {} 的会话验证成功", username);
        return true;
    }
    
    @Override
    public void invalidateSession(String username) {
        SessionInfo removedSession = userSessions.remove(username);
        if (removedSession != null) {
            logger.info("用户 {} 的会话已失效。会话ID: {}", username, removedSession.sessionId);
        } else {
            logger.debug("用户 {} 没有活跃会话需要失效", username);
        }
    }
    
    @Override
    public String getCurrentSessionId(String username) {
        SessionInfo sessionInfo = userSessions.get(username);
        if (sessionInfo != null && !isSessionExpired(sessionInfo)) {
            return sessionInfo.sessionId;
        }
        return null;
    }
    
    @Override
    public boolean isLoggedInElsewhere(String username, String currentSessionId) {
        SessionInfo sessionInfo = userSessions.get(username);
        
        if (sessionInfo == null) {
            return false; // 没有其他会话
        }
        
        if (isSessionExpired(sessionInfo)) {
            // 清理过期会话
            userSessions.remove(username);
            return false;
        }
        
        // 检查是否有不同的会话ID
        boolean isElsewhere = !sessionInfo.sessionId.equals(currentSessionId);
        if (isElsewhere) {
            logger.info("用户 {} 在其他地方登录。当前会话: {}, 服务器会话: {}", 
                username, currentSessionId, sessionInfo.sessionId);
        }
        
        return isElsewhere;
    }
    
    @Override
    public Map<String, String> getAllActiveSessions() {
        Map<String, String> activeSessions = new ConcurrentHashMap<>();
        
        userSessions.forEach((username, sessionInfo) -> {
            if (!isSessionExpired(sessionInfo)) {
                activeSessions.put(username, sessionInfo.sessionId);
            }
        });
        
        return activeSessions;
    }
    
    @Override
    public void cleanupExpiredSessions() {
        int beforeCount = userSessions.size();
        
        userSessions.entrySet().removeIf(entry -> {
            boolean expired = isSessionExpired(entry.getValue());
            if (expired) {
                logger.debug("清理过期会话: 用户 {}, 会话ID: {}", 
                    entry.getKey(), entry.getValue().sessionId);
            }
            return expired;
        });
        
        int afterCount = userSessions.size();
        int cleanedCount = beforeCount - afterCount;
        
        if (cleanedCount > 0) {
            logger.info("清理了 {} 个过期会话", cleanedCount);
        }
    }
    
    /**
     * 检查会话是否过期
     */
    private boolean isSessionExpired(SessionInfo sessionInfo) {
        return sessionInfo.createdAt.plusHours(SESSION_EXPIRY_HOURS).isBefore(LocalDateTime.now());
    }
    
    /**
     * 会话信息内部类
     */
    private static class SessionInfo {
        final String sessionId;
        final LocalDateTime createdAt;
        
        SessionInfo(String sessionId, LocalDateTime createdAt) {
            this.sessionId = sessionId;
            this.createdAt = createdAt;
        }
        
        @Override
        public String toString() {
            return String.format("SessionInfo{sessionId='%s', createdAt=%s}", sessionId, createdAt);
        }
    }
} 