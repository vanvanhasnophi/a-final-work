package com.roomx.service.impl;

import com.roomx.entity.User;
import com.roomx.repository.UserRepository;
import com.roomx.service.AuthService;
import com.roomx.utils.JwtUtil;
import com.roomx.utils.PasswordEncoderUtil;
import com.roomx.model.dto.UserRegisterDTO; 
import com.roomx.model.dto.UserLoginDTO;
import com.roomx.model.dto.UserTokenDTO;
import org.springframework.stereotype.Service;
import java.util.Date;

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
            String token = JwtUtil.generateToken(user.getUsername(), user.getRole().name());
            user.setLastLoginTime(userLoginDTO.getLoginTime());
            userRepository.save(user);
            return UserTokenDTO.fromLogin(user, token);
        }
        else throw new IllegalArgumentException("Invalid username or password");
    }

        @Override
        public UserTokenDTO register(UserRegisterDTO userRegisterDTO) {
        User user = UserRegisterDTO.toEntity(userRegisterDTO);
        if (user == null) {
            throw new IllegalArgumentException("Invalid user: " + userRegisterDTO.getUsername() + " " + userRegisterDTO.getRole());
        }
        // 密码加密
        user.setPassword(PasswordEncoderUtil.encode(user.getPassword()));
        user.setCreateTime(new Date());
        user.setLastLoginTime(new Date());
        userRepository.save(user);
        String token = JwtUtil.generateToken(user.getUsername(), user.getRole().name());
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
    public int updatePassword(String username, String oldPassword, String newPassword) {
        User user = userRepository.findByUsername(username);
        if (user == null) {
            return 1; // 用户不存在
        }
        if (!PasswordEncoderUtil.matches(oldPassword, user.getPassword())) {
            return 2; // 旧密码错误
        }
        user.setPassword(PasswordEncoderUtil.encode(newPassword));
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