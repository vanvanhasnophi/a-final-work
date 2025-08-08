package com.roomx.utils;

import java.util.regex.Pattern;

/**
 * 密码强度评估与校验工具。
 * 评分规则（0-5）：
 * 1. 长度 >= 8
 * 2. 含有大写字母
 * 3. 含有小写字母
 * 4. 含有数字
 * 5. 含有特殊字符 !@#$%^&*()_+-=[]{},.<>/?
 */
public final class PasswordStrengthUtil {

    private static final Pattern UPPER = Pattern.compile("[A-Z]");
    private static final Pattern LOWER = Pattern.compile("[a-z]");
    private static final Pattern DIGIT = Pattern.compile("[0-9]");
    // 特殊字符集合需正确转义 - 字符类中 - 放在开头或结尾避免转义混淆
    private static final Pattern SPECIAL = Pattern.compile("[!@#$%^&*()_+=\\-{}\\[\\]|:;\\\"'<>.,?/]");

    private PasswordStrengthUtil() {}

    public static int score(String pwd) {
        if (pwd == null) return 0;
        int s = 0;
        if (pwd.length() >= 8) s++;
        if (UPPER.matcher(pwd).find()) s++;
        if (LOWER.matcher(pwd).find()) s++;
        if (DIGIT.matcher(pwd).find()) s++;
        if (SPECIAL.matcher(pwd).find()) s++;
        return s;
    }

    public static String level(int score) {
        return switch (score) {
            case 0,1 -> "WEAK";
            case 2,3 -> "MEDIUM";
            case 4,5 -> "STRONG";
            default -> "UNKNOWN";
        };
    }

    /**
     * 基线要求：长度>=8 且 总得分>=3；即长度为必选项 + 其他四类中至少再满足2类。
     */
    public static void validateOrThrow(String pwd) {
        int s = score(pwd);
        if (pwd == null || pwd.length() < 8 || s < 3) {
            throw new IllegalArgumentException("Password too weak: need length>=8 plus at least 2 of: upper, lower, digit, special");
        }
    }
}
