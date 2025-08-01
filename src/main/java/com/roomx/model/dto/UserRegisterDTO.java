package com.roomx.model.dto;

import com.roomx.constant.enums.ApproverPermission;
import com.roomx.constant.enums.UserRole;

import lombok.Data;

@Data
public class UserRegisterDTO {
    private Long id;
    private String nickname;
    private String email;
    private String phone;
    private String username;
    private String password;
    private UserRole role;
    private String department;
    private ApproverPermission permission;
    private String skill;
    private String serviceArea;
}






