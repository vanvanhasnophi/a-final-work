package com.roomx.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

import com.roomx.websocket.NotificationWebSocketHandler;

import lombok.extern.slf4j.Slf4j;

@Configuration
@EnableWebSocket
@Slf4j
public class WebSocketConfig implements WebSocketConfigurer {
    
    @Autowired
    private NotificationWebSocketHandler notificationWebSocketHandler;
    
    @Override
    public void registerWebSocketHandlers(@NonNull WebSocketHandlerRegistry registry) {
        log.info("=== 注册WebSocket处理器 === 路径: /ws/notifications");
        
        // 注册WebSocket处理器，支持跨域
        registry.addHandler(notificationWebSocketHandler, "/ws/notifications")
                .setAllowedOrigins("*");  // 在生产环境中应该限制具体的域名
        
        log.info("=== WebSocket处理器注册完成 ===");
    }
}
