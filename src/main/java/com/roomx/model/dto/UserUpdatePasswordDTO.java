package com.roomx.model.dto;

import lombok.Data;

@Data
public class UserUpdatePasswordDTO {
    private String username;
    private String oldPassword;
    private String newPassword;
}
