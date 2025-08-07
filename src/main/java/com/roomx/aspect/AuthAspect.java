package com.roomx.aspect;

import java.lang.reflect.Method;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import com.roomx.annotation.RequireAuth;
import com.roomx.constant.enums.UserRole;
import com.roomx.utils.JwtUtil;
import com.roomx.utils.TokenValidationLogger;

import jakarta.servlet.http.HttpServletRequest;

@Aspect
@Component
public class AuthAspect {
    private static final Logger logger = LoggerFactory.getLogger(AuthAspect.class);

    @Around("@annotation(com.roomx.annotation.RequireAuth)")
    public Object checkAuth(ProceedingJoinPoint joinPoint) throws Throwable {
        long startTime = System.currentTimeMillis();
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        RequireAuth requireAuth = method.getAnnotation(RequireAuth.class);
        
        logger.debug("AuthAspect: 检查认证 - 方法: {}, 需要认证: {}", method.getName(), requireAuth.requireAuth());
        
        if (!requireAuth.requireAuth()) {
            logger.debug("AuthAspect: 跳过认证检查");
            return joinPoint.proceed();
        }
        
        // 获取当前请求
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null) {
            logger.warn("AuthAspect: 无法获取请求上下文 (RequestContextHolder.getRequestAttributes() 返回 null)");
            TokenValidationLogger.logValidationComplete("AUTH_ASPECT", false, "No request context");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("No request context");
        }
        HttpServletRequest request = attributes.getRequest();
        String authHeader = request.getHeader("Authorization");
        String requestURI = request.getRequestURI();
        String clientIP = getClientIP(request);
        String userAgent = request.getHeader("User-Agent");
        
        // 记录AuthAspect验证开始
        TokenValidationLogger.logValidationStart("AUTH_ASPECT_" + requestURI, clientIP, userAgent);
        
        logger.debug("AuthAspect: 请求URI: {}, Authorization头: {}", requestURI, authHeader != null ? "存在" : "不存在");
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            logger.warn("AuthAspect: 缺少或无效的Authorization头");
            TokenValidationLogger.logValidationComplete("AUTH_ASPECT_" + requestURI, false, "Missing or invalid Authorization header");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Missing or invalid token");
        }
        
        String token = authHeader.substring(7);
        String tokenPrefix = token.substring(0, Math.min(50, token.length())) + "...";
        
        // 记录token解析开始
        TokenValidationLogger.logTokenParsingStart("AUTH_ASPECT_" + tokenPrefix);
        
        try {
            // 验证token
            if (!JwtUtil.validateToken(token)) {
                logger.warn("AuthAspect: Token验证失败");
                TokenValidationLogger.logTokenParsingFailure("Token validation failed", tokenPrefix);
                TokenValidationLogger.logValidationComplete("AUTH_ASPECT_" + requestURI, false, "Token validation failed");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
            }
            
            // 获取用户信息
            UserRole userRole = JwtUtil.getRoleFromToken(token);
            String username = JwtUtil.getUsernameFromToken(token);
            
            // 记录token解析成功
            TokenValidationLogger.logTokenParsingSuccess(username, userRole.toString(), "AUTH_ASPECT");
            
            // 检查角色权限
            UserRole[] requiredRoles = requireAuth.roles();
            if (requiredRoles.length > 0) {
                logger.debug("AuthAspect: 用户: {}, 角色: {}, 需要角色: {}", username, userRole, requiredRoles);
                
                boolean hasPermission = false;
                for (UserRole requiredRole : requiredRoles) {
                    if (userRole == requiredRole) {
                        hasPermission = true;
                        break;
                    }
                }
                
                if (!hasPermission) {
                    logger.warn("AuthAspect: 权限不足 - 用户: {}, 角色: {}, 需要角色: {}", username, userRole, requiredRoles);
                    TokenValidationLogger.logAuthenticationFailed("Insufficient permissions - User: " + username + ", Role: " + userRole + ", Required: " + java.util.Arrays.toString(requiredRoles));
                    TokenValidationLogger.logValidationComplete("AUTH_ASPECT_" + requestURI, false, "Insufficient permissions");
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Insufficient permissions");
                }
                
                logger.debug("AuthAspect: 认证成功 - 用户: {}, 角色: {}", username, userRole);
                TokenValidationLogger.logAuthenticationSet(username, userRole.toString());
            }
            
            // 记录验证统计
            long duration = System.currentTimeMillis() - startTime;
            TokenValidationLogger.logValidationStats(username, "AUTH_ASPECT_" + requestURI, duration);
            
            // 记录验证完成
            TokenValidationLogger.logValidationComplete("AUTH_ASPECT_" + requestURI, true, "AuthAspect authentication successful");
            
            return joinPoint.proceed();
            
        } catch (Exception e) {
            logger.error("AuthAspect: 认证过程中发生异常", e);
            TokenValidationLogger.logException("AuthAspect", e.getMessage(), "AuthAspect authentication failed");
            TokenValidationLogger.logValidationComplete("AUTH_ASPECT_" + requestURI, false, "AuthAspect exception: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Authentication failed");
        }
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