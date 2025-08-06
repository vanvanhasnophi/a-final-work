package com.roomx.model.dto;

import com.roomx.constant.enums.UserRole;

import lombok.Data;

@Data
public class UserLoginDTO {
    private String username;
    private String password;
    private UserRole role;
} 
