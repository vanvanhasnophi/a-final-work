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

import com.roomx.constant.enums.RoomStatus;
import com.roomx.model.entity.Room;
import com.roomx.repository.RoomRepository;
import com.roomx.service.RoomStatusSchedulerService;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/room-status")
public class RoomStatusController {
    
    @Autowired
    private RoomRepository roomRepository;
    
    @Autowired
    private RoomStatusSchedulerService roomStatusSchedulerService;
    
    /**
     * 手动触发教室状态更新
     */
    @PostMapping("/update/{roomId}")
    public ResponseEntity<?> updateRoomStatus(@PathVariable Long roomId) {
        try {
            roomStatusSchedulerService.triggerRoomStatusUpdate(roomId);
            return ResponseEntity.ok().body("教室状态更新成功");
        } catch (Exception e) {
            log.error("更新教室状态失败", e);
            return ResponseEntity.badRequest().body("更新教室状态失败: " + e.getMessage());
        }
    }
    
    /**
     * 手动设置教室状态
     */
    @PostMapping("/set/{roomId}")
    public ResponseEntity<?> setRoomStatus(
            @PathVariable Long roomId,
            @RequestParam RoomStatus status) {
        try {
            Room room = roomRepository.findById(roomId).orElse(null);
            if (room == null) {
                return ResponseEntity.notFound().build();
            }
            
            room.setStatus(status);
            room.setUpdateTime(new Date());
            roomRepository.save(room);
            
            log.info("手动设置教室 {} 状态为 {}", room.getName(), status);
            return ResponseEntity.ok().body("教室状态设置成功");
        } catch (Exception e) {
            log.error("设置教室状态失败", e);
            return ResponseEntity.badRequest().body("设置教室状态失败: " + e.getMessage());
        }
    }
    
    /**
     * 批量更新所有教室状态
     */
    @PostMapping("/update-all")
    public ResponseEntity<?> updateAllRoomStatuses() {
        try {
            roomStatusSchedulerService.updateRoomStatuses();
            return ResponseEntity.ok().body("所有教室状态更新成功");
        } catch (Exception e) {
            log.error("批量更新教室状态失败", e);
            return ResponseEntity.badRequest().body("批量更新教室状态失败: " + e.getMessage());
        }
    }
    
    /**
     * 获取教室状态统计
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getRoomStatusStats() {
        try {
            List<Room> allRooms = roomRepository.findAll();
            
            long available = allRooms.stream().filter(r -> r.getStatus() == RoomStatus.AVAILABLE).count();
            long reserved = allRooms.stream().filter(r -> r.getStatus() == RoomStatus.RESERVED).count();
            long using = allRooms.stream().filter(r -> r.getStatus() == RoomStatus.USING).count();
            long maintenance = allRooms.stream().filter(r -> r.getStatus() == RoomStatus.MAINTENANCE).count();
            long cleaning = allRooms.stream().filter(r -> r.getStatus() == RoomStatus.CLEANING).count();
            long pendingCleaning = allRooms.stream().filter(r -> r.getStatus() == RoomStatus.PENDING_CLEANING).count();
            long pendingMaintenance = allRooms.stream().filter(r -> r.getStatus() == RoomStatus.PENDING_MAINTENANCE).count();
            long unavailable = allRooms.stream().filter(r -> r.getStatus() == RoomStatus.UNAVAILABLE).count();
            
            return ResponseEntity.ok().body(new RoomStatusStats(
                available, reserved, using, maintenance, cleaning, 
                pendingCleaning, pendingMaintenance, unavailable, allRooms.size()
            ));
        } catch (Exception e) {
            log.error("获取教室状态统计失败", e);
            return ResponseEntity.badRequest().body("获取教室状态统计失败: " + e.getMessage());
        }
    }
    
    /**
     * 教室状态统计内部类
     */
    public static class RoomStatusStats {
        public long available;
        public long reserved;
        public long using;
        public long maintenance;
        public long cleaning;
        public long pendingCleaning;
        public long pendingMaintenance;
        public long unavailable;
        public long total;
        
        public RoomStatusStats(long available, long reserved, long using, long maintenance, 
                             long cleaning, long pendingCleaning, long pendingMaintenance, 
                             long unavailable, long total) {
            this.available = available;
            this.reserved = reserved;
            this.using = using;
            this.maintenance = maintenance;
            this.cleaning = cleaning;
            this.pendingCleaning = pendingCleaning;
            this.pendingMaintenance = pendingMaintenance;
            this.unavailable = unavailable;
            this.total = total;
        }
    }
} 