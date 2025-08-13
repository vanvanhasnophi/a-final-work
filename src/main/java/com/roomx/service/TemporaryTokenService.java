package com.roomx.service;

public interface TemporaryTokenService {
    /**
     * 生成临时验证token
     * @param username 用户名
     * @param operation 操作类型
     * @param targetId 目标ID（如删除用户的用户ID）
     * @return 临时token
     */
    String generateToken(String username, String operation, String targetId);
    
    /**
     * 验证并消费临时token（只能使用一次）
     * @param token 临时token
     * @param username 用户名
     * @param operation 操作类型
     * @param targetId 目标ID
     * @return 验证是否成功
     */
    boolean validateAndConsumeToken(String token, String username, String operation, String targetId);
    
    /**
     * 清理过期的临时token
     */
    void cleanExpiredTokens();
}
