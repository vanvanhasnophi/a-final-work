package com.roomx.service;

import org.springframework.stereotype.Service;

@Service
public interface AuthService {
    // 登录业务
    String login(String username, String password);
    // 注册业务
    String register(String username, String password);
    // 注销业务
    String logout(String username);
    // 修改密码业务
    String changePassword(String username, String oldPassword, String newPassword);
}
