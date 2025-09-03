package com.roomx.utils;

import org.springframework.stereotype.Component;

import com.roomx.model.dto.FootPrintCreateDTO;

import lombok.extern.slf4j.Slf4j;

/**
 * 足迹记录工具类
 */
@Slf4j
@Component
public class FootPrintUtil {
    
    // ========== 操作类型解析方法 ==========
    
    /**
     * 判断是否为系统级操作（需要发送通知）
     */
    public static boolean isSystemAction(String action) {
        return action != null && action.startsWith("system");
    }
    
    /**
     * 获取操作的大类
     */
    public static String getCategory(String action) {
        if (action == null || action.trim().isEmpty()) {
            return "";
        }
        String trimmed = action.trim();
        int spaceIndex = trimmed.indexOf(' ');
        return spaceIndex > 0 ? trimmed.substring(0, spaceIndex) : trimmed;
    }
    
    /**
     * 获取操作的细节
     */
    public static String getOperation(String action) {
        if (action == null || action.trim().isEmpty()) {
            return "";
        }
        String trimmed = action.trim();
        int spaceIndex = trimmed.indexOf(' ');
        return spaceIndex > 0 ? trimmed.substring(spaceIndex + 1) : "";
    }
    
    /**
     * 构建操作类型字符串
     */
    public static String buildAction(String category, String operation) {
        if (category == null || category.trim().isEmpty()) {
            return "";
        }
        if (operation == null || operation.trim().isEmpty()) {
            return category.trim();
        }
        return category.trim() + " " + operation.trim();
    }
    
    /**
     * 验证操作类型格式是否正确
     */
    public static boolean isValidAction(String action) {
        if (action == null || action.trim().isEmpty()) {
            return false;
        }
        String trimmed = action.trim();
        // 可以是单个单词（如 "system"）或两个单词（如 "user create"）
        String[] parts = trimmed.split("\\s+");
        return parts.length <= 2;
    }
    
    // ========== 统一的足迹记录创建方法 ==========
    
    /**
     * 统一的足迹记录创建方法
     * @param action 操作类型，格式为 "category operation" 或 "category"
     * @param description 操作描述
     * @param operatorId 操作人ID（可选）
     * @param userId 目标用户ID（可选）
     * @param roomId 相关房间ID（可选）
     * @param applicationId 相关申请ID（可选）
     * @param tempInfo 临时信息（根据操作类型存储不同内容）
     */
    public static FootPrintCreateDTO createRecord(String action, String description, 
            Long operatorId, Long userId, Long roomId, Long applicationId, String tempInfo) {
        FootPrintCreateDTO dto = new FootPrintCreateDTO();
        dto.setAction(action);
        dto.setDesc(description);
        dto.setTempInfo(tempInfo);
        
        // 根据操作类型的大类，自动填充相关字段
        String category = getCategory(action);
        
        switch (category) {
            case "user":
                // 用户操作：userId 作为目标用户
                if (userId != null) {
                    dto.setUserId(userId);
                }
                break;
                
            case "room":
                // 房间操作：roomId 必填
                if (roomId != null) {
                    dto.setRoomId(roomId);
                }
                break;
                
            case "app": // 根据CSV使用app而不是application
                // 申请操作：applicationId 必填，同时可能涉及用户和房间
                if (applicationId != null) {
                    dto.setApplicationId(applicationId);
                }
                if (userId != null) {
                    dto.setUserId(userId);
                }
                if (roomId != null) {
                    dto.setRoomId(roomId);
                }
                break;
                
            case "duty":
                // 值班操作：userId 作为被安排值班的用户
                if (userId != null) {
                    dto.setUserId(userId);
                }
                break;
                
            case "system":
                // 系统操作：不需要特定的关联对象
                break;
                
            default:
                // 其他情况，保持传入的参数
                if (userId != null) dto.setUserId(userId);
                if (roomId != null) dto.setRoomId(roomId);
                if (applicationId != null) dto.setApplicationId(applicationId);
                break;
        }
        
        return dto;
    }
    
    /**
     * 简化的创建方法 - 只需要操作类型和描述
     */
    public static FootPrintCreateDTO createRecord(String action, String description) {
        return createRecord(action, description, null, null, null, null, null);
    }
    
    /**
     * 用户相关操作的创建方法
     */
    public static FootPrintCreateDTO createUserRecord(String operation, String description, Long userId, String name) {
        String action = buildAction("user", operation);
        return createRecord(action, description, null, userId, null, null, name);
    }
    
    /**
     * 房间相关操作的创建方法
     */
    public static FootPrintCreateDTO createRoomRecord(String operation, String description, Long roomId, String name) {
        String action = buildAction("room", operation);
        return createRecord(action, description, null, null, roomId, null, name);
    }
    
    /**
     * 申请相关操作的创建方法（带完整上下文）
     */
    public static FootPrintCreateDTO createAppRecord(String operation, String description, 
            Long applicationId, Long userId, Long roomId, String tempInfo) {
        String action = buildAction("app", operation);
        return createRecord(action, description, null, userId, roomId, applicationId, tempInfo);
    }
    
    /**
     * 值班相关操作的创建方法
     */
    public static FootPrintCreateDTO createDutyRecord(String operation, String description, Long targetUserId, String dutyDate) {
        String action = buildAction("duty", operation);
        return createRecord(action, description, null, targetUserId, null, null, dutyDate);
    }
    
