package com.roomx.service;

import org.springframework.stereotype.Service;

@Service
public interface AuthService {
    // 登录业务
    Map<String, Object> login(String username, String password);
    // 注册业务
    Map<String, Object> register(UserLoginDTO userLoginDTO, UserInfoDTO userInfoDTO);
    // 退出登录业务
    String logout(String username);
    // 修改密码业务
    String updatePassword(String username, String oldPassword, String newPassword);
    // 删除用户业务
    String deleteUser(UserLoginDTO userLoginDTO);

}
