package com.roomx.service;

import java.util.Date;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.roomx.constant.enums.ApplicationStatus;
import com.roomx.constant.enums.RoomStatus;
import com.roomx.model.entity.Application;
import com.roomx.model.entity.Room;
import com.roomx.repository.ApplicationRepository;
import com.roomx.repository.RoomRepository;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class RoomStatusSchedulerService {
    
    @Autowired
    private RoomRepository roomRepository;
    
    @Autowired
    private ApplicationRepository applicationRepository;
    
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
    
    @PostConstruct
    public void startScheduler() {
        log.info("启动教室状态自动更新调度器");
        
        // 每分钟检查一次教室状态
        scheduler.scheduleAtFixedRate(this::updateRoomStatuses, 0, 1, TimeUnit.MINUTES);
        
        // 每5分钟检查一次申请状态
        scheduler.scheduleAtFixedRate(this::updateApplicationStatuses, 0, 5, TimeUnit.MINUTES);
    }
    
    @PreDestroy
    public void stopScheduler() {
        log.info("停止教室状态自动更新调度器");
        scheduler.shutdown();
        try {
            if (!scheduler.awaitTermination(60, TimeUnit.SECONDS)) {
                scheduler.shutdownNow();
            }
        } catch (InterruptedException e) {
            scheduler.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }
    
    /**
     * 更新教室状态
     */
    public void updateRoomStatuses() {
        try {
            Date now = new Date();
            
            // 获取所有教室
            List<Room> rooms = roomRepository.findAll();
            
            for (Room room : rooms) {
                updateRoomStatus(room, now);
            }
            
            log.debug("教室状态更新完成，检查了 {} 个教室", rooms.size());
        } catch (Exception e) {
            log.error("更新教室状态时发生错误", e);
        }
    }
    
    /**
     * 更新申请状态
     */
    public void updateApplicationStatuses() {
        try {
            Date now = new Date();
            
            // 获取所有待审批的申请
            List<Application> pendingApplications = applicationRepository.findByStatus(ApplicationStatus.PENDING);
            
            for (Application application : pendingApplications) {
                updateApplicationStatus(application, now);
            }
            
            log.debug("申请状态更新完成，检查了 {} 个申请", pendingApplications.size());
        } catch (Exception e) {
            log.error("更新申请状态时发生错误", e);
        }
    }
    
    /**
     * 更新单个教室状态
     */
    private void updateRoomStatus(Room room, Date now) {
        RoomStatus currentStatus = room.getStatus();
        RoomStatus newStatus = determineRoomStatus(room, now);
        
        if (currentStatus != newStatus) {
            room.setStatus(newStatus);
            room.setUpdateTime(now);
            roomRepository.save(room);
            
            log.info("教室 {} 状态从 {} 更新为 {}", 
                room.getName(), currentStatus, newStatus);
        }
    }
    
    /**
     * 更新单个申请状态
     */
    private void updateApplicationStatus(Application application, Date now) {
        ApplicationStatus currentStatus = application.getStatus();
        ApplicationStatus newStatus = determineApplicationStatus(application, now);
        
        if (currentStatus != newStatus) {
            application.setStatus(newStatus);
            application.setUpdateTime(now);
            applicationRepository.save(application);
            
            log.info("申请 {} 状态从 {} 更新为 {}", 
                application.getId(), currentStatus, newStatus);
            
            // 记录状态变更活动（这里可以通过事件系统或直接调用活动服务）
            // 注意：由于这是后端服务，活动记录通常在前端操作时进行
            // 如果需要在这里记录活动，需要集成活动服务
        }
    }
    
    /**
     * 确定教室状态
     */
    private RoomStatus determineRoomStatus(Room room, Date now) {
        // 如果教室正在维修或清洁中，保持当前状态
        if (room.getStatus() == RoomStatus.MAINTENANCE || 
            room.getStatus() == RoomStatus.CLEANING) {
            return room.getStatus();
        }
        
        // 检查是否有已批准的申请在当前时间段内
        List<Application> activeApplications = applicationRepository
            .findByRoomIdAndStatusAndStartTimeBeforeAndEndTimeAfter(
                room.getId(), 
                ApplicationStatus.APPROVED, 
                now, 
                now
            );
        
        if (!activeApplications.isEmpty()) {
            return RoomStatus.RESERVED;
        }
        
        // 检查是否有已批准的申请即将开始（15分钟内）
        Date fifteenMinutesLater = new Date(now.getTime() + 15 * 60 * 1000);
        List<Application> upcomingApplications = applicationRepository
            .findByRoomIdAndStatusAndStartTimeBetween(
                room.getId(), 
                ApplicationStatus.APPROVED, 
                now, 
                fifteenMinutesLater
            );
        
        if (!upcomingApplications.isEmpty()) {
            return RoomStatus.RESERVED;
        }
        
        // 检查是否有已批准的申请刚结束（30分钟内）
        Date thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
        List<Application> recentApplications = applicationRepository
            .findByRoomIdAndStatusAndEndTimeBetween(
                room.getId(), 
                ApplicationStatus.APPROVED, 
                thirtyMinutesAgo, 
                now
            );
        
        if (!recentApplications.isEmpty()) {
            // 根据教室类型和用途决定是否需要清洁
            if (shouldRequireCleaning(room)) {
                return RoomStatus.PENDING_CLEANING;
            }
        }
        
        // 检查教室是否需要维修
        if (shouldRequireMaintenance(room)) {
            return RoomStatus.PENDING_MAINTENANCE;
        }
        
        return RoomStatus.AVAILABLE;
    }
    
    /**
     * 确定申请状态
     */
    private ApplicationStatus determineApplicationStatus(Application application, Date now) {
        // 如果申请已结束，标记为已完成
        if (application.getEndTime().before(now)) {
            return ApplicationStatus.COMPLETED;
        }
        
        // 检查是否超过预约开始时间15分钟
        Date fifteenMinutesAfterStart = new Date(application.getStartTime().getTime() + 15 * 60 * 1000);
        if (now.after(fifteenMinutesAfterStart) && application.getStatus() == ApplicationStatus.APPROVED) {
            return ApplicationStatus.EXPIRED;
        }
        
        // 检查是否在预约结束时间前30分钟
        Date thirtyMinutesBeforeEnd = new Date(application.getEndTime().getTime() - 30 * 60 * 1000);
        if (now.after(thirtyMinutesBeforeEnd) && application.getStatus() == ApplicationStatus.APPROVED) {
            return ApplicationStatus.EXPIRED;
        }
        
        // 如果申请已过期（超过结束时间24小时），标记为过期
        Date oneDayAfterEnd = new Date(application.getEndTime().getTime() + 24 * 60 * 60 * 1000);
        if (now.after(oneDayAfterEnd)) {
            return ApplicationStatus.EXPIRED;
        }
        
        return application.getStatus();
    }
    
    /**
     * 判断教室是否需要清洁
     */
    private boolean shouldRequireCleaning(Room room) {
        // 根据教室类型和使用频率判断是否需要清洁
        // 这里可以根据实际需求调整逻辑
        return true; // 暂时所有教室都需要清洁
    }
    
    /**
     * 判断教室是否需要维修
     */
    private boolean shouldRequireMaintenance(Room room) {
        // 根据教室的最后维修时间和使用情况判断是否需要维修
        if (room.getLastMaintenanceTime() == null) {
            return false; // 新教室不需要维修
        }
        
        // 如果超过30天没有维修，可能需要维修
        Date thirtyDaysAgo = new Date(System.currentTimeMillis() - 30L * 24 * 60 * 60 * 1000);
        return room.getLastMaintenanceTime().before(thirtyDaysAgo);
    }
    
    /**
     * 手动触发教室状态更新
     */
    public void triggerRoomStatusUpdate(Long roomId) {
        try {
            roomRepository.findById(roomId).ifPresent(room -> updateRoomStatus(room, new Date()));
        } catch (Exception e) {
            log.error("手动更新教室状态时发生错误", e);
        }
    }
    
    /**
     * 手动触发申请状态更新
     */
    public void triggerApplicationStatusUpdate(Long applicationId) {
        try {
            applicationRepository.findById(applicationId).ifPresent(application -> updateApplicationStatus(application, new Date()));
        } catch (Exception e) {
            log.error("手动更新申请状态时发生错误", e);
        }
    }
} 