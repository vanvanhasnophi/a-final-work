package com.roomx.service;

import com.roomx.entity.User;
import java.util.List;

public interface UserService {
    User updateUserInfo(User user, Object userInfo); // 具体类型可替换
    Object getUserInfo(User user); // 具体类型可替换
    List<User> getUserList();
    List<User> getUserListByRole(User.Role role);
    // 其他业务方法...
}
