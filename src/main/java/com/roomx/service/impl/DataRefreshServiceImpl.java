package com.roomx.service.impl;

import java.util.Date;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.roomx.constant.enums.ApplicationStatus;
import com.roomx.constant.enums.RoomStatus;
import com.roomx.model.entity.Application;
import com.roomx.model.entity.Room;
import com.roomx.model.entity.User;
import com.roomx.repository.ApplicationRepository;
import com.roomx.repository.RoomRepository;
import com.roomx.repository.UserRepository;
import com.roomx.service.DataRefreshService;

@Service
public class DataRefreshServiceImpl implements DataRefreshService {
    
    private static final Logger logger = LoggerFactory.getLogger(DataRefreshServiceImpl.class);
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private RoomRepository roomRepository;
    
    @Autowired
    private ApplicationRepository applicationRepository;
    
    // 缓存存储
    private final ConcurrentHashMap<String, Object> cache = new ConcurrentHashMap<>();
    private final AtomicLong lastRefreshTime = new AtomicLong(0);
    
    // 缓存键名
    private static final String USER_CACHE_KEY = "users";
    private static final String ROOM_CACHE_KEY = "rooms";
    private static final String APPLICATION_CACHE_KEY = "applications";
    private static final String STATS_CACHE_KEY = "stats";
    
    @Override
    public void refreshUserCache() {
        try {
            logger.info("开始刷新用户数据缓存...");
            long startTime = System.currentTimeMillis();
            
            List<User> users = userRepository.findAll();
            cache.put(USER_CACHE_KEY, users);
            
            long duration = System.currentTimeMillis() - startTime;
            logger.info("用户数据缓存刷新完成，共 {} 条记录，耗时 {}ms", users.size(), duration);
            
            lastRefreshTime.set(System.currentTimeMillis());
        } catch (Exception e) {
            logger.error("刷新用户数据缓存失败", e);
        }
    }
    
    @Override
    public void refreshRoomCache() {
        try {
            logger.info("开始刷新房间数据缓存...");
            long startTime = System.currentTimeMillis();
            
            List<Room> rooms = roomRepository.findAll();
            cache.put(ROOM_CACHE_KEY, rooms);
            
            long duration = System.currentTimeMillis() - startTime;
            logger.info("房间数据缓存刷新完成，共 {} 条记录，耗时 {}ms", rooms.size(), duration);
            
            lastRefreshTime.set(System.currentTimeMillis());
        } catch (Exception e) {
            logger.error("刷新房间数据缓存失败", e);
        }
    }
    
    @Override
    public void refreshApplicationCache() {
        try {
            logger.info("开始刷新申请数据缓存...");
            long startTime = System.currentTimeMillis();
            
            List<Application> applications = applicationRepository.findAll();
            cache.put(APPLICATION_CACHE_KEY, applications);
            
            long duration = System.currentTimeMillis() - startTime;
            logger.info("申请数据缓存刷新完成，共 {} 条记录，耗时 {}ms", applications.size(), duration);
            
            lastRefreshTime.set(System.currentTimeMillis());
        } catch (Exception e) {
            logger.error("刷新申请数据缓存失败", e);
        }
    }
    
    @Override
    public void refreshAllCache() {
        logger.info("开始刷新所有数据缓存...");
        refreshUserCache();
        refreshRoomCache();
        refreshApplicationCache();
        refreshStatsCache();
        logger.info("所有数据缓存刷新完成");
    }
    
    @Override
    public void cleanupExpiredData() {
        try {
            logger.info("开始清理过期数据...");
            long startTime = System.currentTimeMillis();
            
            // 计算60天前的日期
            Date sixtyDaysAgo = new Date(System.currentTimeMillis() - 60L * 24 * 60 * 60 * 1000);
            
            // 清理60天前的申请记录
            List<Application> oldApplications = applicationRepository.findAll().stream()
                .filter(app -> app.getCreateTime() != null && app.getCreateTime().before(sixtyDaysAgo))
                .toList();
            
            if (!oldApplications.isEmpty()) {
                applicationRepository.deleteAll(oldApplications);
                logger.info("清理了 {} 条60天前的申请记录", oldApplications.size());
            }
            
            // 清理已过期的申请（结束时间已过）
            Date now = new Date();
            List<Application> expiredApplications = applicationRepository.findAll().stream()
                .filter(app -> app.getEndTime() != null && app.getEndTime().before(now))
                .filter(app -> app.getStatus() == com.roomx.constant.enums.ApplicationStatus.COMPLETED)
                .toList();
            
            if (!expiredApplications.isEmpty()) {
                applicationRepository.deleteAll(expiredApplications);
                logger.info("清理了 {} 条已完成的过期申请", expiredApplications.size());
            }
            
            // 更新房间状态
            updateRoomStatus();
            
            long duration = System.currentTimeMillis() - startTime;
            logger.info("过期数据清理完成，耗时 {}ms", duration);
            
        } catch (Exception e) {
            logger.error("清理过期数据失败", e);
        }
    }
    
