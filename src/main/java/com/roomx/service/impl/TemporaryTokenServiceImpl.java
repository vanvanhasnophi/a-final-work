package com.roomx.service.impl;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.roomx.service.TemporaryTokenService;

import lombok.Data;

@Service
public class TemporaryTokenServiceImpl implements TemporaryTokenService {
    
    // 存储临时token的内存映射，实际生产环境应该使用Redis
    private final Map<String, TokenInfo> tokenStore = new ConcurrentHashMap<>();
    
    // token有效期：5分钟
    private static final int TOKEN_EXPIRY_MINUTES = 5;
    
    @Data
    private static class TokenInfo {
        private String username;
        private String operation;
        private String targetId;
        private LocalDateTime expiryTime;
        private boolean consumed = false;
        
        public TokenInfo(String username, String operation, String targetId) {
            this.username = username;
            this.operation = operation;
            this.targetId = targetId;
            this.expiryTime = LocalDateTime.now().plusMinutes(TOKEN_EXPIRY_MINUTES);
        }
        
        public boolean isExpired() {
            return LocalDateTime.now().isAfter(expiryTime);
        }
    }
    
    @Override
    public String generateToken(String username, String operation, String targetId) {
        String token = UUID.randomUUID().toString().replace("-", "");
        TokenInfo tokenInfo = new TokenInfo(username, operation, targetId);
        tokenStore.put(token, tokenInfo);
        
        System.out.println("生成临时token: " + token + " for " + username + " operation: " + operation + " target: " + targetId);
        return token;
    }
    
    @Override
    public boolean validateAndConsumeToken(String token, String username, String operation, String targetId) {
        TokenInfo tokenInfo = tokenStore.get(token);
        
        if (tokenInfo == null) {
            System.out.println("Token不存在: " + token);
            return false;
        }
        
        if (tokenInfo.isExpired()) {
            System.out.println("Token已过期: " + token);
            tokenStore.remove(token);
            return false;
        }
        
        if (tokenInfo.isConsumed()) {
            System.out.println("Token已被使用: " + token);
            tokenStore.remove(token);
            return false;
        }
        
        // 验证token信息是否匹配
        if (!tokenInfo.getUsername().equals(username) ||
            !tokenInfo.getOperation().equals(operation) ||
            !tokenInfo.getTargetId().equals(targetId)) {
            System.out.println("Token信息不匹配: " + token);
            return false;
        }
        
        // 标记为已使用并移除
        tokenInfo.setConsumed(true);
        tokenStore.remove(token);
        
        System.out.println("Token验证成功并已消费: " + token);
        return true;
    }
    
    @Override
    @Scheduled(fixedRate = 300000) // 每5分钟清理一次过期token
    public void cleanExpiredTokens() {
        tokenStore.entrySet().removeIf(entry -> 
            entry.getValue().isExpired() || entry.getValue().isConsumed()
        );
        System.out.println("清理过期token完成，当前token数量: " + tokenStore.size());
    }
}
