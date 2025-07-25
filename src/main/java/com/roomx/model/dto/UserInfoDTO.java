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
    private String contact;
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
        this.contact = user.getContact();
        this.role = user.getRole();
        this.createTime = user.getCreateTime();
        this.lastLoginTime = user.getLastLoginTime();
        if (user instanceof Approver) {
            this.department = ((Approver) user).getDepartment();
            this.permission = ((Approver) user).getPermission();
        } else if (user instanceof Maintainer) {
            this.skill = ((Maintainer) user).getSkill();
        } else if (user instanceof ServiceStaff) {
            this.serviceArea = ((ServiceStaff) user).getServiceArea();
        } else if (user instanceof Applier) {
            this.department = ((Applier) user).getDepartment();
        } 

    }

    public static UserInfoDTO fromEntity(User user) {
        return new UserInfoDTO(user);
    }
}
