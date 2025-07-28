package com.roomx.model.entity;

import jakarta.persistence.Entity;
import lombok.*;
import com.roomx.constant.enums.UserRole;

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