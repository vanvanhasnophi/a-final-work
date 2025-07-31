package com.roomx.model.dto;

import java.util.Date;

import com.roomx.constant.enums.ApproverPermission;
import com.roomx.constant.enums.UserRole;

import lombok.Data;

@Data
public class UserQuery {
    private String username;
    private String nickname;
    private String email;
    private String phone;
    private UserRole role;
    private Date createTime;
    private Date lastLoginTime;
    
    //optional
    private String department;
    private String skill;
    private String serviceArea;
    private ApproverPermission permission;

} 