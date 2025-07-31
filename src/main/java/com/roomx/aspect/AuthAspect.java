package com.roomx.aspect;

import java.lang.reflect.Method;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import com.roomx.annotation.RequireAuth;
import com.roomx.constant.enums.UserRole;
import com.roomx.utils.JwtUtil;

import jakarta.servlet.http.HttpServletRequest;

@Aspect
@Component
public class AuthAspect {

    @Around("@annotation(com.roomx.annotation.RequireAuth)")
    public Object checkAuth(ProceedingJoinPoint joinPoint) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        RequireAuth requireAuth = method.getAnnotation(RequireAuth.class);
        
        if (!requireAuth.requireAuth()) {
            return joinPoint.proceed();
        }
        
        // 获取当前请求
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }
        
        HttpServletRequest request = attributes.getRequest();
        String authHeader = request.getHeader("Authorization");
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Missing or invalid token");
        }
        
        String token = authHeader.substring(7);
        
        try {
            // 验证token
            if (!JwtUtil.validateToken(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
            }
            
            // 检查角色权限
            UserRole[] requiredRoles = requireAuth.roles();
            if (requiredRoles.length > 0) {
                UserRole userRole = JwtUtil.getRoleFromToken(token);
                boolean hasPermission = false;
                
                for (UserRole requiredRole : requiredRoles) {
                    if (userRole == requiredRole) {
                        hasPermission = true;
                        break;
                    }
                }
                
                if (!hasPermission) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Insufficient permissions");
                }
            }
            
            return joinPoint.proceed();
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Authentication failed");
        }
    }
} 