package com.roomx.model.entity;

import java.util.Date;

import com.roomx.constant.enums.ApproverPermission;
import com.roomx.constant.enums.UserRole;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;

@Entity
@Data
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String username;
    private String password;
    private String nickname;
    private String email;
    private String phone;
    private Date createTime;
    private Date lastLoginTime;
    
    // 用户角色
    @Enumerated(EnumType.STRING)
    private UserRole role;
    
    // 申请人特有字段
    private String department;
    
    // 审批人特有字段
    @Enumerated(EnumType.STRING)
    private ApproverPermission permission;
    
    // 服务人员特有字段
    private String serviceArea;
    
    // 维修人员特有字段
    private String skill;
    
    // 获取用户角色的方法
    public UserRole getRole() {
        return role;
    }
    
    // 设置用户角色的方法
    public void setRole(UserRole role) {
        this.role = role;
    }
}
