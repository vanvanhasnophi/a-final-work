package com.roomx.model.entity;

import jakarta.persistence.Entity;
import lombok.Data;
import lombok.EqualsAndHashCode;
import com.roomx.constant.enums.UserRole;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
public class Admin extends User {
    @Override
    public UserRole getRole() {
        return UserRole.ADMIN;
    }
} 