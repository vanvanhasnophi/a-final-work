package com.roomx.model.vo;

import com.roomx.constant.enums.ApproverPermission;
import com.roomx.constant.enums.UserRole;
import lombok.Data; 


@Data
public class UserInfoVO {
    private Long id;
    private String username;
    private String nickname;
    private String contact;
    private UserRole role;
} 


public class ApplierInfoVO extends UserInfoVO {
    private String department;
}


public class ApproverInfoVO extends UserInfoVO {
    private ApproverPermission permission;
}


public class MaintainerInfoVO extends UserInfoVO {
    private String skill;
}


public class ServiceStaffInfoVO extends UserInfoVO {
    private String serviceArea;
}

