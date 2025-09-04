package com.roomx.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.roomx.model.dto.UserLoginDTO;
import com.roomx.model.dto.UserRegisterDTO;
import com.roomx.model.dto.UserTokenDTO;
import com.roomx.model.dto.UserUpdatePasswordDTO;
import com.roomx.service.AuthService;
import com.roomx.service.UserSessionService;
import com.roomx.service.impl.AuthServiceImpl;
import com.roomx.utils.EnhancedJwtUtil;
import com.roomx.utils.TokenValidationLogger;

import jakarta.servlet.http.HttpServletRequest;
import lombok.Getter;

@RestController
@RequestMapping("/api")
public class AuthController {
    private final AuthService authService;
    private final UserSessionService userSessionService;
    private final AuthServiceImpl authServiceImpl;

    public AuthController(AuthService authService, UserSessionService userSessionService, AuthServiceImpl authServiceImpl) {
        this.authService = authService;
        this.userSessionService = userSessionService;
        this.authServiceImpl = authServiceImpl;
    }

    // 登录接口
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UserLoginDTO userLoginDTO) {
        try {
            TokenValidationLogger.logTokenGeneration(userLoginDTO.getUsername(), "LOGIN", "Login attempt");
            
            UserTokenDTO userTokenDTO = authService.login(userLoginDTO);
            
            TokenValidationLogger.logTokenGeneration(userLoginDTO.getUsername(), "LOGIN_SUCCESS", "Login successful");
            
            return ResponseEntity.ok(userTokenDTO);
        } catch (Exception e) {
            TokenValidationLogger.logException("Login", e.getMessage(), "Login failed for user: " + userLoginDTO.getUsername());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 注册接口
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody UserRegisterDTO userRegisterDTO) {
        try {
            TokenValidationLogger.logTokenGeneration(userRegisterDTO.getUsername(), "REGISTER", "Register attempt");
            
            UserTokenDTO userTokenDTO = authService.register(userRegisterDTO);
            
            TokenValidationLogger.logTokenGeneration(userRegisterDTO.getUsername(), "REGISTER_SUCCESS", "Register successful");
            
            return ResponseEntity.ok(userTokenDTO);
        } catch (Exception e) {
            TokenValidationLogger.logException("Register", e.getMessage(), "Register failed for user: " + userRegisterDTO.getUsername());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 登出接口
    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestBody UserLoginDTO userLoginDTO) {
        try {
            int result = authService.logout(userLoginDTO.getUsername());
            if (result == 0) {
                return ResponseEntity.ok().body("Logout successful");
            } else {
                return ResponseEntity.badRequest().body("Logout failed");
            }
        } catch (Exception e) {
            TokenValidationLogger.logException("Logout", e.getMessage(), "Logout failed for user: " + userLoginDTO.getUsername());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 会话检查接口
    @GetMapping("/auth/session/check")
    public ResponseEntity<?> checkSession(HttpServletRequest request) {
        try {
            String token = extractTokenFromRequest(request);
            if (token == null) {
                return ResponseEntity.ok().body(new SessionCheckResult(false, "No token provided", false));
            }
            
            AuthServiceImpl.TokenValidationResult validationResult = authServiceImpl.validateTokenAndSession(token);
            
            if (!validationResult.isValid()) {
                return ResponseEntity.ok().body(new SessionCheckResult(false, validationResult.getMessage(), false));
            }
            
            // 检查是否在其他地方登录
            String username = validationResult.getUsername();
            String sessionId = EnhancedJwtUtil.getSessionIdFromToken(token);
            boolean isLoggedInElsewhere = userSessionService.isLoggedInElsewhere(username, sessionId);
            
            return ResponseEntity.ok().body(new SessionCheckResult(true, "Session valid", isLoggedInElsewhere));
            
        } catch (Exception e) {
            TokenValidationLogger.logException("Session check", e.getMessage(), "Session check failed");
            return ResponseEntity.ok().body(new SessionCheckResult(false, "Session check failed: " + e.getMessage(), false));
        }
    }

    // 修改密码接口（需登录，使用当前认证主体）
    @PostMapping("/updatePassword")
    public ResponseEntity<?> updatePassword(@RequestBody UserUpdatePasswordDTO userUpdatePasswordDTO) {
        try {
            // 始终使用当前认证用户，忽略传入的 username，避免前端误传造成驳回
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || authentication.getName() == null) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(Map.of("success", false, "code", "UNAUTHORIZED", "message", "未认证"));
            }
            userUpdatePasswordDTO.setUsername(authentication.getName());
            int result = authService.updatePassword(userUpdatePasswordDTO);
        return switch (result) {
        case 0 -> ResponseEntity.ok(Map.of(
            "success", true,
            "code", "OK",
            "message", "密码更新成功"));
        case 1 -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
            "success", false,
            "code", "USER_NOT_FOUND",
            "message", "用户不存在"));
        case 2 -> ResponseEntity.badRequest().body(Map.of(
            "success", false,
            "code", "OLD_PASSWORD_INCORRECT",
            "message", "旧密码错误"));
        case 3 -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
            "success", false,
            "code", "UNAUTHORIZED",
            "message", "未认证"));
        default -> ResponseEntity.badRequest().body(Map.of(
            "success", false,
            "code", "UPDATE_FAILED",
            "message", "密码更新失败"));
        };
        } catch (Exception e) {
            TokenValidationLogger.logException("Update password", e.getMessage(), 
                "Update password failed for user: " + userUpdatePasswordDTO.getUsername());
        return ResponseEntity.badRequest().body(Map.of(
            "success", false,
            "code", "EXCEPTION",
            "message", e.getMessage()
        ));
        }
    }

    // 危险操作验证接口（需要登录）
    @PostMapping("/auth/dangerous-operation-verify")
    public ResponseEntity<?> dangerousOperationVerify(@RequestBody Map<String, String> request) {
        try {
            // 获取当前认证用户
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || authentication.getName() == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "未认证"));
            }
            
            String username = authentication.getName();
            String password = request.get("password");
            String operation = request.get("operation");
            
            if (password == null || password.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "密码不能为空"));
            }
            
            if (operation == null || operation.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "操作类型不能为空"));
            }
            
            String verificationToken = authService.dangerousOperationVerify(username, password, operation);
            return ResponseEntity.ok().body(Map.of(
                "success", true,
                "verificationToken", verificationToken
            ));
            
        } catch (Exception e) {
            TokenValidationLogger.logException("Dangerous operation verify", e.getMessage(), "Dangerous operation verification failed");
            return ResponseEntity.badRequest()
                .body(Map.of("success", false, "message", "验证失败: " + e.getMessage()));
        }
    }

    // 删除用户接口（ADMIN权限）
    @DeleteMapping("/auth/user/{userId}")
    public ResponseEntity<?> deleteUser(@PathVariable Long userId, @RequestBody Map<String, String> request) {
        try {
            // 验证ADMIN权限
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || authentication.getName() == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "未认证"));
            }
            
            String verificationToken = request.get("verificationToken");
            // 注意：verificationToken可以为空，AuthService会根据是否删除自己来决定是否验证token
            
            authService.deleteUser(userId, verificationToken);
            return ResponseEntity.ok().body(Map.of("success", true, "message", "用户删除成功"));
        } catch (Exception e) {
            TokenValidationLogger.logException("Delete user", e.getMessage(), "Delete user failed for ID: " + userId);
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    private String extractTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    /**
     * 会话检查结果类
     */
    @Getter
    public static class SessionCheckResult {
        private final boolean valid;
        private final String message;
        private final boolean kickedOut;

        public SessionCheckResult(boolean valid, String message, boolean kickedOut) {
            this.valid = valid;
            this.message = message;
            this.kickedOut = kickedOut;
        }

    }
}
