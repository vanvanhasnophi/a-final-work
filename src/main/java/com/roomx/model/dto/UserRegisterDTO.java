package com.roomx.dto;

import com.roomx.enums.UserRole;
import com.roomx.enums.ApproverPermission;

public class UserRegisterDTO {
    private Long id;
    private String nickname;
    private String contact;
    private String username;
    private String password;
    private UserRole role;
    public static User toEntity(UserRegisterDTO dto) {
        User user = new User();
        user.setUsername(dto.getUsername());
        user.setPassword(dto.getPassword());
        user.setNickname(dto.getNickname());
        user.setContact(dto.getContact());
        user.setRole(dto.getRole());
        if (dto instanceof ApplierRegisterDTO) {
            user.setDepartment(((ApplierRegisterDTO) dto).getDepartment());
        } else if (dto instanceof ApproverRegisterDTO) {
            user.setPermission(((ApproverRegisterDTO) dto).getPermission());
        } else if (dto instanceof MaintainerRegisterDTO) {
            user.setSkill(((MaintainerRegisterDTO) dto).getSkill());
        } else if (dto instanceof ServiceStaffRegisterDTO) {
            user.setServiceArea(((ServiceStaffRegisterDTO) dto).getServiceArea());
        }
        return user;
    }
}


public class ApplierRegisterDTO extends UserRegisterDTO {
    private String department;
}


public class ApproverRegisterDTO extends UserRegisterDTO {
    private ApproverPermission permission;
}


public class MaintainerRegisterDTO extends UserRegisterDTO {
    private String skill;
}


public class ServiceStaffRegisterDTO extends UserRegisterDTO {
    private String serviceArea;
}



