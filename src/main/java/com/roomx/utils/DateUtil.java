package com.roomx.utils;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.TimeZone;

public class DateUtil {
    
    private static final String[] DATE_FORMATS = {
        "yyyy-MM-dd HH:mm:ss",
        "yyyy-MM-dd HH:mm",
        "yyyy-MM-dd'T'HH:mm:ss",
        "yyyy-MM-dd'T'HH:mm",
        "yyyy-MM-dd"
    };
    
    /**
     * 获取当前服务器时间（UTC）
     * @return 当前UTC时间
     */
    public static Date getCurrentUTCTime() {
        return new Date();
    }
    
    /**
     * 格式化日期为字符串（使用UTC时区）
     * @param date Date对象
     * @return 格式化的UTC日期字符串
     */
    public static String formatUTC(Date date) {
        if (date == null) {
            return null;
        }
        
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
        return sdf.format(date);
    }
    
    /**
     * 将字符串转换为Date对象，支持多种格式
     * @param dateString 日期字符串
     * @return Date对象，如果解析失败返回null
     */
    public static Date string2date(String dateString) {
        if (dateString == null || dateString.trim().isEmpty()) {
            return null;
        }
        
        for (String format : DATE_FORMATS) {
            try {
                SimpleDateFormat sdf = new SimpleDateFormat(format);
                sdf.setLenient(false); // 严格模式
                return sdf.parse(dateString.trim());
            } catch (ParseException e) {
                // 继续尝试下一个格式
                continue;
            }
        }
        
        // 所有格式都失败
        System.err.println("无法解析日期字符串: " + dateString);
        return null;
    }
    
    /**
     * 将Date对象转换为字符串
     * @param date Date对象
     * @return 格式化的日期字符串
     */
    public static String date2string(Date date) {
        if (date == null) {
            return null;
        }
        
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        return sdf.format(date);
    }
    
    /**
     * 检查字符串是否为有效的日期格式
     * @param dateString 日期字符串
     * @return 是否为有效日期
     */
    public static boolean isValidDate(String dateString) {
        return string2date(dateString) != null;
    }
    
    /**
     * 测试时间转换方法
     * 用于验证时间处理是否正确
     */
    public static void testTimeConversion() {
        Date currentTime = getCurrentUTCTime();
        String formattedTime = formatUTC(currentTime);
        String localTime = date2string(currentTime);
        
        System.out.println("当前UTC时间: " + currentTime);
        System.out.println("格式化UTC时间: " + formattedTime);
        System.out.println("本地格式化时间: " + localTime);
    }
} 