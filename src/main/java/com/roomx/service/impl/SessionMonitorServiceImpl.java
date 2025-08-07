package com.roomx.service.impl;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.roomx.service.SessionMonitorService;
import com.roomx.service.UserSessionService;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

@Service
public class SessionMonitorServiceImpl implements SessionMonitorService {
    
    private static final Logger logger = LoggerFactory.getLogger(SessionMonitorServiceImpl.class);
    
    // 存储详细的会话信息：用户名 -> 详细会话信息
    private final Map<String, SessionInfo> sessionDetails = new ConcurrentHashMap<>();
    
    // 会话过期时间（小时）
    private static final int SESSION_EXPIRY_HOURS = 24;
    
    // 定时清理任务
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
    
    private final UserSessionService userSessionService;
    
    public SessionMonitorServiceImpl(UserSessionService userSessionService) {
        this.userSessionService = userSessionService;
    }
    
    @PostConstruct
    public void init() {
        // 启动定时清理任务，每小时清理一次过期会话
        scheduler.scheduleAtFixedRate(this::cleanupExpiredSessions, 1, 1, TimeUnit.HOURS);
        logger.info("会话监控服务已启动");
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
        logger.info("会话监控服务已关闭");
    }
    
    @Override
    public Map<String, SessionInfo> getAllActiveSessions() {
        return sessionDetails.entrySet().stream()
            .filter(entry -> !isSessionExpired(entry.getValue()))
            .collect(Collectors.toConcurrentMap(
                Map.Entry::getKey,
                Map.Entry::getValue
            ));
    }
    
    @Override
    public boolean forceLogout(String username) {
        try {
            // 使会话失效
            userSessionService.invalidateSession(username);
            
            // 移除详细会话信息
            SessionInfo removedSession = sessionDetails.remove(username);
            if (removedSession != null) {
                logger.info("强制用户 {} 下线成功。会话ID: {}", username, removedSession.getSessionId());
            } else {
                logger.warn("强制用户 {} 下线失败，未找到会话信息", username);
            }
            
            return true;
        } catch (Exception e) {
            logger.error("强制用户 {} 下线时发生错误: {}", username, e.getMessage());
            return false;
        }
    }
    
    @Override
    public SessionInfo getUserSession(String username) {
        SessionInfo sessionInfo = sessionDetails.get(username);
        if (sessionInfo != null && !isSessionExpired(sessionInfo)) {
            return sessionInfo;
        }
        return null;
    }
    
    @Override
    public int cleanupExpiredSessions() {
        int beforeCount = sessionDetails.size();
        
        sessionDetails.entrySet().removeIf(entry -> {
            boolean expired = isSessionExpired(entry.getValue());
            if (expired) {
                logger.debug("清理过期会话: 用户 {}, 会话ID: {}", 
                    entry.getKey(), entry.getValue().getSessionId());
            }
            return expired;
        });
        
        int afterCount = sessionDetails.size();
        int cleanedCount = beforeCount - afterCount;
        
        if (cleanedCount > 0) {
            logger.info("清理了 {} 个过期会话", cleanedCount);
        }
        
        return cleanedCount;
    }
    
    /**
     * 更新会话信息
     * @param username 用户名
     * @param sessionId 会话ID
     * @param clientIP 客户端IP
     * @param userAgent 用户代理
     */
    public void updateSessionInfo(String username, String sessionId, String clientIP, String userAgent) {
        long currentTime = System.currentTimeMillis();
        SessionInfo sessionInfo = new SessionInfo(username, sessionId, currentTime, currentTime, clientIP, userAgent);
        sessionDetails.put(username, sessionInfo);
        
        logger.debug("更新会话信息: 用户 {}, 会话ID: {}, IP: {}", username, sessionId, clientIP);
    }
    
    /**
     * 更新会话最后访问时间
     * @param username 用户名
     */
    public void updateLastAccessTime(String username) {
        SessionInfo existingSession = sessionDetails.get(username);
        if (existingSession != null) {
            long currentTime = System.currentTimeMillis();
            SessionInfo updatedSession = new SessionInfo(
                existingSession.getUsername(),
                existingSession.getSessionId(),
                existingSession.getCreateTime(),
                currentTime,
                existingSession.getClientIP(),
                existingSession.getUserAgent()
            );
            sessionDetails.put(username, updatedSession);
        }
    }
    
    /**
     * 检查会话是否过期
     */
    private boolean isSessionExpired(SessionInfo sessionInfo) {
        long currentTime = System.currentTimeMillis();
        long expiryTime = sessionInfo.getCreateTime() + (SESSION_EXPIRY_HOURS * 60 * 60 * 1000L);
        return currentTime > expiryTime;
    }
} 