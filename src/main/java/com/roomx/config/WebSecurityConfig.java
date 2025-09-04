package com.roomx.config;

// (CORS bean moved to CorsConfig to avoid duplicate bean names)

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.csrf.XorCsrfTokenRequestAttributeHandler;

import com.roomx.service.impl.AuthServiceImpl;
import com.roomx.utils.JwtAuthenticationFilter;

@Configuration
public class WebSecurityConfig {

    @Value("${security.csrf.enabled:true}")
    private boolean csrfEnabled;
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, AuthServiceImpl authService) throws Exception {
        // CSRF 配置：支持通过 security.csrf.enabled 切换，使用 Cookie 方式传递令牌
        if (csrfEnabled) {
            // 允许前端 JS 读取 XSRF-TOKEN Cookie，前端需回传 X-XSRF-TOKEN 头
            var tokenRepository = CookieCsrfTokenRepository.withHttpOnlyFalse();
            // Spring Security 6 推荐使用 CsrfTokenRequestAttributeHandler / XorCsrfTokenRequestAttributeHandler
            CsrfTokenRequestAttributeHandler requestHandler = new XorCsrfTokenRequestAttributeHandler();
            requestHandler.setCsrfRequestAttributeName("_csrf");
            http.csrf(csrf -> {
                csrf.csrfTokenRepository(tokenRepository)
                    .csrfTokenRequestHandler(requestHandler)
                    // 对所有 /api/** 走 JWT，统一跳过 CSRF，避免前端 403
                    .ignoringRequestMatchers("/api/**")
                    // WebSocket连接跳过CSRF
                    .ignoringRequestMatchers("/ws/**")
                    // 以及静态与预检
                    .ignoringRequestMatchers("/static/**", "/", "/index.html")
                    .ignoringRequestMatchers(request -> HttpMethod.OPTIONS.matches(request.getMethod()));
            });
        } else {
            http.csrf(AbstractHttpConfigurer::disable);
        }

        http
            .cors(cors -> {})
            .authorizeHttpRequests(authz -> authz
                .requestMatchers(
                    "/api/login", "/api/register",
                    "/api/test", "/api/health", "/api/health/**", "/api/csrf",
                    "/ws/**"  // 允许WebSocket连接
                ).permitAll()
                .requestMatchers("/api/**").authenticated()
                .anyRequest().authenticated()
            )
            .addFilterBefore(new JwtAuthenticationFilter(authService), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    // CORS 配置由 CorsConfig 提供，避免 corsConfigurationSource Bean 重复
}
