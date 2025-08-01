package com.roomx.utils;

import java.io.IOException;
import java.util.Collections;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import com.roomx.constant.enums.UserRole;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        long startTime = System.currentTimeMillis();
        String requestURI = request.getRequestURI();
        String clientIP = getClientIP(request);
        String userAgent = request.getHeader("User-Agent");
        
        // 记录token验证开始
        TokenValidationLogger.logValidationStart(requestURI, clientIP, userAgent);
        
        // 跳过登录和注册请求的JWT验证
        if (requestURI.equals("/api/login") || requestURI.equals("/api/register")) {
            TokenValidationLogger.logValidationSkipped(requestURI, "Login/Register endpoint");
            chain.doFilter(request, response);
            return;
        }
        
        String header = request.getHeader("Authorization");
        logger.debug("JWT Filter - Request URI: {}, Authorization header: {}", requestURI, header);
        
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            String tokenPrefix = token.substring(0, Math.min(50, token.length())) + "...";
            
            // 记录token解析开始
            TokenValidationLogger.logTokenParsingStart(tokenPrefix);
            
            try {
                logger.debug("JWT Filter - Parsing token: {}", tokenPrefix);
                Claims claims = JwtUtil.parseToken(token);
                String username = claims.getSubject();
                Object roleObj = claims.get("role");
                String expiration = claims.getExpiration() != null ? claims.getExpiration().toString() : "null";
                
                logger.debug("JWT Filter - Parsed claims - username: {}, role: {}", username, roleObj);
                
                // 记录token解析成功
                TokenValidationLogger.logTokenParsingSuccess(username, roleObj != null ? roleObj.toString() : "null", expiration);
                
                // 处理角色转换
                UserRole role = null;
                if (roleObj instanceof String) {
                    try {
                        role = UserRole.valueOf((String) roleObj);
                    } catch (IllegalArgumentException e) {
                        logger.warn("JWT Filter - Invalid role string: {}", roleObj);
                        TokenValidationLogger.logException("Role parsing", e.getMessage(), "Invalid role string: " + roleObj);
                    }
                } else if (roleObj instanceof UserRole) {
                    role = (UserRole) roleObj;
                }
                
                if (username != null) {
                    UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(username, null, Collections.emptyList());
                    SecurityContextHolder.getContext().setAuthentication(auth);
                    logger.debug("JWT Filter - Authentication set for user: {}", username);
                    
                    // 记录认证设置成功
                    TokenValidationLogger.logAuthenticationSet(username, role != null ? role.toString() : "null");
                    
                    // 记录验证统计
                    long duration = System.currentTimeMillis() - startTime;
                    TokenValidationLogger.logValidationStats(username, requestURI, duration);
                    
                    // 记录验证完成
                    TokenValidationLogger.logValidationComplete(requestURI, true, "Authentication successful");
                } else {
                    logger.warn("JWT Filter - Username is null from token");
                    TokenValidationLogger.logAuthenticationFailed("Username is null from token");
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    
                    // 记录验证完成
                    TokenValidationLogger.logValidationComplete(requestURI, false, "Username is null");
                    return;
                }
            } catch (Exception e) {
                logger.error("JWT Filter - Token validation failed: {}", e.getMessage());
                TokenValidationLogger.logTokenParsingFailure(e.getMessage(), tokenPrefix);
                TokenValidationLogger.logException("Token validation", e.getMessage(), "Token validation failed");
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                
                // 记录验证完成
                TokenValidationLogger.logValidationComplete(requestURI, false, "Token validation failed: " + e.getMessage());
                return;
            }
        } else {
            logger.debug("JWT Filter - No valid Authorization header found");
            TokenValidationLogger.logValidationComplete(requestURI, false, "No valid Authorization header");
        }
        
        chain.doFilter(request, response);
    }
    
    /**
     * 获取客户端IP地址
     */
    private String getClientIP(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIP = request.getHeader("X-Real-IP");
        if (xRealIP != null && !xRealIP.isEmpty() && !"unknown".equalsIgnoreCase(xRealIP)) {
            return xRealIP;
        }
        
        return request.getRemoteAddr();
    }
} 