package com.roomx.model.entity;

import java.util.Date;

import jakarta.persistence.*;
import lombok.*;
import com.roomx.constant.enums.UserRole;
import com.roomx.constant.enums.ApproverPermission;

@Entity
@Data
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String username;
    private String password;
    private String nickname;
    private String contact;
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
