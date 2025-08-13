package com.roomx.controller;

import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.roomx.annotation.RequireAuth;
import com.roomx.constant.enums.UserRole;
import com.roomx.model.dto.DutyScheduleDTO;
import com.roomx.model.dto.PageResult;
import com.roomx.model.vo.DutyScheduleVO;
import com.roomx.service.DutyScheduleService;

@RestController
@RequestMapping("/api/duty")
public class DutyScheduleController {
    
    @Autowired
    private DutyScheduleService dutyScheduleService;
    
    /**
     * 创建值班安排 - 仅admin可操作
     */
    @PostMapping
    @RequireAuth(roles = {UserRole.ADMIN})
    public ResponseEntity<DutyScheduleDTO> createDutySchedule(@RequestBody DutyScheduleDTO dutyScheduleDTO) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = (String) auth.getPrincipal();
        
        DutyScheduleDTO created = dutyScheduleService.createDutySchedule(dutyScheduleDTO, username);
        return ResponseEntity.ok(created);
    }
    
    /**
     * 更新值班安排 - 仅admin可操作
     */
    @PutMapping("/{id}")
    @RequireAuth(roles = {UserRole.ADMIN})
    public ResponseEntity<DutyScheduleDTO> updateDutySchedule(
            @PathVariable Long id, 
            @RequestBody DutyScheduleDTO dutyScheduleDTO) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = (String) auth.getPrincipal();
        
        DutyScheduleDTO updated = dutyScheduleService.updateDutySchedule(id, dutyScheduleDTO, username);
        return ResponseEntity.ok(updated);
    }
    
    /**
     * 删除值班安排 - 仅admin可操作
     */
    @DeleteMapping("/{id}")
    @RequireAuth(roles = {UserRole.ADMIN})
    public ResponseEntity<Void> deleteDutySchedule(@PathVariable Long id) {
        dutyScheduleService.deleteDutySchedule(id);
        return ResponseEntity.ok().build();
    }
    
    /**
     * 获取值班安排详情 - admin和approver可查看
     */
    @GetMapping("/{id}")
    @RequireAuth(roles = {UserRole.ADMIN, UserRole.APPROVER})
    public ResponseEntity<DutyScheduleDTO> getDutySchedule(@PathVariable Long id) {
        DutyScheduleDTO dutySchedule = dutyScheduleService.getDutySchedule(id);
        return ResponseEntity.ok(dutySchedule);
    }
    
    /**
     * 分页查询值班安排 - admin和approver可查看
     */
    @GetMapping
    @RequireAuth(roles = {UserRole.ADMIN, UserRole.APPROVER})
    public ResponseEntity<PageResult<DutyScheduleVO>> getDutySchedules(
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        PageResult<DutyScheduleVO> result = dutyScheduleService.getDutySchedules(pageNum, pageSize);
        return ResponseEntity.ok(result);
    }
    
    /**
     * 按日期范围查询值班安排 - admin和approver可查看
     */
    @GetMapping("/range")
    @RequireAuth(roles = {UserRole.ADMIN, UserRole.APPROVER})
    public ResponseEntity<List<DutyScheduleVO>> getDutySchedulesByDateRange(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date startDate,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date endDate) {
        List<DutyScheduleVO> schedules = dutyScheduleService.getDutySchedulesByDateRange(startDate, endDate);
        return ResponseEntity.ok(schedules);
    }
    
    /**
     * 获取今日值班人 - 所有登录用户可查看
     */
    @GetMapping("/today")
    @RequireAuth(roles = {UserRole.ADMIN, UserRole.APPLIER, UserRole.APPROVER, UserRole.SERVICE, UserRole.MAINTAINER})
    public ResponseEntity<DutyScheduleVO> getTodayDuty() {
        DutyScheduleVO todayDuty = dutyScheduleService.getTodayDuty();
        return ResponseEntity.ok(todayDuty);
    }
    
    /**
     * 获取可值班人员列表 - admin和approver可查看
     */
    @GetMapping("/available-users")
    @RequireAuth(roles = {UserRole.ADMIN, UserRole.APPROVER})
    public ResponseEntity<List<DutyScheduleDTO>> getAvailableDutyUsers() {
        List<DutyScheduleDTO> users = dutyScheduleService.getAvailableDutyUsers();
        return ResponseEntity.ok(users);
    }
}
