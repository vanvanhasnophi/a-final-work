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
import com.roomx.utils.JwtUtil;
import com.roomx.utils.PasswordEncoderUtil;

@Service
public class AuthServiceImpl implements AuthService {
    private final UserRepository userRepository;

    public AuthServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserTokenDTO login(UserLoginDTO userLoginDTO) {
        User user = userRepository.findByUsername(userLoginDTO.getUsername());
        if (user != null && PasswordEncoderUtil.matches(userLoginDTO.getPassword(), user.getPassword())) {
            String token = JwtUtil.generateToken(user.getUsername(), user.getRole());
            user.setLastLoginTime(userLoginDTO.getLoginTime());
            userRepository.save(user);
            return UserTokenDTO.fromLogin(user, token);
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
                case SERVICE_STAFF : {  
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
            
            // 生成token并返回
            String token = JwtUtil.generateToken(user.getUsername(), user.getRole());
            return UserTokenDTO.fromLogin(user, token);
        }

    @Override
    public int logout(String username) {
        // 退出登录
        // 无效化token
        JwtUtil.invalidateToken(username);
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
        return 0; // 成功
    }

    @Override
    public int deleteUser(UserLoginDTO userLoginDTO) {
        // 无效化token
        JwtUtil.invalidateToken(userLoginDTO.getUsername());
        User user = userRepository.findByUsername(userLoginDTO.getUsername());
        if (user != null) {
            userRepository.delete(user);
            return 0;
        }
        return 1;
    }


}