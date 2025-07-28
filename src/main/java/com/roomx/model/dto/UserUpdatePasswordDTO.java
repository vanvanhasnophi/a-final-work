package com.roomx.model.dto;

import lombok.*;

@Data
public class UserUpdatePasswordDTO {
    private String username;
    private String oldPassword;
    private String newPassword;
}
