package com.roomx.model.constants;

/**
 * 足迹操作类型工具类
 * 提供操作类型解析的静态方法
 */
public class FootPrintActionType {
    
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
    
    private FootPrintActionType() {
        // 私有构造器，防止实例化
    }
}
