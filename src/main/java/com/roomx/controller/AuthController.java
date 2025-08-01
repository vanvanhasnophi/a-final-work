package com.roomx.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
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
import com.roomx.utils.TokenValidationLogger;


@RestController
@RequestMapping("/api")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // 登录接口
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UserLoginDTO userLoginDTO) {
        try {
            TokenValidationLogger.logValidationStart("/api/login", "N/A", "Login request");
            UserTokenDTO result = authService.login(userLoginDTO);
            if (result == null) {
                TokenValidationLogger.logValidationComplete("/api/login", false, "Login failed - invalid credentials");
                return ResponseEntity.status(401).body("用户名或密码错误");
            }
            TokenValidationLogger.logValidationComplete("/api/login", true, "Login successful for user: " + userLoginDTO.getUsername());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            TokenValidationLogger.logException("Login", e.getMessage(), "Login failed for user: " + userLoginDTO.getUsername());
            return ResponseEntity.status(500).body("登录失败: " + e.getMessage());
        }
    }

    // 注册接口
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody UserRegisterDTO userRegisterDTO) {
        try {
            TokenValidationLogger.logValidationStart("/api/register", "N/A", "Register request");
            UserTokenDTO result = authService.register(userRegisterDTO);
            TokenValidationLogger.logValidationComplete("/api/register", true, "Register successful for user: " + userRegisterDTO.getUsername());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            TokenValidationLogger.logException("Register", e.getMessage(), "Register failed for user: " + userRegisterDTO.getUsername());
            return ResponseEntity.status(500).body("注册失败: " + e.getMessage());
        }
    }

    // 登出接口
    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestBody UserLoginDTO userLoginDTO) {
        authService.logout(userLoginDTO.getUsername());
        return ResponseEntity.ok().build();
    }

    // 更新密码接口
    @PostMapping("/updatePassword")
    public ResponseEntity<?> updatePassword(@RequestBody UserUpdatePasswordDTO userUpdatePasswordDTO) {
        int result = authService.updatePassword(userUpdatePasswordDTO);
        if (result == 0) {
            return ResponseEntity.ok().build();
        } else if (result == 1) {
            return ResponseEntity.status(401).body("用户不存在");
        } else if (result == 2) {
            return ResponseEntity.status(401).body("旧密码错误");
        } else {
            return ResponseEntity.status(500).body("更新密码失败");
        }
    }
    
    // 删除用户接口（ADMIN权限）
    @DeleteMapping("/auth/user/{userId}")
    public ResponseEntity<?> deleteUser(@PathVariable Long userId) {
        try {
            authService.deleteUser(userId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(500).body("删除用户失败: " + e.getMessage());
        }
    }
}
