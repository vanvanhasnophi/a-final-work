package com.roomx.controller;

import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.roomx.annotation.RequireAuth;
import com.roomx.constant.enums.UserRole;
import com.roomx.model.dto.ApplicationDTO;
import com.roomx.model.dto.ApplicationQuery;
import com.roomx.model.dto.ApprovalDTO;
import com.roomx.model.dto.PageResult;
import com.roomx.service.ApplicationService;
import com.roomx.service.RoomStatusSchedulerService;
import com.roomx.service.UserService;
import com.roomx.utils.DateUtil;

@RestController
@RequestMapping("/api/application")
public class ApplicationController {
    @Autowired
    private ApplicationService applicationService;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private RoomStatusSchedulerService roomStatusSchedulerService;

    @PostMapping("/post") // 申请预约
    @RequireAuth(roles = {UserRole.APPLIER, UserRole.ADMIN})
    public ResponseEntity<ApplicationDTO> apply(@RequestBody ApplicationDTO applicationDTO) {
        // 手动处理日期转换
        if (applicationDTO.getStartTime() == null && applicationDTO.getEndTime() == null) {
            // 如果日期字段为null，尝试从字符串字段转换
            // 这里假设前端发送的是字符串格式的日期
            return ResponseEntity.badRequest().build();
        }
        
        ApplicationDTO savedApplication = applicationService.apply(applicationDTO);
        return ResponseEntity.ok(savedApplication);
    }

    @GetMapping("/page") // 分页查询预约列表
    @RequireAuth(roles = {UserRole.ADMIN, UserRole.APPLIER, UserRole.APPROVER})
    public ResponseEntity<PageResult<ApplicationDTO>> page(@RequestParam(required = false) Long userId,
                                                          @RequestParam(required = false) String user, // 统一搜索参数，同时搜索用户名和昵称
                                                          @RequestParam(required = false) String username, // 保留兼容性
                                                          @RequestParam(required = false) String nickname, // 保留兼容性
                                                          @RequestParam(required = false) Long roomId,
                                                          @RequestParam(required = false) String roomName,
                                                          @RequestParam(required = false) String roomLocation,
                                                          @RequestParam(required = false) String roomType,
                                                          @RequestParam(required = false) Long roomCapacity,
                                                          @RequestParam(required = false) String status,
                                                          @RequestParam(required = false) String contact,
                                                          @RequestParam(required = false) Date createTime,
                                                          @RequestParam(required = false) Date updateTime,
                                                          @RequestParam(required = false) Date startTime,
                                                          @RequestParam(required = false) Date endTime,
                                                          @RequestParam(required = false) String queryDate,
                                                          @RequestParam(required = false, defaultValue = "false") Boolean showExpired,
                                                          @RequestParam(defaultValue = "1") int pageNum,
                                                          @RequestParam(defaultValue = "10") int pageSize) {
        // 构建查询对象
        ApplicationQuery query = new ApplicationQuery();
        query.setUserId(userId);
        
        // 优先使用新的统一搜索参数
        if (user != null && !user.trim().isEmpty()) {
            query.setUser(user.trim());
        } else {
            // 兼容旧的分离参数
            query.setUsername(username);
            query.setNickname(nickname);
        }
        
        query.setRoomId(roomId);
        query.setRoomName(roomName);
        query.setRoomLocation(roomLocation);
        if (roomType != null) {
            query.setRoomType(com.roomx.constant.enums.RoomType.valueOf(roomType));
        }
        query.setRoomCapacity(roomCapacity);
        if (status != null) {
            query.setStatus(com.roomx.constant.enums.ApplicationStatus.valueOf(status));
        }
        query.setContact(contact);
        query.setCreateTime(createTime);
        query.setUpdateTime(updateTime);
        query.setStartTime(startTime);
        query.setEndTime(endTime);
        query.setShowExpired(showExpired);
        
        // 手动处理日期转换
        Date parsedQueryDate = null;
        if (queryDate != null && !queryDate.isEmpty()) {
            try {
                java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd");
                parsedQueryDate = sdf.parse(queryDate);
            } catch (Exception e) {
                // 如果日期解析失败，忽略该参数
            }
        }
        
        // 根据用户角色过滤数据
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = auth.getName();
        UserRole userRole = userService.getUserRoleByUsername(currentUsername);
        
        // 如果是APPLIER，只能查看自己的申请
        if (userRole == UserRole.APPLIER) {
            query.setUsername(currentUsername);
        }
        
        PageResult<ApplicationDTO> pageResult = applicationService.page(query, pageNum, pageSize, parsedQueryDate);
        return ResponseEntity.ok(pageResult);
    }

    @GetMapping("/list") // 获取全部预约列表（不支持筛选）
    @RequireAuth(roles = {UserRole.ADMIN, UserRole.APPROVER})
    public ResponseEntity<List<ApplicationDTO>> list() {
        // 直接获取所有申请，不调用page方法
        List<ApplicationDTO> allApplications = applicationService.getAllApplications();
        return ResponseEntity.ok(allApplications);
    }

