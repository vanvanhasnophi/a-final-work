package com.roomx.websocket;

import java.io.IOException;
import java.net.URI;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.roomx.service.impl.AuthServiceImpl;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class NotificationWebSocketHandler extends TextWebSocketHandler {
    
    @Autowired
    private AuthServiceImpl authService;
    
    // 存储用户ID与WebSocket会话的映射
    private final Map<Long, WebSocketSession> userSessions = new ConcurrentHashMap<>();
    
    // 存储会话ID与用户ID的映射
    private final Map<String, Long> sessionUserMap = new ConcurrentHashMap<>();
    
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void afterConnectionEstablished(@NonNull WebSocketSession session) throws Exception {
        String sessionId = session.getId();
        String remoteAddress = "unknown";
        try {
            var addr = session.getRemoteAddress();
            if (addr != null) {
                remoteAddress = addr.toString();
            }
        } catch (Exception e) {
            log.debug("无法获取远程地址: {}", e.getMessage());
        }
        
        log.info("=== WebSocket连接建立 === sessionId={}, remoteAddress={}, uri={}", 
                sessionId, remoteAddress, session.getUri());
        
        try {
            // 1. 从查询参数中获取JWT token
            String token = extractTokenFromSession(session);
            if (token == null) {
                log.warn("=== WebSocket连接失败：缺少认证token === sessionId={}", sessionId);
                sendMessage(session, new WebSocketMessage("ERROR", "认证失败：缺少token"));
                session.close();
                return;
            }
            
            // 2. 使用现有的JWT认证服务验证token
            AuthServiceImpl.TokenValidationResult validationResult = authService.validateTokenAndSession(token);
            if (!validationResult.isValid()) {
                log.warn("=== WebSocket连接失败：token验证失败 === sessionId={}, error={}", 
                        sessionId, validationResult.getMessage());
                sendMessage(session, new WebSocketMessage("ERROR", "认证失败：" + validationResult.getMessage()));
                session.close();
                return;
            }
            
            // 3. 获取认证用户的ID
            String username = validationResult.getUsername();
            Long userIdLong = getUserIdByUsername(username);
            if (userIdLong == null) {
                log.warn("=== WebSocket连接失败：无法获取用户ID === sessionId={}, username={}", 
                        sessionId, username);
                sendMessage(session, new WebSocketMessage("ERROR", "认证失败：用户不存在"));
                session.close();
                return;
            }
            
            // 4. 建立连接映射
            userSessions.put(userIdLong, session);
            sessionUserMap.put(sessionId, userIdLong);
            log.info("=== 用户WebSocket连接建立成功 === userId={}, username={}, sessionId={}, 当前连接数={}", 
                    userIdLong, username, sessionId, userSessions.size());
            
            // 5. 发送连接确认消息
            sendMessage(session, new WebSocketMessage("CONNECTION_ESTABLISHED", "WebSocket连接已建立"));
            log.debug("连接确认消息已发送给用户: userId={}, username={}", userIdLong, username);
            
        } catch (Exception e) {
            log.error("=== WebSocket连接建立过程中发生异常 === sessionId={}, error={}", 
                    sessionId, e.getMessage(), e);
            try {
                sendMessage(session, new WebSocketMessage("ERROR", "连接建立失败"));
                session.close();
            } catch (Exception closeEx) {
                log.error("关闭WebSocket连接时发生异常: {}", closeEx.getMessage());
            }
        }
    }

    @Override
    protected void handleTextMessage(@NonNull WebSocketSession session, @NonNull TextMessage message) throws Exception {
        String payload = message.getPayload();
        log.debug("收到WebSocket消息: sessionId={}, message={}", session.getId(), payload);
        
        // 这里可以处理客户端发送的消息，比如心跳检测
        if ("ping".equals(payload)) {
            sendMessage(session, new WebSocketMessage("PONG", "pong"));
        }
    }

    @Override
    public void afterConnectionClosed(@NonNull WebSocketSession session, @NonNull CloseStatus status) throws Exception {
        String sessionId = session.getId();
        Long userId = sessionUserMap.remove(sessionId);
        if (userId != null) {
            userSessions.remove(userId);
            log.info("=== 用户WebSocket连接关闭 === userId={}, sessionId={}, status={}, 当前连接数={}", 
                    userId, sessionId, status, userSessions.size());
        } else {
            log.info("=== WebSocket连接关闭 === sessionId={}, status={}", sessionId, status);
        }
    }

    @Override
    public void handleTransportError(@NonNull WebSocketSession session, @NonNull Throwable exception) throws Exception {
        String sessionId = session.getId();
        Long userId = sessionUserMap.get(sessionId);
        log.error("=== WebSocket传输错误 === userId={}, sessionId={}, error={}", 
                userId, sessionId, exception.getMessage(), exception);
        
        // 清理连接
        if (userId != null) {
            sessionUserMap.remove(sessionId);
            userSessions.remove(userId);
            log.info("已清理错误连接: userId={}, sessionId={}, 当前连接数={}", 
                    userId, sessionId, userSessions.size());
        }
    }

    /**
     * 向指定用户发送通知
     */
    public void sendNotificationToUser(Long userId, Object notification) {
        WebSocketSession session = userSessions.get(userId);
        if (session != null && session.isOpen()) {
            try {
                WebSocketMessage message = new WebSocketMessage("NEW_NOTIFICATION", notification);
                sendMessage(session, message);
                log.info("通知发送成功: userId={}, notification={}", userId, notification);
            } catch (Exception e) {
                log.error("发送通知失败: userId={}, error={}", userId, e.getMessage(), e);
            }
        } else {
            log.debug("用户不在线或会话已关闭，无法发送通知: userId={}", userId);
        }
    }

    /**
     * 向所有在线用户广播消息
     */
    public void broadcastMessage(Object message) {
        WebSocketMessage wsMessage = new WebSocketMessage("BROADCAST", message);
        userSessions.values().forEach(session -> {
            if (session.isOpen()) {
                try {
                    sendMessage(session, wsMessage);
                } catch (Exception e) {
                    log.error("广播消息失败: sessionId={}, error={}", session.getId(), e.getMessage());
                }
            }
        });
        log.info("消息广播完成，发送给 {} 个用户", userSessions.size());
    }

    /**
     * 获取在线用户数量
     */
    public int getOnlineUserCount() {
        return userSessions.size();
    }

    private void sendMessage(WebSocketSession session, WebSocketMessage message) throws IOException {
        String jsonMessage = objectMapper.writeValueAsString(message);
        session.sendMessage(new TextMessage(jsonMessage));
    }

    /**
     * 从WebSocket连接中提取JWT token
     */
    private String extractTokenFromSession(WebSocketSession session) {
        try {
            URI uri = session.getUri();
            if (uri == null) {
                return null;
            }
            
            String query = uri.getQuery();
            if (query == null) {
                return null;
            }
            
            String[] params = query.split("&");
            for (String param : params) {
                if (param.startsWith("token=")) {
                    return param.substring("token=".length());
                }
            }
        } catch (Exception e) {
            log.error("解析JWT token失败", e);
        }
        return null;
    }
    
    /**
     * 根据用户名获取用户ID
     * 这里应该调用用户服务来获取用户ID，暂时使用简单的映射逻辑
     */
    private Long getUserIdByUsername(String username) {
        // TODO: 这里应该调用UserService来获取用户ID
        // 暂时使用简单的映射逻辑，实际项目中应该从数据库查询
        try {
            // 如果用户名是admin，返回ID 1，否则尝试解析为数字
            if ("admin".equals(username)) {
                return 1L;
            }
            // 尝试直接解析用户名为数字ID（临时方案）
            return Long.parseLong(username);
        } catch (NumberFormatException e) {
            log.warn("无法从用户名获取用户ID: {}", username);
            return null;
        }
    }

    /**
     * WebSocket消息格式
     */
    public static class WebSocketMessage {
        private String type;
        private Object data;
        private long timestamp;

        public WebSocketMessage() {}

        public WebSocketMessage(String type, Object data) {
            this.type = type;
            this.data = data;
            this.timestamp = System.currentTimeMillis();
        }

        // Getters and Setters
        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public Object getData() {
            return data;
        }

        public void setData(Object data) {
            this.data = data;
        }

        public long getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(long timestamp) {
            this.timestamp = timestamp;
        }
    }
}
