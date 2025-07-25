package com.roomx.controller;

import com.roomx.model.entity.User;
import com.roomx.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // 登录接口
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User user) {
        Map<String, Object> result = authService.login(user.getUsername(), user.getPassword());
        if (result == null) {
            return ResponseEntity.status(401).body("用户名或密码错误");
        }
        return ResponseEntity.ok(result);
    }
}
