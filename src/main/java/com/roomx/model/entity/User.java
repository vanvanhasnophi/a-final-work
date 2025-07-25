package com.roomx.model.entity;

import java.util.Date;

import jakarta.persistence.*;
import lombok.Data;
import com.roomx.constant.enums.UserRole;


@Entity
@Data
@Inheritance(strategy = InheritanceType.JOINED)
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
