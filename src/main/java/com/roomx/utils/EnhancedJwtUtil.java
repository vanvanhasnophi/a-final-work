package com.roomx.utils;

import java.security.Key;
import java.util.Date;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.roomx.constant.enums.UserRole;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

public class EnhancedJwtUtil {
    private static final Logger logger = LoggerFactory.getLogger(EnhancedJwtUtil.class);
    private static final String SECRET_STRING = "yourSecretKeyForRoomXApplication2024";
    private static final Key SECRET_KEY = Keys.hmacShaKeyFor(SECRET_STRING.getBytes());
    private static final long EXPIRATION = 24 * 60 * 60 * 1000; // 1天

    /**
     * 生成包含会话ID的token
     * @param username 用户名
     * @param role 用户角色
     * @param sessionId 会话ID
     * @return JWT token
     */
    public static String generateToken(String username, UserRole role, String sessionId) {
        try {
            Date now = new Date();
            Date expiration = new Date(System.currentTimeMillis() + EXPIRATION);
            
            logger.info("Generating enhanced token for user: {}, role: {}, sessionId: {}, expiration: {}", 
                username, role, sessionId, expiration);
            
            // 记录token生成开始
            TokenValidationLogger.logTokenGeneration(username, role.toString(), expiration.toString());
            
            String token = Jwts.builder()
                    .setSubject(username)
                    .claim("role", role.toString())
                    .claim("sessionId", sessionId)
                    .setIssuedAt(now)
                    .setExpiration(expiration)
                    .signWith(SECRET_KEY, SignatureAlgorithm.HS256)
                    .compact();
            
            logger.debug("Enhanced token generated successfully for user: {}", username);
            return token;
        } catch (Exception e) {
            logger.error("Error generating enhanced token for user: {}", username, e);
            TokenValidationLogger.logException("Enhanced token generation", e.getMessage(), 
                "Failed to generate enhanced token for user: " + username);
            throw e;
        }
    }

    /**
     * 解析token并返回Claims
     * @param token JWT token
     * @return Claims对象
     */
    public static Claims parseToken(String token) {
        try {
            String tokenPrefix = token.substring(0, Math.min(50, token.length())) + "...";
            logger.debug("Parsing enhanced token: {}", tokenPrefix);
            
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(SECRET_KEY)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
            
            logger.debug("Enhanced token parsed successfully. Subject: {}, SessionId: {}, Expiration: {}", 
                claims.getSubject(), claims.get("sessionId"), claims.getExpiration());
            
            return claims;
        } catch (ExpiredJwtException e) {
            logger.warn("Enhanced token expired: {}", e.getMessage());
            TokenValidationLogger.logTokenExpired("unknown", e.getMessage());
            throw e;
        } catch (JwtException e) {
            logger.error("Enhanced JWT parsing error: {}", e.getMessage());
            TokenValidationLogger.logException("Enhanced token parsing", e.getMessage(), "Enhanced JWT parsing error");
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error parsing enhanced token: {}", e.getMessage());
            TokenValidationLogger.logException("Enhanced token parsing", e.getMessage(), 
                "Unexpected error parsing enhanced token");
            throw e;
        }
    }

    /**
     * 验证token是否有效
     * @param token JWT token
     * @return 是否有效
     */
    public static boolean validateToken(String token) {
        if (token == null || token.trim().isEmpty()) {
            logger.warn("Enhanced token is null or empty");
            TokenValidationLogger.logException("Enhanced token validation", "Token is null or empty", 
                "Enhanced token validation failed");
            return false;
        }
        
        try {
            Claims claims = Jwts.parserBuilder()
                .setSigningKey(SECRET_KEY)
                .build()
                .parseClaimsJws(token)
                .getBody();
            
            // 检查token是否过期
            if (claims.getExpiration().before(new Date())) {
                logger.warn("Enhanced token is expired. Expiration: {}", claims.getExpiration());
                TokenValidationLogger.logTokenExpired(claims.getSubject(), claims.getExpiration().toString());
                return false;
            }
            
            // 检查是否包含sessionId
            String sessionId = claims.get("sessionId", String.class);
            if (sessionId == null || sessionId.trim().isEmpty()) {
                logger.warn("Enhanced token missing sessionId for user: {}", claims.getSubject());
                return false;
            }
            
            logger.debug("Enhanced token validation successful for user: {}", claims.getSubject());
            return true;
        } catch (ExpiredJwtException e) {
            logger.warn("Enhanced token validation failed - expired: {}", e.getMessage());
            TokenValidationLogger.logTokenExpired("unknown", e.getMessage());
            return false;
        } catch (JwtException | IllegalArgumentException e) {
            logger.warn("Enhanced token validation failed: {}", e.getMessage());
            TokenValidationLogger.logException("Enhanced token validation", e.getMessage(), 
                "Enhanced token validation failed");
            return false;
        } catch (Exception e) {
            logger.error("Unexpected error during enhanced token validation: {}", e.getMessage());
            TokenValidationLogger.logException("Enhanced token validation", e.getMessage(), 
                "Unexpected error during enhanced token validation");
            return false;
        }
    }

