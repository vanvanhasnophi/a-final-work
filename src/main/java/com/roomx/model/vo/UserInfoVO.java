package com.roomx.vo;

import lombok.Data;


@Data
public class UserInfoVO {
    private Long id;
    private String username;
    private String nickname;
    private String contact;
    private String roleName;
} 


public class ApplierInfoVO extends UserInfoVO {
    private String department;
}


public class ApproverInfoVO extends UserInfoVO {
    private String department;
}


public class MaintainerInfoVO extends UserInfoVO {
    private String skill;
}


public class ServiceStaffInfoVO extends UserInfoVO {
    private String serviceArea;
}

