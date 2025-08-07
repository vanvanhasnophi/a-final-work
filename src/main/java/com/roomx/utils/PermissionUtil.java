package com.roomx.utils;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.roomx.constant.enums.UserRole;

/**
 * 权限管理工具类
 * 定义各种操作的权限要求
 */
@SuppressWarnings("ArraysAsListWithZeroOrOneArgument")
public class PermissionUtil {
    private static final Logger logger = LoggerFactory.getLogger(PermissionUtil.class);
    
    // 房间管理权限
    public static final Set<UserRole> ROOM_CREATE_PERMISSIONS = new HashSet<>(Arrays.asList(UserRole.ADMIN));
    public static final Set<UserRole> ROOM_UPDATE_PERMISSIONS = new HashSet<>(Arrays.asList(UserRole.ADMIN));
    public static final Set<UserRole> ROOM_DELETE_PERMISSIONS = new HashSet<>(Arrays.asList(UserRole.ADMIN));
    public static final Set<UserRole> ROOM_VIEW_PERMISSIONS = new HashSet<>(Arrays.asList(UserRole.ADMIN, UserRole.APPLIER, UserRole.APPROVER, UserRole.SERVICE, UserRole.MAINTAINER));
    
    // 申请管理权限
    public static final Set<UserRole> APPLICATION_CREATE_PERMISSIONS = new HashSet<>(Arrays.asList(UserRole.APPLIER, UserRole.ADMIN));
    public static final Set<UserRole> APPLICATION_VIEW_ALL_PERMISSIONS = new HashSet<>(Arrays.asList(UserRole.ADMIN, UserRole.APPROVER));
    public static final Set<UserRole> APPLICATION_VIEW_OWN_PERMISSIONS = new HashSet<>(Arrays.asList(UserRole.APPLIER, UserRole.ADMIN, UserRole.APPROVER));
    public static final Set<UserRole> APPLICATION_APPROVE_PERMISSIONS = new HashSet<>(Arrays.asList(UserRole.ADMIN, UserRole.APPROVER));
    public static final Set<UserRole> APPLICATION_CANCEL_PERMISSIONS = new HashSet<>(Arrays.asList(UserRole.APPLIER, UserRole.ADMIN, UserRole.APPROVER));
    
    // 用户管理权限
    public static final Set<UserRole> USER_MANAGE_PERMISSIONS = new HashSet<>(Arrays.asList(UserRole.ADMIN));
    public static final Set<UserRole> USER_VIEW_PERMISSIONS = new HashSet<>(Arrays.asList(UserRole.ADMIN, UserRole.APPROVER));
    public static final Set<UserRole> USER_CREATE_PERMISSIONS = new HashSet<>(Arrays.asList(UserRole.ADMIN));
    public static final Set<UserRole> USER_DELETE_PERMISSIONS = new HashSet<>(Arrays.asList(UserRole.ADMIN));
    
    // 通知管理权限
    public static final Set<UserRole> NOTIFICATION_VIEW_PERMISSIONS = new HashSet<>(Arrays.asList(UserRole.ADMIN, UserRole.APPLIER, UserRole.APPROVER, UserRole.SERVICE, UserRole.MAINTAINER));
    
    /**
     * 检查用户是否有指定操作的权限
     */
    public static boolean hasPermission(UserRole userRole, Set<UserRole> requiredRoles) {
        boolean hasPermission = requiredRoles.contains(userRole);
        logger.debug("权限检查 - 用户角色: {}, 需要角色: {}, 结果: {}", userRole, requiredRoles, hasPermission);
        return hasPermission;
    }
    
    /**
     * 检查用户是否有房间创建权限
     */
    public static boolean canCreateRoom(UserRole userRole) {
        return hasPermission(userRole, ROOM_CREATE_PERMISSIONS);
    }
    
    /**
     * 检查用户是否有房间更新权限
     */
    public static boolean canUpdateRoom(UserRole userRole) {
        return hasPermission(userRole, ROOM_UPDATE_PERMISSIONS);
    }
    