    /**
     * 从token中获取用户名
     * @param token JWT token
     * @return 用户名
     */
    public static String getUsernameFromToken(String token) {
        try {
            Claims claims = parseToken(token);
            return claims.getSubject();
        } catch (Exception e) {
            logger.error("Error getting username from enhanced token: {}", e.getMessage());
            throw e;
        }
    }

    /**
     * 从token中获取用户角色
     * @param token JWT token
     * @return 用户角色
     */
    public static UserRole getRoleFromToken(String token) {
        try {
            Claims claims = parseToken(token);
            Object roleObj = claims.get("role");
            
            logger.debug("EnhancedJwtUtil: 从token解析角色 - 原始roleObj: {}, 类型: {}", 
                roleObj, roleObj != null ? roleObj.getClass().getName() : "null");
            
            // 处理角色转换
            UserRole role;
            if (roleObj instanceof String roleStr) {

                // 兼容性处理：将SERVICE_STAFF映射为SERVICE
                if ("SERVICE_STAFF".equals(roleStr)) {
                    roleStr = "SERVICE";
                    logger.warn("EnhancedJwtUtil: 检测到旧的SERVICE_STAFF角色，自动映射为SERVICE");
                }
                
                try {
                    role = UserRole.valueOf(roleStr);
                    logger.debug("EnhancedJwtUtil: 成功解析角色字符串: {} -> {}", roleObj, role);
                } catch (IllegalArgumentException e) {
                    logger.warn("EnhancedJwtUtil: 无效的角色字符串: {}", roleObj);
                    TokenValidationLogger.logException("Enhanced role parsing", e.getMessage(), 
                        "Invalid role string: " + roleObj);
                    throw e;
                }
            } else if (roleObj instanceof UserRole) {
                role = (UserRole) roleObj;
                logger.debug("EnhancedJwtUtil: 直接使用UserRole对象: {}", role);
            } else {
                logger.warn("EnhancedJwtUtil: 意外的角色类型: {}", 
                    roleObj != null ? roleObj.getClass().getName() : "null");
                TokenValidationLogger.logException("Enhanced role parsing", "Unexpected role type", 
                    "Role type: " + (roleObj != null ? roleObj.getClass().getName() : "null"));
                throw new IllegalArgumentException("Unexpected role type: " + 
                    (roleObj != null ? roleObj.getClass().getName() : "null"));
            }
            
            logger.debug("EnhancedJwtUtil: 最终解析的角色: {}", role);
            return role;
        } catch (Exception e) {
            logger.error("EnhancedJwtUtil: 从token获取角色时出错: {}", e.getMessage());
            TokenValidationLogger.logException("Enhanced role extraction", e.getMessage(), 
                "Failed to extract role from enhanced token");
            throw e;
        }
    }

    /**
     * 从token中获取会话ID
     * @param token JWT token
     * @return 会话ID
     */
    public static String getSessionIdFromToken(String token) {
        try {
            Claims claims = parseToken(token);
            String sessionId = claims.get("sessionId", String.class);
            
            if (sessionId == null || sessionId.trim().isEmpty()) {
                logger.warn("EnhancedJwtUtil: token中缺少sessionId");
                return null;
            }
            
            logger.debug("EnhancedJwtUtil: 从token获取sessionId: {}", sessionId);
            return sessionId;
        } catch (Exception e) {
            logger.error("EnhancedJwtUtil: 从token获取sessionId时出错: {}", e.getMessage());
            throw e;
        }
    }

    /**
     * 使token失效
     * @param username 用户名
     */
    public static void invalidateToken(String username) {
        // 在实际应用中，可以将token加入黑名单
        // 这里简化处理，实际可以通过Redis等缓存来实现
        logger.info("Enhanced token invalidation requested for user: {}", username);
    }
} 