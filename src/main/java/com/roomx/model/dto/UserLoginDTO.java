package com.roomx.model.dto;

import java.util.Date;

import com.roomx.constant.enums.UserRole;

import lombok.*;

@Data
public class UserLoginDTO {
    private String username;
    private String password;
    private UserRole role;
    private Date loginTime;
} 
