package com.roomx.repository;

import com.roomx.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface UserRepository extends JpaRepository<User, Long> {
    // 用户数据访问
    List<User> findByRole(User.Role role);
    List<User> findByUsername(String username);
    List<User> findByNickname(String nickname);
    List<User> findByContact(String contact);
    List<User> findByDepartment(String department);
    List<User> findBySkill(String skill);
    List<User> findByServiceArea(String serviceArea);
    List<User> findByPermission(User.Permission permission);
}
