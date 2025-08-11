package com.roomx.controller;

import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.roomx.constant.enums.ApplicationStatus;
import com.roomx.model.entity.Application;
import com.roomx.repository.ApplicationRepository;
import com.roomx.service.RoomStatusSchedulerService;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/application-status")
public class ApplicationStatusController {
    
    @Autowired
    private ApplicationRepository applicationRepository;
    
    @Autowired
    private RoomStatusSchedulerService roomStatusSchedulerService;
    
    /**
     * 手动触发申请状态更新
     */
    @PostMapping("/update/{applicationId}")
    public ResponseEntity<?> updateApplicationStatus(@PathVariable Long applicationId) {
        try {
            roomStatusSchedulerService.triggerApplicationStatusUpdate(applicationId);
            return ResponseEntity.ok().body("申请状态更新成功");
        } catch (Exception e) {
            log.error("更新申请状态失败", e);
            return ResponseEntity.badRequest().body("更新申请状态失败: " + e.getMessage());
        }
    }
    
    /**
     * 手动设置申请状态
     */
    @PostMapping("/set/{applicationId}")
    public ResponseEntity<?> setApplicationStatus(
            @PathVariable Long applicationId,
            @RequestParam ApplicationStatus status) {
        try {
            Application application = applicationRepository.findById(applicationId).orElse(null);
            if (application == null) {
                return ResponseEntity.notFound().build();
            }
            
            application.setStatus(status);
            application.setUpdateTime(new Date());
            applicationRepository.save(application);
            
            log.info("手动设置申请 {} 状态为 {}", applicationId, status);
            return ResponseEntity.ok().body("申请状态设置成功");
        } catch (Exception e) {
            log.error("设置申请状态失败", e);
            return ResponseEntity.badRequest().body("设置申请状态失败: " + e.getMessage());
        }
    }
    
    /**
     * 批量更新所有申请状态
     */
    @PostMapping("/update-all")
    public ResponseEntity<?> updateAllApplicationStatuses() {
        try {
            roomStatusSchedulerService.updateApplicationStatuses();
            return ResponseEntity.ok().body("所有申请状态更新成功");
        } catch (Exception e) {
            log.error("批量更新申请状态失败", e);
            return ResponseEntity.badRequest().body("批量更新申请状态失败: " + e.getMessage());
        }
    }
    
    /**
     * 获取申请状态统计
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getApplicationStatusStats() {
        try {
            List<Application> allApplications = applicationRepository.findAll();
            
            long pending = allApplications.stream().filter(a -> a.getStatus() == ApplicationStatus.PENDING).count();
            long approved = allApplications.stream().filter(a -> a.getStatus() == ApplicationStatus.APPROVED).count();
            long rejected = allApplications.stream().filter(a -> a.getStatus() == ApplicationStatus.REJECTED).count();
            long completed = allApplications.stream().filter(a -> a.getStatus() == ApplicationStatus.COMPLETED).count();
            long cancelled = allApplications.stream().filter(a -> a.getStatus() == ApplicationStatus.CANCELLED).count();
            long pendingCheckIn = allApplications.stream().filter(a -> a.getStatus() == ApplicationStatus.PENDING_CHECKIN).count();
            long inUse = allApplications.stream().filter(a -> a.getStatus() == ApplicationStatus.IN_USE).count();
            long expired = allApplications.stream().filter(a -> a.getExpired() != null && a.getExpired()).count();
            
            return ResponseEntity.ok().body(new ApplicationStatusStats(
                pending, approved, rejected, completed, cancelled, pendingCheckIn, inUse, expired, allApplications.size()
            ));
        } catch (Exception e) {
            log.error("获取申请状态统计失败", e);
            return ResponseEntity.badRequest().body("获取申请状态统计失败: " + e.getMessage());
        }
    }
    
    /**
     * 获取即将过期的申请（15分钟内）
     */
    @GetMapping("/expiring-soon")
    public ResponseEntity<?> getExpiringApplications() {
        try {
            Date now = new Date();
            Date fifteenMinutesLater = new Date(now.getTime() + 15 * 60 * 1000);
            
            List<Application> expiringApplications = applicationRepository
                .findByStatusAndStartTimeBetween(ApplicationStatus.APPROVED, now, fifteenMinutesLater);
            
            return ResponseEntity.ok().body(expiringApplications);
        } catch (Exception e) {
            log.error("获取即将过期的申请失败", e);
            return ResponseEntity.badRequest().body("获取即将过期的申请失败: " + e.getMessage());
        }
    }
    
    /**
     * 申请状态统计内部类
     */
    @SuppressWarnings("CanBeFinal")
    public static class ApplicationStatusStats {
        public long pending;
        public long approved;
        public long rejected;
        public long completed;
        public long cancelled;
        public long pendingCheckIn;
        public long inUse;
        public long expired;
        public long total;
        
        public ApplicationStatusStats(long pending, long approved, long rejected, 
                                   long completed, long cancelled, long pendingCheckIn, long inUse, long expired, long total) {
            this.pending = pending;
            this.approved = approved;
            this.rejected = rejected;
            this.completed = completed;
            this.cancelled = cancelled;
            this.pendingCheckIn = pendingCheckIn;
            this.inUse = inUse;
            this.expired = expired;
            this.total = total;
        }
    }
} 