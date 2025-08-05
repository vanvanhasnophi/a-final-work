package com.roomx.service;

import java.util.Map;

/**
 * 会话监控服务接口
 * 用于监控和管理用户会话状态
 */
public interface SessionMonitorService {
    
    /**
     * 获取所有活跃会话
     * @return 用户名到会话信息的映射
     */
    Map<String, SessionInfo> getAllActiveSessions();
    
    /**
     * 强制使用户下线
     * @param username 用户名
     * @return 是否成功
     */
    boolean forceLogout(String username);
    
    /**
     * 获取用户会话信息
     * @param username 用户名
     * @return 会话信息
     */
    SessionInfo getUserSession(String username);
    
    /**
     * 清理过期会话
     * @return 清理的会话数量
     */
    int cleanupExpiredSessions();
    
    /**
     * 会话信息类
     */
    class SessionInfo {
        private final String username;
        private final String sessionId;
        private final long createTime;
        private final long lastAccessTime;
        private final String clientIP;
        private final String userAgent;
        
        public SessionInfo(String username, String sessionId, long createTime, 
                         long lastAccessTime, String clientIP, String userAgent) {
            this.username = username;
            this.sessionId = sessionId;
            this.createTime = createTime;
            this.lastAccessTime = lastAccessTime;
            this.clientIP = clientIP;
            this.userAgent = userAgent;
        }
        
        public String getUsername() {
            return username;
        }
        
        public String getSessionId() {
            return sessionId;
        }
        
        public long getCreateTime() {
            return createTime;
        }
        
        public long getLastAccessTime() {
            return lastAccessTime;
        }
        
        public String getClientIP() {
            return clientIP;
        }
        
        public String getUserAgent() {
            return userAgent;
        }
        
        @Override
        public String toString() {
            return String.format("SessionInfo{username='%s', sessionId='%s', createTime=%d, lastAccessTime=%d, clientIP='%s', userAgent='%s'}", 
                username, sessionId, createTime, lastAccessTime, clientIP, userAgent);
        }
    }
} 