    @GetMapping("/{id}") // 获取预约详情
    @RequireAuth(roles = {UserRole.ADMIN, UserRole.APPLIER, UserRole.APPROVER})
    public ResponseEntity<ApplicationDTO> get(@PathVariable Long id) {
        return ResponseEntity.ok(applicationService.get(id));
    }
    
    @GetMapping("/room/{roomId}/future-approved") // 查询教室未来的已批准预约
    public ResponseEntity<List<ApplicationDTO>> getFutureApprovedApplications(@PathVariable Long roomId) {
        return ResponseEntity.ok(applicationService.getFutureApprovedApplications(roomId));
    }
    
    @GetMapping("/room/{roomId}/check-conflict") // 检查时间冲突
    public ResponseEntity<Boolean> checkTimeConflict(@PathVariable Long roomId,
                                                   @RequestParam String startTime,
                                                   @RequestParam String endTime,
                                                   @RequestParam(required = false) Long excludeApplicationId) {
        try {
            // 使用DateUtil进行日期转换
            Date startDate = DateUtil.string2date(startTime);
            Date endDate = DateUtil.string2date(endTime);
            
            if (startDate == null || endDate == null) {
                System.err.println("日期解析失败: startTime=" + startTime + ", endTime=" + endTime);
                return ResponseEntity.badRequest().body(false);
            }
            
            boolean hasConflict = applicationService.hasTimeConflict(roomId, startDate, endDate, excludeApplicationId);
            return ResponseEntity.ok(hasConflict);
        } catch (Exception e) {
            System.err.println("时间冲突检查错误: " + e.getMessage());
            return ResponseEntity.badRequest().body(false);
        }
    }
    
    @PostMapping("/approve") // 审批申请
    @RequireAuth(roles = {UserRole.ADMIN, UserRole.APPROVER})
    public ResponseEntity<String> approveApplication(@RequestBody ApprovalDTO approvalDTO) {
        try {
            if (approvalDTO.getApplicationId() == null) {
                return ResponseEntity.badRequest().body("申请ID不能为空");
            }
            if (approvalDTO.getApproved() == null) {
                return ResponseEntity.badRequest().body("审批结果不能为空");
            }
            if (approvalDTO.getReason() == null || approvalDTO.getReason().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("审批意见不能为空");
            }
            
            if (approvalDTO.getApproved()) {
                applicationService.approve(approvalDTO.getApplicationId(), approvalDTO.getReason());
                // 立即触发状态更新
                roomStatusSchedulerService.updateApplicationStatuses();
                return ResponseEntity.ok("申请已批准");
            } else {
                applicationService.reject(approvalDTO.getApplicationId(), approvalDTO.getReason());
                // 立即触发状态更新
                roomStatusSchedulerService.updateApplicationStatuses();
                return ResponseEntity.ok("申请已驳回");
            }
        } catch (Exception e) {
            System.err.println("审批操作失败: " + e.getMessage());
            return ResponseEntity.badRequest().body("审批操作失败: " + e.getMessage());
        }
    }
    
    @PostMapping("/cancel") // 撤销申请
    @RequireAuth(roles = {UserRole.APPLIER, UserRole.ADMIN, UserRole.APPROVER})
    public ResponseEntity<String> cancelApplication(@RequestBody ApprovalDTO approvalDTO) {
        try {
            if (approvalDTO.getApplicationId() == null) {
                return ResponseEntity.badRequest().body("申请ID不能为空");
            }
            if (approvalDTO.getReason() == null || approvalDTO.getReason().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("撤销原因不能为空");
            }
            
            applicationService.cancel(approvalDTO.getApplicationId(), approvalDTO.getReason());
            // 立即触发状态更新
            roomStatusSchedulerService.updateApplicationStatuses();
            return ResponseEntity.ok("申请已撤销");
        } catch (Exception e) {
            System.err.println("撤销操作失败: " + e.getMessage());
            return ResponseEntity.badRequest().body("撤销操作失败: " + e.getMessage());
        }
    }

    @PostMapping("/checkin") // 签到申请
    @RequireAuth(roles = {UserRole.APPLIER, UserRole.ADMIN})
    public ResponseEntity<String> checkinApplication(@RequestBody ApplicationDTO applicationDTO) {
        try {
            if (applicationDTO.getId() == null) {
                return ResponseEntity.badRequest().body("申请ID不能为空");
            }
            
            applicationService.checkin(applicationDTO.getId());
            // 立即触发状态更新
            roomStatusSchedulerService.updateApplicationStatuses();
            return ResponseEntity.ok("签到成功");
        } catch (Exception e) {
            System.err.println("签到操作失败: " + e.getMessage());
            return ResponseEntity.badRequest().body("签到操作失败: " + e.getMessage());
        }
    }
}
