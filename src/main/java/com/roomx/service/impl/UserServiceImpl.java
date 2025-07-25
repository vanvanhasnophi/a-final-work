package com.roomx.service.impl;

import com.roomx.entity.User;
import com.roomx.repository.UserRepository;
import com.roomx.service.UserService;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;
import com.roomx.model.dto.UserInfoDTO;
import com.roomx.enums.UserRole;
import com.roomx.enums.ApproverPermission;
import java.util.Objects;   
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import javax.persistence.criteria.Predicate;
import java.util.ArrayList;
import com.roomx.model.dto.PageResult;
import com.roomx.model.dto.UserQuery;

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
            user.setContact(userInfoDTO.getContact());
            switch(user.getRole()) {
                case APPLIER:
                    user.setDepartment(userInfoDTO.getDepartment());
                    break;
                case APPROVER:
                    user.setPermission(userInfoDTO.getPermission());
                    break;
                case MAINTAINER:
                    user.setSkill(userInfoDTO.getSkill());
                    break;
                case SERVICE_STAFF:
                    user.setServiceArea(userInfoDTO.getServiceArea());
                    break;
                default:
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
            if (query.getUsername() != null && !query.getUsername().isEmpty()) {
                predicates.add(cb.like(root.get("username"), "%" + query.getUsername() + "%"));
            }
            if (query.getNickname() != null && !query.getNickname().isEmpty()) {
                predicates.add(cb.like(root.get("nickname"), "%" + query.getNickname() + "%"));
    }
            if (query.getContact() != null && !query.getContact().isEmpty()) {
                predicates.add(cb.like(root.get("contact"), "%" + query.getContact() + "%"));
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

} 