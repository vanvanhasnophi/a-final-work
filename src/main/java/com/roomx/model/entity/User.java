package com.roomx.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import com.roomx.enums.UserRole;
import com.roomx.enums.ApproverPermission;
import com.roomx.dto.UserLoginDTO;
import com.roomx.dto.UserInfoDTO;
import com.roomx.util.PasswordEncoderUtil;

@Entity
@Inheritance(strategy = InheritanceType.JOINED)
@Data
public abstract class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String username;
    private String password;
    private String nickname;
    private String contact;

    public abstract UserRole getRole();

}

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
public class Approver extends User {
    private String department;
    private ApproverPermission permission;

    public UserRole getRole() {
        return UserRole.APPROVER;
    }
}

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
public class Maintainer extends User {
    private String skill;

    public UserRole getRole() {
        return UserRole.MAINTAINER;
    }
}

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
public class ServiceStaff extends User {
    private String serviceArea;

    public UserRole getRole() {
        return UserRole.SERVICE_STAFF;
    }
}

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
public class Admin extends User {
    public UserRole getRole() {
        return UserRole.ADMIN;
    }
}

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
public class Applier extends User {
    private String department;

    public UserRole getRole() {
        return UserRole.APPLIER;
    }
}
