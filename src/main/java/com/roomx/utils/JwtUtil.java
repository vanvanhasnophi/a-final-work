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

public class JwtUtil {
    private static final Logger logger = LoggerFactory.getLogger(JwtUtil.class);
    private static final String SECRET_STRING = "yourSecretKeyForRoomXApplication2024";
    private static final Key SECRET_KEY = Keys.hmacShaKeyFor(SECRET_STRING.getBytes());
    private static final long EXPIRATION = 24 * 60 * 60 * 1000; // 1天

    public static String generateToken(String username, UserRole role) {
        try {
            Date now = new Date();
            Date expiration = new Date(System.currentTimeMillis() + EXPIRATION);
            
            logger.info("Generating token for user: {}, role: {}, expiration: {}", username, role, expiration);
            
            // 记录token生成开始
            TokenValidationLogger.logTokenGeneration(username, role.toString(), expiration.toString());
            
            String token = Jwts.builder()
                    .setSubject(username)
                    .claim("role", role.toString())
                    .setIssuedAt(now)
                    .setExpiration(expiration)
                    .signWith(SECRET_KEY, SignatureAlgorithm.HS256)
                    .compact();
            
            logger.debug("Token generated successfully for user: {}", username);
            return token;
        } catch (Exception e) {
            logger.error("Error generating token for user: {}", username, e);
            TokenValidationLogger.logException("Token generation", e.getMessage(), "Failed to generate token for user: " + username);
            throw e;
        }
    }

    public static Claims parseToken(String token) {
        try {
            String tokenPrefix = token.substring(0, Math.min(50, token.length())) + "...";
            logger.debug("Parsing token: {}", tokenPrefix);
            
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(SECRET_KEY)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
            
            logger.debug("Token parsed successfully. Subject: {}, Expiration: {}", 
                claims.getSubject(), claims.getExpiration());
            
            return claims;
        } catch (ExpiredJwtException e) {
            logger.warn("Token expired: {}", e.getMessage());
            TokenValidationLogger.logTokenExpired("unknown", e.getMessage());
            throw e;
        } catch (JwtException e) {
            logger.error("JWT parsing error: {}", e.getMessage());
            TokenValidationLogger.logException("Token parsing", e.getMessage(), "JWT parsing error");
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error parsing token: {}", e.getMessage());
            TokenValidationLogger.logException("Token parsing", e.getMessage(), "Unexpected error parsing token");
            throw e;
        }
    }

    public static boolean validateToken(String token) {
        if (token == null || token.trim().isEmpty()) {
            logger.warn("Token is null or empty");
            TokenValidationLogger.logException("Token validation", "Token is null or empty", "Token validation failed");
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
                logger.warn("Token is expired. Expiration: {}", claims.getExpiration());
                TokenValidationLogger.logTokenExpired(claims.getSubject(), claims.getExpiration().toString());
                return false;
            }
            
            logger.debug("Token validation successful for user: {}", claims.getSubject());
            return true;
        } catch (ExpiredJwtException e) {
            logger.warn("Token validation failed - expired: {}", e.getMessage());
            TokenValidationLogger.logTokenExpired("unknown", e.getMessage());
            return false;
        } catch (JwtException | IllegalArgumentException e) {
            logger.warn("Token validation failed: {}", e.getMessage());
            TokenValidationLogger.logException("Token validation", e.getMessage(), "Token validation failed");
            return false;
        } catch (Exception e) {
            logger.error("Unexpected error during token validation: {}", e.getMessage());
            TokenValidationLogger.logException("Token validation", e.getMessage(), "Unexpected error during token validation");
            return false;
        }
    }

    public static String getUsernameFromToken(String token) {
        try {
            Claims claims = parseToken(token);
            return claims.getSubject();
        } catch (Exception e) {
            logger.error("Error getting username from token: {}", e.getMessage());
            throw e;
        }
    }

    public static UserRole getRoleFromToken(String token) {
        try {
            Claims claims = parseToken(token);
            Object roleObj = claims.get("role");
            
            logger.debug("JwtUtil: 从token解析角色 - 原始roleObj: {}, 类型: {}", 
                roleObj, roleObj != null ? roleObj.getClass().getName() : "null");
            
            // 处理角色转换
            UserRole role = null;
            if (roleObj instanceof String) {
                String roleStr = (String) roleObj;
                
                // 兼容性处理：将SERVICE_STAFF映射为SERVICE
                if ("SERVICE_STAFF".equals(roleStr)) {
                    roleStr = "SERVICE";
                    logger.warn("JwtUtil: 检测到旧的SERVICE_STAFF角色，自动映射为SERVICE");
                }
                
                try {
                    role = UserRole.valueOf(roleStr);
                    logger.debug("JwtUtil: 成功解析角色字符串: {} -> {}", roleObj, role);
                } catch (IllegalArgumentException e) {
                    logger.warn("JwtUtil: 无效的角色字符串: {}", roleObj);
                    TokenValidationLogger.logException("Role parsing", e.getMessage(), "Invalid role string: " + roleObj);
                    throw e;
                }
            } else if (roleObj instanceof UserRole) {
                role = (UserRole) roleObj;
                logger.debug("JwtUtil: 直接使用UserRole对象: {}", role);
            } else {
                logger.warn("JwtUtil: 意外的角色类型: {}", roleObj != null ? roleObj.getClass().getName() : "null");
                TokenValidationLogger.logException("Role parsing", "Unexpected role type", "Role type: " + (roleObj != null ? roleObj.getClass().getName() : "null"));
                throw new IllegalArgumentException("Unexpected role type: " + (roleObj != null ? roleObj.getClass().getName() : "null"));
            }
            
            logger.debug("JwtUtil: 最终解析的角色: {}", role);
            return role;
        } catch (Exception e) {
            logger.error("JwtUtil: 从token获取角色时出错: {}", e.getMessage());
            TokenValidationLogger.logException("Role extraction", e.getMessage(), "Failed to extract role from token");
            throw e;
        }
    }

    public static void invalidateToken(String username) {
        // 无效化token
        // 在实际应用中，可以将token加入黑名单
        // 这里简化处理，实际可以通过Redis等缓存来实现
        logger.info("Token invalidation requested for user: {}", username);
    }
}