    /**
     * 刷新统计信息缓存
     */
    private void refreshStatsCache() {
        try {
            long userCount = userRepository.count();
            long roomCount = roomRepository.count();
            long applicationCount = applicationRepository.count();
            long pendingApplicationCount = applicationRepository.findAll().stream()
                .filter(app -> app.getStatus() == ApplicationStatus.PENDING)
                .count();
            
            ConcurrentHashMap<String, Long> stats = new ConcurrentHashMap<>();
            stats.put("userCount", userCount);
            stats.put("roomCount", roomCount);
            stats.put("applicationCount", applicationCount);
            stats.put("pendingApplicationCount", pendingApplicationCount);
            
            cache.put(STATS_CACHE_KEY, stats);
            logger.info("统计信息缓存刷新完成");
            
        } catch (Exception e) {
            logger.error("刷新统计信息缓存失败", e);
        }
    }
    
    /**
     * 更新房间状态
     */
    private void updateRoomStatus() {
        try {
            List<Room> rooms = roomRepository.findAll();
            Date now = new Date();
            int updatedCount = 0;
            
            for (Room room : rooms) {
                boolean needsUpdate = false;
                
                // 检查是否有正在进行的申请
                List<Application> activeApplications = applicationRepository.findAll().stream()
                    .filter(app -> app.getRoom().getId().equals(room.getId()))
                    .filter(app -> app.getStatus() == ApplicationStatus.APPROVED)
                    .filter(app -> app.getStartTime() != null && app.getEndTime() != null)
                    .filter(app -> app.getStartTime().before(now) && app.getEndTime().after(now))
                    .toList();
                
                if (!activeApplications.isEmpty() && room.getStatus() != RoomStatus.USING) {
                    room.setStatus(RoomStatus.USING);
                    needsUpdate = true;
                } else if (activeApplications.isEmpty() && room.getStatus() == RoomStatus.USING) {
                    room.setStatus(RoomStatus.AVAILABLE);
                    needsUpdate = true;
                }
                
                if (needsUpdate) {
                    roomRepository.save(room);
                    updatedCount++;
                }
            }
            
            if (updatedCount > 0) {
                logger.info("更新了 {} 个房间的状态", updatedCount);
            }
            
        } catch (Exception e) {
            logger.error("更新房间状态失败", e);
        }
    }
    
    /**
     * 获取缓存数据
     */
    @SuppressWarnings("unchecked")
    public <T> T getCachedData(String key, Class<T> type) {
        Object data = cache.get(key);
        if (data != null && type.isInstance(data)) {
            return type.cast(data);
        }
        return null;
    }
    
    /**
     * 获取最后刷新时间
     */
    public long getLastRefreshTime() {
        return lastRefreshTime.get();
    }
    
    /**
     * 清除缓存
     */
    public void clearCache() {
        cache.clear();
        logger.info("缓存已清除");
    }
    
    // 定时任务配置
    
    /**
     * 每5分钟刷新一次用户和房间缓存
     */
    @Scheduled(fixedRate = 300000) // 5分钟
    public void scheduledRefreshBasicData() {
        logger.debug("执行定时任务：刷新基础数据缓存");
        refreshUserCache();
        refreshRoomCache();
    }
    
    /**
     * 每2分钟刷新一次申请数据缓存
     */
    @Scheduled(fixedRate = 120000) // 2分钟
    public void scheduledRefreshApplicationData() {
        logger.debug("执行定时任务：刷新申请数据缓存");
        refreshApplicationCache();
    }
    
    /**
     * 每小时清理一次过期数据
     */
    @Scheduled(fixedRate = 3600000) // 1小时
    public void scheduledCleanupExpiredData() {
        logger.debug("执行定时任务：清理过期数据");
        cleanupExpiredData();
    }
    
    /**
     * 每天凌晨2点执行完整数据刷新
     */
    @Scheduled(cron = "0 0 2 * * ?")
    public void scheduledFullRefresh() {
        logger.info("执行定时任务：完整数据刷新");
        refreshAllCache();
    }
} 