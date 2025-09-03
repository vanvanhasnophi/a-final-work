package com.roomx.service;

import java.util.Calendar;
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
        
        // 每1分钟检查一次教室状态（更频繁地检查以及时更新状态）
        scheduler.scheduleAtFixedRate(this::updateRoomStatuses, 0, 1, TimeUnit.MINUTES);
        
        // 每1分钟检查一次申请状态（提高频率以及时更新申请状态）
        scheduler.scheduleAtFixedRate(this::updateApplicationStatuses, 0, 1, TimeUnit.MINUTES);
        
        // 每10分钟批量处理过期申请（处理历史数据和遗漏的过期申请）
        scheduler.scheduleAtFixedRate(this::batchProcessExpiredApplications, 1, 10, TimeUnit.MINUTES);
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
            log.debug("开始更新申请状态，当前时间: {}", now);
            
            // 获取需要检查的申请：待审批、已批准、待签到和使用中的申请
            List<ApplicationStatus> activeStatuses = List.of(
                ApplicationStatus.PENDING, 
                ApplicationStatus.APPROVED,
                ApplicationStatus.PENDING_CHECKIN,
                ApplicationStatus.IN_USE
            );
            List<Application> activeApplications = applicationRepository.findByStatusIn(activeStatuses);
            
            int updatedCount = 0;
            for (Application application : activeApplications) {
                try {
                    ApplicationStatus oldStatus = application.getStatus();
                    updateApplicationStatus(application, now);
                    
                    // 统计实际更新的申请数量
                    if (oldStatus != application.getStatus()) {
                        updatedCount++;
                    }
                } catch (Exception e) {
                    log.error("更新申请 {} 状态时发生错误: {}", application.getId(), e.getMessage(), e);
                }
            }
            
            log.debug("申请状态更新完成，检查了 {} 个申请，实际更新了 {} 个申请", 
                activeApplications.size(), updatedCount);
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
        Boolean wasExpired = application.getExpired();
        
        ApplicationStatus newStatus = determineApplicationStatus(application, now);
        
        boolean statusChanged = currentStatus != newStatus;
        boolean expiredChanged = !java.util.Objects.equals(wasExpired, application.getExpired());
        
        if (statusChanged || expiredChanged) {
            try {
                application.setStatus(newStatus);
                application.setUpdateTime(now);
                applicationRepository.save(application);
                
                if (statusChanged) {
                    log.debug("申请 {} 状态从 {} 更新为 {}", 
                        application.getId(), currentStatus, newStatus);
                }
                
                if (expiredChanged && application.getExpired()) {
                    log.debug("申请 {} 过期", application.getId());
                }
                
                // 申请状态变更时，同步更新对应教室的状态
                updateRelatedRoomStatus(application.getRoomId(), now);
                
            } catch (Exception e) {
                log.error("保存申请 {} 状态更新时发生错误: {}", application.getId(), e.getMessage(), e);
                // 恢复原始状态，避免数据不一致
                application.setStatus(currentStatus);
                application.setExpired(wasExpired);
                throw e;
            }
        }
    }
    
    /**
     * 更新相关教室状态
     */
    private void updateRelatedRoomStatus(Long roomId, Date now) {
        try {
            Room room = roomRepository.findById(roomId).orElse(null);
            if (room != null) {
                updateRoomStatus(room, now);
            } else {
                log.warn("尝试更新不存在的教室状态，教室ID: {}", roomId);
            }
        } catch (Exception e) {
            log.error("更新相关教室 {} 状态时发生错误: {}", roomId, e.getMessage(), e);
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
        
        // 检查是否有使用中的申请
        List<Application> usingApplications = applicationRepository
            .findByRoomIdAndStatusAndStartTimeBeforeAndEndTimeAfter(
                room.getId(), 
                ApplicationStatus.IN_USE, 
                now, 
                now
            );
        
        if (!usingApplications.isEmpty()) {
            return RoomStatus.USING;
        }
        
        // 检查是否有待签到的申请（在预约时间范围内且未超过开始时间30分钟）
        List<Application> pendingCheckinApplications = applicationRepository
            .findByRoomIdAndStatusAndStartTimeBeforeAndEndTimeAfter(
                room.getId(), 
                ApplicationStatus.PENDING_CHECKIN, 
                now, 
                now
            );
        
        // 过滤掉已经超过开始时间30分钟的待签到申请（这些应该被取消）
        pendingCheckinApplications = pendingCheckinApplications.stream()
            .filter(app -> {
                Date thirtyMinutesAfterStart = new Date(app.getStartTime().getTime() + 30 * 60 * 1000);
                return now.before(thirtyMinutesAfterStart);
            })
            .toList();
        
        if (!pendingCheckinApplications.isEmpty()) {
            return RoomStatus.RESERVED;
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
        
        // 检查是否有已批准申请即将开始（15分钟内），但要排除开始时间前15分钟内已转为待签到的
        Date fifteenMinutesLater = new Date(now.getTime() + 15 * 60 * 1000);
        List<Application> upcomingApproved = applicationRepository
            .findByRoomIdAndStatusAndStartTimeBetween(
                room.getId(), 
                ApplicationStatus.APPROVED,
                now, 
                fifteenMinutesLater
            );
        
        // 过滤掉开始时间前15分钟内的申请（这些应该已经转为待签到状态）
        upcomingApproved = upcomingApproved.stream()
            .filter(app -> {
                Date fifteenMinutesBeforeStart = new Date(app.getStartTime().getTime() - 15 * 60 * 1000);
                return now.before(fifteenMinutesBeforeStart);
            })
            .toList();
        
        // 检查即将开始的待签到申请
        List<Application> upcomingPendingCheckin = applicationRepository
            .findByRoomIdAndStatusAndStartTimeBetween(
                room.getId(), 
                ApplicationStatus.PENDING_CHECKIN,
                now, 
                fifteenMinutesLater
            );
        
        if (!upcomingApproved.isEmpty() || !upcomingPendingCheckin.isEmpty()) {
            return RoomStatus.RESERVED;
        }
        
        // 检查是否有已完成的申请刚结束（30分钟内）
        Date thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
        List<Application> recentCompleted = applicationRepository
            .findByRoomIdAndStatusAndEndTimeBetween(
                room.getId(), 
                ApplicationStatus.COMPLETED,
                thirtyMinutesAgo, 
                now
            );
        
        if (!recentCompleted.isEmpty()) {
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
        ApplicationStatus currentStatus = application.getStatus();
        
        // 首先处理过期标记逻辑
        markApplicationIfExpired(application, now);
        
        // 根据当前状态和时间判断新状态
        switch (currentStatus) {
            case PENDING:
                return handlePendingStatus(application, now);
            
            case APPROVED:
                return handleApprovedStatus(application, now);
            
            case PENDING_CHECKIN:
                return handlePendingCheckinStatus(application, now);
            
            case IN_USE:
                return handleInUseStatus(application, now);
            
            default:
                return currentStatus;
        }
    }
    
    /**
     * 标记申请为过期（如果符合条件）
     */
    private void markApplicationIfExpired(Application application, Date now) {
        // 如果已经标记为过期，则跳过
        if (application.getExpired() != null && application.getExpired()) {
            return;
        }
        
        // 获取今天零点时间
        Calendar cal = Calendar.getInstance();
        cal.set(Calendar.HOUR_OF_DAY, 0);
        cal.set(Calendar.MINUTE, 0);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        Date todayStart = cal.getTime();
        
        // 结束时间在今天之前，且距离结束时间已超过12小时的申请标记为过期
        if (application.getEndTime().before(todayStart)) {
            Date twelveHoursAfterEnd = new Date(application.getEndTime().getTime() + 12 * 60 * 60 * 1000);
            if (now.after(twelveHoursAfterEnd)) {
                application.setExpired(true);
                log.info("申请 {} 标记为过期，结束时间: {}, 当前时间: {}", 
                    application.getId(), application.getEndTime(), now);
            }
        }
    }
    
    /**
     * 处理待审批状态的申请
     */
    private ApplicationStatus handlePendingStatus(Application application, Date now) {
        // 待审批的申请在开始时间后15分钟自动驳回
        Date fifteenMinutesAfterStart = new Date(application.getStartTime().getTime() + 15 * 60 * 1000);
        if (now.after(fifteenMinutesAfterStart)) {
            log.info("申请 {} 因超时未审批自动驳回，开始时间: {}, 当前时间: {}", 
                application.getId(), application.getStartTime(), now);
            return ApplicationStatus.REJECTED;
        }
        return ApplicationStatus.PENDING;
    }
    
    /**
     * 处理已批准状态的申请
     */
    private ApplicationStatus handleApprovedStatus(Application application, Date now) {
        // 已批准的申请在开始时间前15分钟变为待签到
        Date fifteenMinutesBeforeStart = new Date(application.getStartTime().getTime() - 15 * 60 * 1000);
        if (now.after(fifteenMinutesBeforeStart)) {
            log.info("申请 {} 进入待签到状态，开始时间: {}, 当前时间: {}", 
                application.getId(), application.getStartTime(), now);
            return ApplicationStatus.PENDING_CHECKIN;
        }
        return ApplicationStatus.APPROVED;
    }
    
    /**
     * 处理待签到状态的申请
     */
    private ApplicationStatus handlePendingCheckinStatus(Application application, Date now) {
        
        
        // 开始时间后30分钟或者过了结束时间还未签到，则自动取消
        Date thirtyMinutesAfterStart = new Date(application.getStartTime().getTime() + 30 * 60 * 1000);
        if (now.after(thirtyMinutesAfterStart)||now.after(application.getEndTime())) {
            application.setExpired(true);
            log.info("申请 {} 因超时未签到自动取消，开始时间: {}, 结束时间: {}, 当前时间: {}", 
                application.getId(), application.getStartTime(), application.getEndTime(), now);
            return ApplicationStatus.CANCELLED;
        }
        
        return ApplicationStatus.PENDING_CHECKIN;
    }
    
    /**
     * 处理使用中状态的申请
     */
    private ApplicationStatus handleInUseStatus(Application application, Date now) {
        // 结束时间后，使用中的申请状态为已完成
        if (now.after(application.getEndTime())) {
            log.info("申请 {} 使用结束，标记为已完成，结束时间: {}, 当前时间: {}", 
                application.getId(), application.getEndTime(), now);
            return ApplicationStatus.COMPLETED;
        }
        return ApplicationStatus.IN_USE;
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

        // 如果超过60天没有维修，可能需要维修
        Date sixtyDaysAgo = new Date(System.currentTimeMillis() - 60L * 24 * 60 * 60 * 1000);
        return room.getLastMaintenanceTime().before(sixtyDaysAgo);
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
            applicationRepository.findById(applicationId).ifPresent(application -> 
                updateApplicationStatus(application, new Date()));
        } catch (Exception e) {
            log.error("手动更新申请状态时发生错误", e);
        }
    }
    
    /**
     * 手动触发批量过期申请处理
     */
    public void triggerBatchProcessExpiredApplications() {
        try {
            log.info("手动触发批量过期申请处理");
            batchProcessExpiredApplications();
        } catch (Exception e) {
            log.error("手动触发批量过期申请处理时发生错误", e);
        }
    }
    
    /**
     * 批量处理过期申请（通常在系统启动时或定期维护时调用）
     */
    public void batchProcessExpiredApplications() {
        try {
            Date now = new Date();
            log.info("开始批量处理过期申请，当前时间: {}", now);
            
            // 获取所有可能需要标记过期的申请状态
            List<ApplicationStatus> expirableStatuses = List.of(
                ApplicationStatus.PENDING, 
                ApplicationStatus.APPROVED,
                ApplicationStatus.PENDING_CHECKIN,
                ApplicationStatus.IN_USE,
                ApplicationStatus.COMPLETED,
                ApplicationStatus.CANCELLED,
                ApplicationStatus.REJECTED
            );
            
            // 获取未标记过期但可能已过期的申请
            List<Application> applicationsToCheck = applicationRepository
                .findByStatusIn(expirableStatuses)
                .stream()
                .filter(app -> app.getExpired() == null || !app.getExpired())
                .toList();
            
            int markedExpiredCount = 0;
            for (Application application : applicationsToCheck) {
                Boolean wasExpired = application.getExpired();
                markApplicationIfExpired(application, now);
                
                if (application.getExpired() && !java.util.Objects.equals(wasExpired, application.getExpired())) {
                    applicationRepository.save(application);
                    markedExpiredCount++;
                }
            }
            
            log.info("批量处理过期申请完成，检查了 {} 个申请，标记过期 {} 个申请", 
                applicationsToCheck.size(), markedExpiredCount);
                
        } catch (Exception e) {
            log.error("批量处理过期申请时发生错误", e);
        }
    }
} 