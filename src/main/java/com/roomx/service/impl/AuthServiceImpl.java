package com.roomx.service.impl;

import java.util.Date;

import org.springframework.stereotype.Service;

import com.roomx.constant.enums.UserRole;
import com.roomx.model.dto.UserLoginDTO;
import com.roomx.model.dto.UserRegisterDTO;
import com.roomx.model.dto.UserTokenDTO;
import com.roomx.model.dto.UserUpdatePasswordDTO;
import com.roomx.model.entity.User;
import com.roomx.repository.UserRepository;
import com.roomx.service.AuthService;
import com.roomx.service.UserSessionService;
import com.roomx.utils.EnhancedJwtUtil;
import com.roomx.utils.PasswordEncoderUtil;

@Service
public class AuthServiceImpl implements AuthService {
    private final UserRepository userRepository;
    private final UserSessionService userSessionService;

    public AuthServiceImpl(UserRepository userRepository, UserSessionService userSessionService) {
        this.userRepository = userRepository;
        this.userSessionService = userSessionService;
    }

    @Override
    public UserTokenDTO login(UserLoginDTO userLoginDTO) {
        User user = userRepository.findByUsername(userLoginDTO.getUsername());
        if (user != null && PasswordEncoderUtil.matches(userLoginDTO.getPassword(), user.getPassword())) {
            // 生成新的会话ID
            String sessionId = userSessionService.generateSessionId(user.getUsername());
            
            // 使用增强的JWT工具生成包含会话ID的token
            String token = EnhancedJwtUtil.generateToken(user.getUsername(), user.getRole(), sessionId);
            
            // 更新用户最后登录时间
            Date loginTime = userLoginDTO.getLoginTime();
            if (loginTime == null) {
                loginTime = new Date(); // 如果前端没有发送时间，使用当前时间
            }
            user.setLastLoginTime(loginTime);
            userRepository.save(user);
            
            return UserTokenDTO.fromLogin(user, token, sessionId);
        }
        else throw new IllegalArgumentException("Invalid username or password");
    }

    @Override
    public UserTokenDTO register(UserRegisterDTO userRegisterDTO) {
        // 检查用户名是否已存在
        User existingUser = userRepository.findByUsername(userRegisterDTO.getUsername());
        if(existingUser != null) {
            throw new IllegalArgumentException("Username already exists");
        }
        
        // 创建新用户
        User user = new User();
        
        // 设置基本信息
        user.setUsername(userRegisterDTO.getUsername());
        user.setPassword(PasswordEncoderUtil.encode(userRegisterDTO.getPassword()));
        user.setNickname(userRegisterDTO.getNickname());
        user.setEmail(userRegisterDTO.getEmail());
        user.setPhone(userRegisterDTO.getPhone());
        user.setCreateTime(new Date());
        user.setLastLoginTime(new Date());
        
        // 设置角色和相关信息
        UserRole role = userRegisterDTO.getRole();
        if (role == null) {
            role = com.roomx.constant.enums.UserRole.APPLIER;
        }
        user.setRole(role);

        // 根据角色设置特定信息
        switch(role){
            case APPLIER : {
                user.setDepartment(userRegisterDTO.getDepartment());
                user.setPermission(null);
                user.setSkill(null);
                user.setServiceArea(null);
                break;
            }
            case APPROVER : {
                user.setPermission(userRegisterDTO.getPermission());
                user.setDepartment(null);
                user.setSkill(null);
                user.setServiceArea(null);
                break;
            }   
            case MAINTAINER : {
                user.setSkill(userRegisterDTO.getSkill());
                user.setDepartment(null);
                user.setPermission(null);
                user.setServiceArea(null);
                break;
            }
            case SERVICE : {  
                user.setServiceArea(userRegisterDTO.getServiceArea());
                user.setDepartment(null);
                user.setPermission(null);
                user.setSkill(null);
                break;
            }
            case ADMIN : {
                user.setDepartment(null);
                user.setPermission(null);
                user.setSkill(null);
                user.setServiceArea(null);
                break;
            }
            default : {
                throw new IllegalArgumentException("Invalid user role: " + userRegisterDTO.getRole());
            }
        }
        
        // 保存用户
        userRepository.save(user);
        
        // 生成会话ID和token
        String sessionId = userSessionService.generateSessionId(user.getUsername());
        String token = EnhancedJwtUtil.generateToken(user.getUsername(), user.getRole(), sessionId);
        
        return UserTokenDTO.fromLogin(user, token, sessionId);
    }

