package com.roomx.service.impl;

import com.roomx.model.entity.User;
import com.roomx.repository.UserRepository;
import com.roomx.service.AuthService;
import com.roomx.utils.JwtUtil;
import com.roomx.utils.PasswordEncoderUtil;
import com.roomx.model.dto.UserRegisterDTO; 
import com.roomx.model.dto.UserLoginDTO;
import com.roomx.model.dto.UserTokenDTO;
import com.roomx.model.dto.UserUpdatePasswordDTO;
import com.roomx.model.entity.Applier;
import com.roomx.model.entity.Approver;
import com.roomx.model.entity.Maintainer;
import com.roomx.model.entity.ServiceStaff;
import com.roomx.model.entity.Admin;
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
            String token = JwtUtil.generateToken(user.getUsername(), user.getRole());
            user.setLastLoginTime(userLoginDTO.getLoginTime());
            userRepository.save(user);
            return UserTokenDTO.fromLogin(user, token);
        }
        else throw new IllegalArgumentException("Invalid username or password");
    }

        @Override
        public UserTokenDTO register(UserRegisterDTO userRegisterDTO) {
            User user = null;
            user = userRepository.findByUsername(userRegisterDTO.getUsername());
            if(user!=null) throw new IllegalArgumentException("Username already exists");
            // 如果没有指定角色，默认为申请人
            if (userRegisterDTO.getRole() == null) {
                userRegisterDTO.setRole(com.roomx.constant.enums.UserRole.APPLIER);
            }
            
            switch(userRegisterDTO.getRole()){
                case APPLIER : {
                    user = new Applier();
                    ((Applier)user).setDepartment(userRegisterDTO.getDepartment());
                    break;
                }
                case APPROVER : {
                    user = new Approver();
                    ((Approver)user).setPermission(userRegisterDTO.getPermission());
                    break;
                }   
                case MAINTAINER : {
                    user = new Maintainer();
                    ((Maintainer)user).setSkill(userRegisterDTO.getSkill());
                    break;
                }
                case SERVICE_STAFF : {  
                    user = new ServiceStaff();
                    ((ServiceStaff)user).setServiceArea(userRegisterDTO.getServiceArea());
                    break;
                }
                case ADMIN : {
                    user = new Admin(); 
                    break;
                }
                default : {
                    throw new IllegalArgumentException("Invalid user: " + userRegisterDTO.getUsername() + " " + userRegisterDTO.getRole());
                }
            }
            user.setUsername(userRegisterDTO.getUsername());
            user.setPassword(PasswordEncoderUtil.encode(userRegisterDTO.getPassword()));
            user.setNickname(userRegisterDTO.getNickname());
            user.setContact(userRegisterDTO.getContact());
            user.setCreateTime(new Date());
            user.setLastLoginTime(new Date());
            userRepository.save(user);
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