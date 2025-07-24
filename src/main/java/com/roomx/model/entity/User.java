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

    public static User fromDTO(UserLoginDTO userLoginDTO, UserInfoDTO userInfoDTO) {
        User user;
        switch (userInfoDTO.getRole()) {
            case APPLIER: {
                user = new Applier();
                user.setDepartment(userInfoDTO.getDepartment());
                break;
            }
            case APPROVER: {
                user = new Approver();
                user.setDepartment(userInfoDTO.getDepartment());
                user.setPermission(userInfoDTO.getPermission());
                break;
            }
            case MAINTAINER: {
                user = new Maintainer();
                user.setSkill(userInfoDTO.getSkill());
                break;
            }
            case SERVICE_STAFF: {
                user = new ServiceStaff();
                user.setServiceArea(userInfoDTO.getServiceArea());
                break;
            }
            case ADMIN: {
                user = new Admin(); 
                break;
            }
            default: {
                throw new IllegalArgumentException("Invalid role: " + userInfoDTO.getRole());
            }
        }
        user.setUsername(userLoginDTO.getUsername());
        user.setPassword(PasswordEncoderUtil.encode(userLoginDTO.getPassword()));
        user.setNickname(userInfoDTO.getNickname());
        user.setContact(userInfoDTO.getContact());
        return user;
    }
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
