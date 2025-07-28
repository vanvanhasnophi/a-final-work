package com.roomx.model.entity;

import jakarta.persistence.Entity;
import lombok.*;
import com.roomx.constant.enums.UserRole;

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