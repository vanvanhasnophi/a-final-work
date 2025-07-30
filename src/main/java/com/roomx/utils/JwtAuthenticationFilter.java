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
        // 跳过登录和注册请求的JWT验证
        String requestURI = request.getRequestURI();
        if (requestURI.equals("/api/login") || requestURI.equals("/api/register")) {
            chain.doFilter(request, response);
            return;
        }
        
        String header = request.getHeader("Authorization");
        logger.debug("JWT Filter - Request URI: {}, Authorization header: {}", requestURI, header);
        
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            try {
                logger.debug("JWT Filter - Parsing token: {}", token.substring(0, Math.min(50, token.length())) + "...");
                Claims claims = JwtUtil.parseToken(token);
                String username = claims.getSubject();
                Object roleObj = claims.get("role");
                logger.debug("JWT Filter - Parsed claims - username: {}, role: {}", username, roleObj);
                
                // 处理角色转换
                UserRole role = null;
                if (roleObj instanceof String) {
                    try {
                        role = UserRole.valueOf((String) roleObj);
                    } catch (IllegalArgumentException e) {
                        logger.warn("JWT Filter - Invalid role string: {}", roleObj);
                    }
                } else if (roleObj instanceof UserRole) {
                    role = (UserRole) roleObj;
                }
                
                if (username != null) {
                    UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(username, null, Collections.emptyList());
                    SecurityContextHolder.getContext().setAuthentication(auth);
                    logger.debug("JWT Filter - Authentication set for user: {}", username);
                } else {
                    logger.warn("JWT Filter - Username is null from token");
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    return;
                }
            } catch (Exception e) {
                logger.error("JWT Filter - Token validation failed: {}", e.getMessage());
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                return;
            }
        } else {
            logger.debug("JWT Filter - No valid Authorization header found");
        }
        
        chain.doFilter(request, response);
    }
} 