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
    private static final long EXPIRATION =  24 * 60 * 60 * 1000; // 1天

    public static String generateToken(String username, UserRole role) {
        try {
            Date now = new Date();
            Date expiration = new Date(System.currentTimeMillis() + EXPIRATION);
            
            logger.debug("Generating token for user: {}, role: {}, expiration: {}", username, role, expiration);
            
            return Jwts.builder()
                    .setSubject(username)
                    .claim("role", role)
                    .setIssuedAt(now)
                    .setExpiration(expiration)
                    .signWith(SECRET_KEY, SignatureAlgorithm.HS256)
                    .compact();
        } catch (Exception e) {
            logger.error("Error generating token for user: {}", username, e);
            throw e;
        }
    }

    public static Claims parseToken(String token) {
        try {
            logger.debug("Parsing token: {}", token.substring(0, Math.min(50, token.length())) + "...");
            Claims claims = Jwts.parser()
                    .setSigningKey(SECRET_KEY)
                    .parseClaimsJws(token)
                    .getBody();
            
            logger.debug("Token parsed successfully. Subject: {}, Expiration: {}", 
                claims.getSubject(), claims.getExpiration());
            
            return claims;
        } catch (ExpiredJwtException e) {
            logger.warn("Token expired: {}", e.getMessage());
            throw e;
        } catch (JwtException e) {
            logger.error("JWT parsing error: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error parsing token: {}", e.getMessage());
            throw e;
        }
    }

    public static boolean validateToken(String token) {
        try {
            Jwts.parser()
                .setSigningKey(SECRET_KEY)
                .parseClaimsJws(token);
            logger.debug("Token validation successful");
            return true;
        } catch (ExpiredJwtException e) {
            logger.warn("Token validation failed - expired: {}", e.getMessage());
            return false;
        } catch (JwtException | IllegalArgumentException e) {
            logger.warn("Token validation failed: {}", e.getMessage());
            return false;
        }
    }

    public static String getUsernameFromToken(String token) {
        Claims claims = parseToken(token);
        return claims.getSubject();
    }

    public static UserRole getRoleFromToken(String token) {
        Claims claims = parseToken(token);
        return (UserRole) claims.get("role");
    }

    public static void invalidateToken(String username) {
        // 无效化token
        // 在实际应用中，可以将token加入黑名单
        // 这里简化处理，实际可以通过Redis等缓存来实现
        logger.debug("Token invalidation requested for user: {}", username);
    }
}
