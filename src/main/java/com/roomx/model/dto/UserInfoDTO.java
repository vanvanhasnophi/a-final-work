package com.roomx.model.dto;

import java.util.Date;

import com.roomx.constant.enums.ApproverPermission;
import com.roomx.constant.enums.UserRole;
import com.roomx.model.entity.User;

import lombok.Data;

@Data
public class UserInfoDTO {
    private Long id;
    private String username;
    private String nickname;
    private String email;
    private String phone;
    private UserRole role;
    private Date createTime;
    private Date updateTime;
    private Date lastLoginTime;
    private String department; // 适用于 Applier/Approver
    private ApproverPermission permission; // 适用于 Approver
    private String skill; // 适用于 Maintainer
    private String serviceArea; // 适用于 ServiceStaff

    public UserInfoDTO() {}

    public UserInfoDTO(User user) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.nickname = user.getNickname();
        this.email = user.getEmail();
        this.phone = user.getPhone();
        this.role = user.getRole();
        this.createTime = user.getCreateTime();
        this.updateTime = user.getUpdateTime();
        this.lastLoginTime = user.getLastLoginTime();
        this.department = user.getDepartment();
        this.permission = user.getPermission();
        this.skill = user.getSkill();
        this.serviceArea = user.getServiceArea();
    }

    public static UserInfoDTO fromEntity(User user) {
        return new UserInfoDTO(user);
    }
}
