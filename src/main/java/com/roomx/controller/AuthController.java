package com.roomx.controller;

import lombok.Getter;
import org.springframework.http.ResponseEntity;
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

    // 修改密码接口
    @PostMapping("/updatePassword")
    public ResponseEntity<?> updatePassword(@RequestBody UserUpdatePasswordDTO userUpdatePasswordDTO) {
        try {
            int result = authService.updatePassword(userUpdatePasswordDTO);
            return switch (result) {
                case 0 -> ResponseEntity.ok().body("Password updated successfully");
                case 1 -> ResponseEntity.badRequest().body("User not found");
                case 2 -> ResponseEntity.badRequest().body("Old password is incorrect");
                default -> ResponseEntity.badRequest().body("Update password failed");
            };
        } catch (Exception e) {
            TokenValidationLogger.logException("Update password", e.getMessage(), 
                "Update password failed for user: " + userUpdatePasswordDTO.getUsername());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 删除用户接口（ADMIN权限）
    @DeleteMapping("/auth/user/{userId}")
    public ResponseEntity<?> deleteUser(@PathVariable Long userId) {
        try {
            authService.deleteUser(userId);
            return ResponseEntity.ok().body("User deleted successfully");
        } catch (Exception e) {
            TokenValidationLogger.logException("Delete user", e.getMessage(), "Delete user failed for ID: " + userId);
            return ResponseEntity.badRequest().body(e.getMessage());
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
