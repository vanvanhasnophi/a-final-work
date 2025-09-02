package com.roomx.service.impl;

import java.util.ArrayList;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.roomx.constant.enums.UserRole;
import com.roomx.model.dto.PageResult;
import com.roomx.model.dto.UserInfoDTO;
import com.roomx.model.dto.UserQuery;
import com.roomx.model.entity.User;
import com.roomx.repository.UserRepository;
import com.roomx.service.UserService;

import jakarta.persistence.criteria.Predicate;


@Service
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;

    public UserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

   
    @Override
    public UserInfoDTO updateUserInfo(Long userId, UserInfoDTO userInfoDTO) {
            if(userInfoDTO == null) throw new IllegalArgumentException("userInfoDTO is null");
            if(!Objects.equals(userInfoDTO.getId(),userId)) throw new IllegalArgumentException("id not match");
            User user=userRepository.findById(userId).orElse(null);
            if(user==null) throw new IllegalArgumentException("user not found");
            if(!Objects.equals(userInfoDTO.getRole(),user.getRole())) throw new IllegalArgumentException("role not match");
            user.setNickname(userInfoDTO.getNickname());
            user.setEmail(userInfoDTO.getEmail());
            user.setPhone(userInfoDTO.getPhone());
            // 根据角色设置相应字段
            if (userInfoDTO.getDepartment() != null) {
                user.setDepartment(userInfoDTO.getDepartment());
            }
            if (userInfoDTO.getPermission() != null) {
                user.setPermission(userInfoDTO.getPermission());
            }
            if (userInfoDTO.getSkill() != null) {
                user.setSkill(userInfoDTO.getSkill());
            }
            if (userInfoDTO.getServiceArea() != null) {
                user.setServiceArea(userInfoDTO.getServiceArea());
            }
            return UserInfoDTO.fromEntity(userRepository.save(user));
        
    }

    @Override
    public UserInfoDTO getUserInfo(Long userId) {
        User user=userRepository.findById(userId).orElse(null);
        if(user==null) throw new IllegalArgumentException("user not found");
        return UserInfoDTO.fromEntity(user);
    }

    @Override
    public PageResult<UserInfoDTO> page(UserQuery query, int pageNum, int pageSize) {
        Specification<User> spec = (root, cq, cb) -> {
            ArrayList<Predicate> predicates = new ArrayList<>();
            
            // 优先使用统一搜索字段，同时搜索用户名和昵称
            if (query.getUser() != null && !query.getUser().isEmpty()) {
                Predicate usernamePredicate = cb.like(root.get("username"), "%" + query.getUser() + "%");
                Predicate nicknamePredicate = cb.like(root.get("nickname"), "%" + query.getUser() + "%");
                predicates.add(cb.or(usernamePredicate, nicknamePredicate));
            } else {
                // 兼容旧的分离搜索字段
                if (query.getUsername() != null && !query.getUsername().isEmpty()) {
                    predicates.add(cb.like(root.get("username"), "%" + query.getUsername() + "%"));
                }
                if (query.getNickname() != null && !query.getNickname().isEmpty()) {
                    predicates.add(cb.like(root.get("nickname"), "%" + query.getNickname() + "%"));
                }
            }
            
            if (query.getEmail() != null && !query.getEmail().isEmpty()) {
                predicates.add(cb.like(root.get("email"), "%" + query.getEmail() + "%"));
            }
            if (query.getPhone() != null && !query.getPhone().isEmpty()) {
                predicates.add(cb.like(root.get("phone"), "%" + query.getPhone() + "%"));
            }
            if (query.getRole() != null) {
                predicates.add(cb.equal(root.get("role"), query.getRole()));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        Pageable pageable = PageRequest.of(pageNum - 1, pageSize);
        Page<User> page = userRepository.findAll(spec, pageable);
        PageResult<UserInfoDTO> result = new PageResult<>();
        result.setRecords(page.getContent().stream().map(UserInfoDTO::fromEntity).collect(Collectors.toList()));
        result.setTotal(page.getTotalElements());
        result.setPageNum(pageNum);
        result.setPageSize(pageSize);
        return result;
    }

    @Override
    public UserInfoDTO getUserInfoByUsername(String username) {
        User user = userRepository.findByUsername(username);
        if(user==null) throw new IllegalArgumentException("user not found");
        return UserInfoDTO.fromEntity(user);
    }
    
    @Override
    public UserRole getUserRoleByUsername(String username) {
        User user = userRepository.findByUsername(username);
        if(user==null) throw new IllegalArgumentException("user not found");
        return user.getRole();
    }
    

    
    @Override
    public boolean isUserExists(String username) {
        return userRepository.findByUsername(username) != null;
    }

} 