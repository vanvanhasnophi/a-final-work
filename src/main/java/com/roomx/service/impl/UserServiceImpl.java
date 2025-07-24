package com.roomx.service.impl;

import com.roomx.entity.User;
import com.roomx.repository.UserRepository;
import com.roomx.service.UserService;
import com.roomx.util.PasswordEncoderUtil;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;

    public UserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

   
    @Override
    public User updateUserInfo(User user, Object userInfo) {
        // 具体实现
        return userRepository.save(user);
    }

    @Override
    public Object getUserInfo(User user) {
        return userRepository.findById(user.getId()).orElse(null);
    }

    @Override
    public List<User> getUserList() {
        return userRepository.findAll();
    }

    @Override
    public List<User> getUserListByRole(User.Role role) {
        return userRepository.findByRole(role);
    }


} 