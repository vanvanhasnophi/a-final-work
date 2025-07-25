package com.roomx.service;

import com.roomx.dto.UserLoginDTO;
import com.roomx.dto.UserRegisterDTO;
import com.roomx.dto.UserTokenDTO;  

import org.springframework.stereotype.Service;

@Service
public interface AuthService {
    // 登录业务
    UserTokenDTO login(UserLoginDTO userLoginDTO);
    // 注册业务
    UserTokenDTO register(UserRegisterDTO userRegisterDTO);
    // 退出登录业务
    int logout(String username);
    // 修改密码业务
    int updatePassword(String username, String oldPassword, String newPassword);
    // 删除用户业务
    int deleteUser(UserLoginDTO userLoginDTO);

}
