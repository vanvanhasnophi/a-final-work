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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.roomx.annotation.RequireAuth;
import com.roomx.constant.enums.UserRole;
import com.roomx.model.dto.PageResult;
import com.roomx.model.dto.UserInfoDTO;
import com.roomx.model.dto.UserQuery;
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
    @RequireAuth(roles = {UserRole.ADMIN, UserRole.APPLIER, UserRole.APPROVER, UserRole.SERVICE, UserRole.MAINTAINER})
    public ResponseEntity<UserInfoDTO> update(@PathVariable Long id, @RequestBody UserInfoDTO userInfoDTO) {
        return ResponseEntity.ok(userService.updateUserInfo(id, userInfoDTO));
    }


    @GetMapping("/{id}") // 获取用户详情
    @RequireAuth(roles = {UserRole.ADMIN, UserRole.APPROVER})
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

    @GetMapping("/list") // 获取用户列表 - 仅管理员可用
    @RequireAuth(roles = {UserRole.ADMIN})
    public ResponseEntity<PageResult<UserInfoDTO>> getUserList(
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String nickname,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) UserRole role) {
        
        UserQuery query = new UserQuery();
        query.setUsername(username);
        query.setNickname(nickname);
        query.setEmail(email);
        query.setPhone(phone);
        query.setRole(role);
        
        PageResult<UserInfoDTO> result = userService.page(query, pageNum, pageSize);
        return ResponseEntity.ok(result);
    }



    
}
