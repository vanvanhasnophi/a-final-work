package com.roomx.utils;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;

public class DateUtil {
    
    private static final String[] DATE_FORMATS = {
        "yyyy-MM-dd HH:mm:ss",
        "yyyy-MM-dd HH:mm",
        "yyyy-MM-dd'T'HH:mm:ss",
        "yyyy-MM-dd'T'HH:mm",
        "yyyy-MM-dd"
    };
    
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
} 