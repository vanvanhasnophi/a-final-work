package com.roomx.model.entity;

import jakarta.persistence.Entity;
import lombok.Data;
import lombok.EqualsAndHashCode;
import com.roomx.constant.enums.UserRole;
import com.roomx.constant.enums.ApproverPermission;

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