    /**
     * 检查用户是否有房间删除权限
     */
    public static boolean canDeleteRoom(UserRole userRole) {
        return hasPermission(userRole, ROOM_DELETE_PERMISSIONS);
    }
    
    /**
     * 检查用户是否有房间查看权限
     */
    public static boolean canViewRoom(UserRole userRole) {
        return hasPermission(userRole, ROOM_VIEW_PERMISSIONS);
    }
    
    /**
     * 检查用户是否有申请创建权限
     */
    public static boolean canCreateApplication(UserRole userRole) {
        return hasPermission(userRole, APPLICATION_CREATE_PERMISSIONS);
    }
    
    /**
     * 检查用户是否有查看所有申请的权限
     */
    public static boolean canViewAllApplications(UserRole userRole) {
        return hasPermission(userRole, APPLICATION_VIEW_ALL_PERMISSIONS);
    }
    
    /**
     * 检查用户是否有查看自己申请的权限
     */
    public static boolean canViewOwnApplications(UserRole userRole) {
        return hasPermission(userRole, APPLICATION_VIEW_OWN_PERMISSIONS);
    }
    
    /**
     * 检查用户是否有申请审批权限
     */
    public static boolean canApproveApplication(UserRole userRole) {
        return hasPermission(userRole, APPLICATION_APPROVE_PERMISSIONS);
    }
    
    /**
     * 检查用户是否有申请撤销权限
     */
    public static boolean canCancelApplication(UserRole userRole) {
        return hasPermission(userRole, APPLICATION_CANCEL_PERMISSIONS);
    }
    
    /**
     * 检查用户是否有用户管理权限
     */
    public static boolean canManageUsers(UserRole userRole) {
        return hasPermission(userRole, USER_MANAGE_PERMISSIONS);
    }
    
    /**
     * 检查用户是否有用户查看权限
     */
    public static boolean canViewUsers(UserRole userRole) {
        return hasPermission(userRole, USER_VIEW_PERMISSIONS);
    }
    
    /**
     * 检查用户是否有用户创建权限
     */
    public static boolean canCreateUser(UserRole userRole) {
        return hasPermission(userRole, USER_CREATE_PERMISSIONS);
    }
    
    /**
     * 检查用户是否有用户删除权限
     */
    public static boolean canDeleteUser(UserRole userRole) {
        return hasPermission(userRole, USER_DELETE_PERMISSIONS);
    }
    
    /**
     * 检查用户是否有通知查看权限
     */
    public static boolean canViewNotifications(UserRole userRole) {
        return hasPermission(userRole, NOTIFICATION_VIEW_PERMISSIONS);
    }
    
    /**
     * 获取用户可访问的页面
     */
    public static Set<String> getAccessiblePages(UserRole userRole) {
        Set<String> pages = new HashSet<>();
        
        // 所有角色都可以访问的页面
        pages.add("dashboard");
        pages.add("profile");
        pages.add("notifications");
        
        // 根据角色添加特定页面
        switch (userRole) {
            case ADMIN:
                pages.add("user-management");
                pages.add("room-management");
                pages.add("application-management");
                pages.add("my-applications");
                break;
            case APPLIER:
                pages.add("my-applications");
                pages.add("room-list");
                break;
            case APPROVER:
                pages.add("application-management");
                pages.add("user-list");
                pages.add("room-list");
                break;
            case SERVICE, MAINTAINER:
                pages.add("room-list");
                break;
        }
        
        return pages;
    }
    
    /**
     * 获取用户角色显示名称
     */
    public static String getRoleDisplayName(UserRole role) {
        return switch (role) {
            case ADMIN -> "管理员";
            case APPLIER -> "申请人";
            case APPROVER -> "审批人";
            case SERVICE -> "服务人员";
            case MAINTAINER -> "维修人员";
            default -> "未知角色";
        };
    }
    
    /**
     * 获取用户角色的颜色
     */
    public static String getRoleColor(UserRole role) {
        return switch (role) {
            case ADMIN -> "red";
            case APPLIER -> "green";
            case APPROVER -> "blue";
            case SERVICE -> "orange";
            case MAINTAINER -> "purple";
            default -> "default";
        };
    }
} 