    /**
     * 系统操作的创建方法
     */
    public static FootPrintCreateDTO createSystemRecord(String description, String tempInfo) {
        return createRecord("system", description, null, null, null, null, tempInfo);
    }
    
    /**
     * 系统升级操作的创建方法
     */
    public static FootPrintCreateDTO createSystemUpgradeRecord(String description, String version) {
        return createRecord("system upgrade", description, null, null, null, null, version);
    }
    
    // ========== 便利方法 - 常见操作的快捷创建 ==========
    
    /**
     * 创建用户的记录
     */
    public static FootPrintCreateDTO createUser(Long userId, String userName) {
        return createUserRecord("create", "创建用户: " + userName, userId, userName);
    }
    
    /**
     * 更新用户的记录
     */
    public static FootPrintCreateDTO updateUser(Long userId, String userName) {
        return createUserRecord("update", "更新用户: " + userName, userId, userName);
    }
    
    /**
     * 删除用户的记录
     */
    public static FootPrintCreateDTO deleteUser(Long userId, String userName) {
        return createUserRecord("delete", "删除用户: " + userName, userId, userName);
    }
    
    /**
     * 用户修改密码的记录
     */
    public static FootPrintCreateDTO userChangePassword(Long userId, String userName) {
        return createUserRecord("password", "用户修改密码: " + userName, userId, userName);
    }
    
    /**
     * 申请提交的记录（完整版本）
     */
    public static FootPrintCreateDTO submitApplication(Long applicationId, Long userId, Long roomId, String reason) {
        String description = String.format("提交申请 (ID: %d, 用户ID: %d, 房间ID: %d)", 
                                          applicationId, userId, roomId);
        return createAppRecord("submit", description, applicationId, userId, roomId, reason);
    }
    
    /**
     * 申请审批的记录
     * @param operation approve/reject等操作
     */
    public static FootPrintCreateDTO processApplication(String operation, Long applicationId, 
            Long userId, Long roomId, String reason) {
        String description = String.format("处理申请: %s (ID: %d)", operation, applicationId);
        return createAppRecord(operation, description, applicationId, userId, roomId, reason);
    }
    
    /**
     * 申请取消的记录
     */
    public static FootPrintCreateDTO cancelApplication(Long applicationId, Long userId, Long roomId) {
        String description = String.format("取消申请 (ID: %d)", applicationId);
        return createAppRecord("cancel", description, applicationId, userId, roomId, "用户主动取消");
    }
    
    /**
     * 创建房间的记录
     */
    public static FootPrintCreateDTO createRoom(Long roomId, String roomName) {
        return createRoomRecord("create", "创建教室: " + roomName, roomId, roomName);
    }
    
    /**
     * 更新房间的记录
     */
    public static FootPrintCreateDTO updateRoom(Long roomId, String roomName) {
        return createRoomRecord("update", "更新教室: " + roomName, roomId, roomName);
    }
    
    /**
     * 删除房间的记录
     */
    public static FootPrintCreateDTO deleteRoom(Long roomId, String roomName) {
        return createRoomRecord("delete", "删除教室: " + roomName, roomId, roomName);
    }
    
    /**
     * 安排值班的记录
     */
    public static FootPrintCreateDTO assignDuty(Long targetUserId, String targetUserName, String dutyInfo) {
        return createDutyRecord("assign", "安排值班: " + targetUserName + " - " + dutyInfo, targetUserId, dutyInfo);
    }
    
    /**
     * 创建值班安排的记录
     */
    public static FootPrintCreateDTO createDuty(Long targetUserId, String dutyInfo) {
        return createDutyRecord("create", "创建值班安排: " + dutyInfo, targetUserId, dutyInfo);
    }
    
    /**
     * 更新值班安排的记录
     */
    public static FootPrintCreateDTO updateDuty(Long targetUserId, String dutyInfo) {
        return createDutyRecord("update", "更新值班安排: " + dutyInfo, targetUserId, dutyInfo);
    }
    
    /**
     * 删除值班安排的记录
     */
    public static FootPrintCreateDTO deleteDuty(Long targetUserId, String dutyInfo) {
        return createDutyRecord("delete", "删除值班安排: " + dutyInfo, targetUserId, dutyInfo);
    }
    
    /**
     * 系统升级的记录
     */
    public static FootPrintCreateDTO systemUpgrade(String version, String description) {
        return createSystemUpgradeRecord("系统更新到版本: " + version + " - " + description, version);
    }
    
    /**
     * 创建复合操作记录（涉及多个对象）
     */
    public static FootPrintCreateDTO createComplexActionRecord(Long userId, Long roomId, Long applicationId, String action, String description) {
        FootPrintCreateDTO dto = new FootPrintCreateDTO();
        dto.setUserId(userId);
        dto.setRoomId(roomId);
        dto.setApplicationId(applicationId);
        dto.setAction(action);
        dto.setDesc(description);
        return dto;
    }
    
    /**
     * 格式化描述信息
     */
    public static String formatDescription(String template, Object... args) {
        try {
            return String.format(template, args);
        } catch (Exception e) {
            log.warn("Format description failed: {}", e.getMessage());
            return template;
        }
    }
}