    @Override
    public int logout(String username) {
        // 使会话失效
        userSessionService.invalidateSession(username);
        return 0;
    }

    @Override
    public int updatePassword(UserUpdatePasswordDTO userUpdatePasswordDTO) {
        User user = userRepository.findByUsername(userUpdatePasswordDTO.getUsername());
        if (user == null) {
            return 1; // 用户不存在
        }
        if (!PasswordEncoderUtil.matches(userUpdatePasswordDTO.getOldPassword(), user.getPassword())) {
            return 2; // 旧密码错误
        }
        user.setPassword(PasswordEncoderUtil.encode(userUpdatePasswordDTO.getNewPassword()));
        userRepository.save(user);
        
        // 密码更新后，使所有会话失效，强制重新登录
        userSessionService.invalidateSession(user.getUsername());
        
        return 0; // 成功
    }

    @Override
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            throw new IllegalArgumentException("用户不存在");
        }
        
        // 检查是否为最后一个ADMIN用户
        if (user.getRole() == UserRole.ADMIN) {
            long adminCount = userRepository.countByRole(UserRole.ADMIN);
            if (adminCount <= 1) {
                throw new IllegalArgumentException("不能删除最后一个管理员用户");
            }
        }
        
        // 使会话失效
        userSessionService.invalidateSession(user.getUsername());
        
        // 删除用户
        userRepository.delete(user);
    }

    /**
     * 验证token和会话是否有效
     * @param token JWT token
     * @return 验证结果
     */
    public TokenValidationResult validateTokenAndSession(String token) {
        try {
            // 验证token格式和签名
            if (!EnhancedJwtUtil.validateToken(token)) {
                return new TokenValidationResult(false, "Token格式无效", null, null);
            }
            
            // 从token中获取用户信息
            String username = EnhancedJwtUtil.getUsernameFromToken(token);
            String sessionId = EnhancedJwtUtil.getSessionIdFromToken(token);
            UserRole role = EnhancedJwtUtil.getRoleFromToken(token);
            
            if (username == null || sessionId == null) {
                return new TokenValidationResult(false, "Token缺少必要信息", null, null);
            }
            
            // 验证会话是否有效
            if (!userSessionService.validateSession(username, sessionId)) {
                return new TokenValidationResult(false, "会话已失效，请重新登录", username, role);
            }
            
            // 检查是否在其他地方登录
            if (userSessionService.isLoggedInElsewhere(username, sessionId)) {
                return new TokenValidationResult(false, "账号在其他地方登录，当前会话已失效", username, role);
            }
            
            return new TokenValidationResult(true, "验证成功", username, role);
            
        } catch (Exception e) {
            return new TokenValidationResult(false, "Token验证失败: " + e.getMessage(), null, null);
        }
    }

    /**
     * Token验证结果类
     */
    public static class TokenValidationResult {
        private final boolean valid;
        private final String message;
        private final String username;
        private final UserRole role;

        public TokenValidationResult(boolean valid, String message, String username, UserRole role) {
            this.valid = valid;
            this.message = message;
            this.username = username;
            this.role = role;
        }

        public boolean isValid() {
            return valid;
        }

        public String getMessage() {
            return message;
        }

        public String getUsername() {
            return username;
        }

        public UserRole getRole() {
            return role;
        }
    }
}