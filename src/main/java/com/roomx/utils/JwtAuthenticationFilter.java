package com.roomx.utils;

import java.io.IOException;
import java.util.Collections;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import com.roomx.constant.enums.UserRole;
import com.roomx.service.impl.AuthServiceImpl;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    
    private final AuthServiceImpl authService;
    
    public JwtAuthenticationFilter(AuthServiceImpl authService) {
        this.authService = authService;
    }
    
    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain chain)
            throws ServletException, IOException {
        long startTime = System.currentTimeMillis();
        String requestURI = request.getRequestURI();
        String clientIP = getClientIP(request);
        String userAgent = request.getHeader("User-Agent");
        
        // 记录token验证开始
        TokenValidationLogger.logValidationStart(requestURI, clientIP, userAgent);
        
        // 跳过无需认证的端点
        if (requestURI.equals("/api/login") || requestURI.equals("/api/register") || requestURI.equals("/api/csrf")) {
            TokenValidationLogger.logValidationSkipped(requestURI, "Public auth endpoint");
            chain.doFilter(request, response);
            return;
        }
        
        // 注意：WebSocket连接需要认证，不应该跳过！
        // WebSocket握手会通过查询参数或header传递token进行认证
        
        // 跳过静态资源和健康检查
        if (requestURI.startsWith("/static/") || requestURI.equals("/health") || requestURI.equals("/api/health")) {
            TokenValidationLogger.logValidationSkipped(requestURI, "Static resource or health check");
            chain.doFilter(request, response);
            return;
        }        try {
            // 从请求头获取token
            String token = extractTokenFromRequest(request);
            
            if (token == null) {
                // 对于需要认证的端点，没有 token 直接返回 401
                logger.debug("No token found in request: {}", requestURI);
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"error\":\"未认证，请登录\"}");
                return;
            }
            
            // 使用增强的验证机制
            AuthServiceImpl.TokenValidationResult validationResult = authService.validateTokenAndSession(token);
            
            if (!validationResult.isValid()) {
                logger.warn("Token validation failed for {}: {}", requestURI, validationResult.getMessage());
                TokenValidationLogger.logValidationFailed(requestURI, validationResult.getMessage());
                
                // 根据不同的错误类型返回不同的错误信息
                String errorMessage = getErrorMessage(validationResult);

                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"error\":\"" + errorMessage + "\"}");
                return;
            }
            
            // 验证成功，设置认证信息
            String username = validationResult.getUsername();
            UserRole role = validationResult.getRole();
            
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                username, null, Collections.singletonList(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + role.name()))
            );
            
            SecurityContextHolder.getContext().setAuthentication(authentication);
            
            long endTime = System.currentTimeMillis();
            TokenValidationLogger.logValidationSuccess(requestURI, username, endTime - startTime);
            
            logger.debug("Token validation successful for user: {} on URI: {}", username, requestURI);
            
        } catch (Exception e) {
            logger.error("Error during token validation for {}: {}", requestURI, e.getMessage());
            TokenValidationLogger.logException("Token validation", e.getMessage(), 
                "Error during token validation for: " + requestURI);
        }
        
        chain.doFilter(request, response);
    }

    private static String getErrorMessage(AuthServiceImpl.TokenValidationResult validationResult) {
        String errorMessage;
        if (validationResult.getMessage().contains("会话已失效") ||
            validationResult.getMessage().contains("其他地方登录")) {
            errorMessage = "您的账号在其他地方登录，当前会话已失效";
        } else if (validationResult.getMessage().contains("Token已过期") ||
                  validationResult.getMessage().contains("登录已过期")) {
            errorMessage = "登录已过期，请重新登录";
        } else {
            errorMessage = "登录状态异常，请重新登录";
        }
        return errorMessage;
    }

    private String extractTokenFromRequest(HttpServletRequest request) {
        // 首先尝试从Authorization头获取token（用于普通API请求）
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        
        // 对于WebSocket连接，尝试从查询参数获取token
        String queryToken = request.getParameter("token");
        if (queryToken != null && !queryToken.trim().isEmpty()) {
            return queryToken.trim();
        }
        
        return null;
    }
    
    private String getClientIP(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            return xForwardedFor.split(",")[0];
        }
        String xRealIP = request.getHeader("X-Real-IP");
        if (xRealIP != null && !xRealIP.isEmpty() && !"unknown".equalsIgnoreCase(xRealIP)) {
            return xRealIP;
        }
        return request.getRemoteAddr();
    }
} 