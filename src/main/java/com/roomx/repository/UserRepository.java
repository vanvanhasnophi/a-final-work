package com.roomx.repository;

import com.roomx.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    // 用户数据访问
}
