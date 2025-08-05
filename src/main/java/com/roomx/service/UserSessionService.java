package com.roomx.service;

import java.util.Map;

public interface UserSessionService {
    
    /**
     * 生成新的会话ID
     * @param username 用户名
     * @return 会话ID
     */
    String generateSessionId(String username);
    
    /**
     * 验证会话ID是否有效
     * @param username 用户名
     * @param sessionId 会话ID
     * @return 是否有效
     */
    boolean validateSession(String username, String sessionId);
    
    /**
     * 使会话失效
     * @param username 用户名
     */
    void invalidateSession(String username);
    
    /**
     * 获取用户当前会话ID
     * @param username 用户名
     * @return 会话ID，如果不存在返回null
     */
    String getCurrentSessionId(String username);
    
    /**
     * 检查用户是否在其他地方登录
     * @param username 用户名
     * @param currentSessionId 当前会话ID
     * @return 是否在其他地方登录
     */
    boolean isLoggedInElsewhere(String username, String currentSessionId);
    
    /**
     * 获取所有活跃会话
     * @return 用户名到会话ID的映射
     */
    Map<String, String> getAllActiveSessions();
    
    /**
     * 清理过期会话
     */
    void cleanupExpiredSessions();
} 