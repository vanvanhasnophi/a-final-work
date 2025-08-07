package com.roomx.service;

/**
 * 数据刷新服务接口
 * 用于定时从数据库更新缓存数据
 */
public interface DataRefreshService {
    
    /**
     * 刷新用户数据缓存
     */
    void refreshUserCache();
    
    /**
     * 刷新教室数据缓存
     */
    void refreshRoomCache();
    
    /**
     * 刷新申请数据缓存
     */
    void refreshApplicationCache();
    
    /**
     * 刷新所有缓存数据
     */
    void refreshAllCache();
    
    /**
     * 清理过期数据
     */
    void cleanupExpiredData();
} 