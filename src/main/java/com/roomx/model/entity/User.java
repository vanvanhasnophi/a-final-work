package com.roomx.model.entity;

import java.util.Date;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import com.roomx.constant.enums.UserRole;
import com.roomx.constant.enums.ApproverPermission;



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
    private Date createTime;
    private Date lastLoginTime;
    public abstract UserRole getRole();
}

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
public class Approver extends User {
    private String department;
    private ApproverPermission permission;

    @Override   
    public UserRole getRole() {
        return UserRole.APPROVER;
    }
}

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
public class Maintainer extends User {
    private String skill;

    @Override
    public UserRole getRole() {
        return UserRole.MAINTAINER;
    }
}

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
public class ServiceStaff extends User {
    private String serviceArea;

    @Override
    public UserRole getRole() {
        return UserRole.SERVICE_STAFF;
    }
}

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
public class Admin extends User {
    @Override
    public UserRole getRole() {
        return UserRole.ADMIN;
    }
}

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
public class Applier extends User {
    private String department;

    @Override
    public UserRole getRole() {
        return UserRole.APPLIER;
    }
}
