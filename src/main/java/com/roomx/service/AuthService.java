package com.roomx.service;

import com.roomx.model.dto.UserLoginDTO;
import com.roomx.model.dto.UserRegisterDTO;
import com.roomx.model.dto.UserTokenDTO;
import com.roomx.model.dto.UserUpdatePasswordDTO;  

public interface AuthService {
    // 登录业务
    UserTokenDTO login(UserLoginDTO userLoginDTO);
    // 注册业务
    UserTokenDTO register(UserRegisterDTO userRegisterDTO);
    // 退出登录业务
    int logout(String username);
    // 修改密码业务
    int updatePassword(UserUpdatePasswordDTO userUpdatePasswordDTO);
    // 删除用户业务
    void deleteUser(Long userId);

}
