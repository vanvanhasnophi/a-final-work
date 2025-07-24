package com.roomx.service;

import com.roomx.entity.User;
import com.roomx.repository.UserRepository;

import apple.security.AppleProvider;

import org.springframework.stereotype.Service;

@Service
public class UserService {
    private final UserRepository userRepository;
    // 可注入其他角色相关Service

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // 统一登录
    public User login(String username, String password) {
        User user = userRepository.findByUsername(username);
        if (user != null && user.getPassword().equals(password)) {
            return user;
        }
        return null;
    }

    // 通用业务
    // 注册
    public User register(User user) {
        return userRepository.save(user);
    }

    // 修改密码
    public User updatePassword(User user, String newPassword) {
        user.setPassword(newPassword);
        return userRepository.save(user);
    }

    // 修改个人信息
    public User updateUserInfo(User user, UserInfo userInfo) {
        user.setNickname(userInfo.getNickname());
        user.setContact(userInfo.getContact());
        
        return userRepository.save(user);
    }

    //  查看个人信息
    public UserInfo getUserInfo(User user) {
        return userRepository.findById(user.getId()).orElse(null);
    }




    // 分角色业务处理
    public String doRoleSpecificAction(User user) {
        switch (user.getRole()) {
            case APPLIER:
                return handleApplierAction(user);
            case APPROVER:
                return handleApproverAction(user);
            case MAINTAINER:
                return handleMaintainerAction(user);
            case SERVICE_STAFF:
                return handleServiceStaffAction(user);
            case ADMIN:
                return handleAdminAction(user);
            default:
                throw new IllegalArgumentException("未知角色");
        }
    }

    // 管理员操作
    // 查询用户列表
    public List<User> getUserList() {
        return userRepository.findAll();
    }

    // 按角色查询用户列表
    public List<User> getUserListByRole(User.Role role) {
        return userRepository.findByRole(role);
    }

    // 新建用户（管理员）
    public void createUser(User user) {
        userRepository.save(user);
    }

    // 新建用户（管理员）
    public void createUser(UserInfo userInfo) {
        User user = new User();
        user.setRole(userInfo.getRole());
        user.setUsername(userInfo.getUsername());
        user.setPassword(userInfo.getPassword());
        user.setNickname(userInfo.getNickname());
        user.setContact(userInfo.getContact());
        // 仅applier
        user.setDepartment(userInfo.getDepartment());
        // 仅maintainer
        user.setSkill(userInfo.getSkill());
        // 仅serviceStaff
        user.setServiceArea(userInfo.getServiceArea());
        // 仅approver
        user.setPermission(userInfo.getPermission());
        userRepository.save(user);
    }

    // 删除用户
    public void deleteUser(User user) {
        userRepository.delete(user);
    }

    // 修改用户信息（管理员）
    public void updateUserInfo(User user, UserInfo userInfo) {
        user.setNickname(userInfo.getNickname());
        user.setContact(userInfo.getContact());
        // 仅applier    
        user.setDepartment(userInfo.getDepartment());
        // 仅maintainer
        user.setSkill(userInfo.getSkill());
        // 仅serviceStaff
        user.setServiceArea(userInfo.getServiceArea());
        // 仅approver
        user.setPermission(userInfo.getPermission());
        userRepository.save(user);
    }

    // 重置密码（管理员）
    public void resetPassword(User user, String newPassword) {
        user.setPassword(newPassword);
        userRepository.save(user);
    }

}
