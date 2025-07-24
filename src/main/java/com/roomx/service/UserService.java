package com.roomx.service;

import com.roomx.entity.User;
import java.util.List;

public interface UserService {
    User login(String username, String password);
    User register(User user);
    User updatePassword(User user, String newPassword);
    User updateUserInfo(User user, Object userInfo); // 具体类型可替换
    Object getUserInfo(User user); // 具体类型可替换
    List<User> getUserList();
    List<User> getUserListByRole(User.Role role);
    void createUser(User user);
    void deleteUser(User user);
    void resetPassword(User user, String newPassword);
    // 其他业务方法...
}
