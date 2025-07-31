package com.roomx.controller;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.roomx.model.dto.UserInfoDTO;
import com.roomx.service.UserService;


@RestController
@RequestMapping("/api/user")
public class UserController {
    private final UserService userService;
    // 构造器注入
    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

    
    @PutMapping("/{id}") // 更新用户
    public ResponseEntity<UserInfoDTO> update(@PathVariable Long id, @RequestBody UserInfoDTO userInfoDTO) {
        return ResponseEntity.ok(userService.updateUserInfo(id, userInfoDTO));
    }


    @GetMapping("/{id}") // 获取用户详情
    public ResponseEntity<UserInfoDTO> get(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserInfo(id));
    }

    @GetMapping("/me") // 获取当前登录用户信息
    public ResponseEntity<UserInfoDTO> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = (String) auth.getPrincipal();
        UserInfoDTO user = userService.getUserInfoByUsername(username);
        return ResponseEntity.ok(user);
    }


    
}
