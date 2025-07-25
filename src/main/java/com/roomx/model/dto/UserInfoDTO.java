package com.roomx.model.dto;

import java.util.Date;

import com.roomx.constant.enums.ApproverPermission;
import com.roomx.constant.enums.UserRole;
import com.roomx.model.entity.User;
import com.roomx.model.dto.ApplierInfoDTO;
import com.roomx.model.dto.ApproverInfoDTO;
import com.roomx.model.dto.MaintainerInfoDTO;
import com.roomx.model.dto.ServiceStaffInfoDTO;
import com.roomx.model.dto.AdminInfoDTO;
import lombok.Data;

@Data
public abstract class UserInfoDTO {
    private Long id;
    private String username;
    private String nickname;
    private String contact;
    private UserRole role;
    private Date createTime;
    private Date updateTime; 
    private Date lastLoginTime;

    public UserInfoDTO(User user) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.nickname = user.getNickname();
        this.contact = user.getContact();
        this.role = user.getRole();
        this.createTime = user.getCreateTime();
        this.updateTime = user.getUpdateTime();
        this.lastLoginTime = user.getLastLoginTime();
    }

    public static UserInfoDTO fromEntity(User user) {
        switch(user.getRole()) {
            case APPLIER:
                return new ApplierInfoDTO(user);
            case APPROVER:
                return new ApproverInfoDTO(user);
            case MAINTAINER:
                return new MaintainerInfoDTO(user);
            case SERVICE_STAFF:
                return new ServiceStaffInfoDTO(user);
            case ADMIN:
                return new AdminInfoDTO(user);
            default:
                return null;
        }
    }

}



public class ApplierInfoDTO extends UserInfoDTO {
    private String department;

    public ApplierInfoDTO(User user) {
        super(user);
        this.department = user.getDepartment();
    }
}


public class ApproverInfoDTO extends UserInfoDTO {
    private ApproverPermission permission;
    private String department;

    public ApproverInfoDTO(User user) {
        super(user);
        this.permission = user.getPermission();
        this.department = user.getDepartment();
    }
}


public class MaintainerInfoDTO extends UserInfoDTO {
    private String skill;

    public MaintainerInfoDTO(User user) {
        super(user);
        this.skill = user.getSkill();
    }
}


public class ServiceStaffInfoDTO extends UserInfoDTO {
    private String serviceArea;

    public ServiceStaffInfoDTO(User user) {
        super(user);
        this.serviceArea = user.getServiceArea();
    }
}

public class AdminInfoDTO extends UserInfoDTO {
    public AdminInfoDTO(User user) {
        super(user);
    }
}
