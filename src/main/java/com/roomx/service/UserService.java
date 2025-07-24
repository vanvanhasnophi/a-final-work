package com.roomx.service;

import com.roomx.entity.User;
import com.roomx.repository.UserRepository;
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

    // 分角色业务处理
    public String doRoleSpecificAction(User user) {
        switch (user.getRole()) {
            case USER:
                return handleUserAction(user);
            case APPROVER:
                return handleApproverAction(user);
            case MAINTAINER:
                return handleMaintainerAction(user);
            case SERVICE_STAFF:
                return handleServiceStaffAction(user);
            default:
                throw new IllegalArgumentException("未知角色");
        }
    }

    private String handleUserAction(User user) {
        // 普通用户业务
        return "用户操作";
    }

    private String handleApproverAction(User user) {
        // 审批人业务
        return "审批人操作";
    }

    private String handleMaintainerAction(User user) {
        // 维护人员业务
        return "维护人员操作";
    }

    private String handleServiceStaffAction(User user) {
        // 服务人员业务
        return "服务人员操作";
    }
}
