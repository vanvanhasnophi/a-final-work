package com.roomx.service.impl;

import com.roomx.entity.User;
import com.roomx.repository.UserRepository;
import com.roomx.service.AuthService;
import com.roomx.utils.JwtUtil;
import com.roomx.utils.PasswordEncoderUtil;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;

@Service
public class AuthServiceImpl implements AuthService {
    private final UserRepository userRepository;

    public AuthServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public Map<String, Object> login(String username, String password) {
        User user = userRepository.findByUsername(username);
        if (user != null && PasswordEncoderUtil.matches(password, user.getPassword())) {
            String token = JwtUtil.generateToken(user.getUsername(), user.getRole().name());
            Map<String, Object> result = new HashMap<>();
            result.put("token", token);
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("id", user.getId());
            userInfo.put("username", user.getUsername());
            userInfo.put("nickname", user.getNickname());
            userInfo.put("role", user.getRole().name());
            result.put("user", userInfo);
            return result;
        }
        return null;
    }

    @Override
    public Map<String, Object> register(UserLoginDTO userLoginDTO, UserInfoDTO userInfoDTO) {
        User user = User.fromDTO(userLoginDTO, userInfoDTO);
        if (user == null) {
            throw new IllegalArgumentException("Invalid user: " + userLoginDTO.getUsername() + " " + userInfoDTO.getRole());
        }
        // 密码加密
        user.setPassword(PasswordEncoderUtil.encode(user.getPassword()));
        userRepository.save(user);
        String token = JwtUtil.generateToken(user.getUsername(), user.getRole().name());
        Map<String, Object> result = new HashMap<>();
        result.put("token", token);
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("id", user.getId());
        userInfo.put("username", user.getUsername());
        userInfo.put("nickname", user.getNickname());
        userInfo.put("role", user.getRole().name());
        result.put("user", userInfo);
        return result;
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