package com.roomx.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.roomx.model.dto.UserLoginDTO;
import com.roomx.model.dto.UserRegisterDTO;
import com.roomx.model.dto.UserTokenDTO;
import com.roomx.model.dto.UserUpdatePasswordDTO;
import com.roomx.service.AuthService;


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
        UserTokenDTO result = authService.login(userLoginDTO);
        if (result == null) {
            return ResponseEntity.status(401).body("用户名或密码错误");
        }
        return ResponseEntity.ok(result);
    }

    // 注册接口
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody UserRegisterDTO userRegisterDTO) {
        UserTokenDTO result = authService.register(userRegisterDTO);
        return ResponseEntity.ok(result);
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
    
    // 删除用户接口
    @PostMapping("/deleteUser")
    public ResponseEntity<?> deleteUser(@RequestBody UserLoginDTO userLoginDTO) {
        authService.deleteUser(userLoginDTO);
        return ResponseEntity.ok().build();
    }
}
