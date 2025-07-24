package com.roomx.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

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

    private enum Role {
        APPLIER, APPROVER, MAINTAINER, SERVICE_STAFF, ADMIN
    }

    public abstract Role getRole();

}

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
public class Approver extends User {
    private String department;
    private Permission permission;

    public enum Permission {
        RESTRICTED, 
        NORMAL, 
        EXTENDED
    }

    public Role getRole() {
        return Role.APPROVER;
    }
}

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
public class Maintainer extends User {
    private String skill;

    public Role getRole() {
        return Role.MAINTAINER;
    }
}

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
public class ServiceStaff extends User {
    private String serviceArea;

    public Role getRole() {
        return Role.SERVICE_STAFF;
    }
}

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
public class Admin extends User {
    public Role getRole() {
        return Role.ADMIN;
    }
}

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
public class Applier extends User {
    private String department;

    public Role getRole() {
        return Role.APPLIER;
    }
}
