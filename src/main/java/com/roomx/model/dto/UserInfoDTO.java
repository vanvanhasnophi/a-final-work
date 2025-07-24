package com.roomx.dto;

import com.roomx.enums.ApproverPermission;
import com.roomx.enums.UserRole;

import lombok.Data;

@Data
public class UserInfoDTO {
    private Long id;
    private String username;
    private String nickname;
    private String contact;
    private UserRole role;
    
}

public class ApplierInfoDTO extends UserInfoDTO {
    private String department;
}


public class ApproverInfoDTO extends UserInfoDTO {
    private ApproverPermission permission;
}


public class MaintainerInfoDTO extends UserInfoDTO {
    private String skill;
}


public class ServiceStaffInfoDTO extends UserInfoDTO {
    private String serviceArea;
}
