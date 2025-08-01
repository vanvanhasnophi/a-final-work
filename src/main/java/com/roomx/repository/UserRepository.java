package com.roomx.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.roomx.constant.enums.UserRole;
import com.roomx.model.entity.User;

public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {
    
    User findByUsername(String username);

    List<User> findByNickname(String nickname);

    List<User> findByEmail(String email);

    List<User> findByPhone(String phone);
    
    long countByRole(UserRole role);
}
