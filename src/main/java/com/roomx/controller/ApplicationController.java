package com.roomx.controller;

import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.roomx.model.dto.ApplicationDTO;
import com.roomx.model.dto.ApplicationQuery;
import com.roomx.model.dto.PageResult;
import com.roomx.service.ApplicationService;

@RestController
@RequestMapping("/api/application")
public class ApplicationController {
    @Autowired
    private ApplicationService applicationService;

    @PostMapping("/post") // 申请预约
    public ResponseEntity<ApplicationDTO> apply(@RequestBody ApplicationDTO applicationDTO) {
        ApplicationDTO savedApplication = applicationService.apply(applicationDTO);
        return ResponseEntity.ok(savedApplication);
    }

    @GetMapping("/page") // 分页查询预约列表
    public ResponseEntity<PageResult<ApplicationDTO>> page(@RequestParam(required = false) Long userId,
                                                          @RequestParam(required = false) String username,
                                                          @RequestParam(required = false) String nickname,
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
                                                          @RequestParam(defaultValue = "1") int pageNum,
                                                          @RequestParam(defaultValue = "10") int pageSize) {
        // 构建查询对象
        ApplicationQuery query = new ApplicationQuery();
        query.setUserId(userId);
        query.setUsername(username);
        query.setNickname(nickname);
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
        
        // 手动处理日期转换
        Date parsedQueryDate = null;
        if (queryDate != null && !queryDate.isEmpty()) {
            try {
                java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd");
                parsedQueryDate = sdf.parse(queryDate);
            } catch (Exception e) {
                // 如果日期解析失败，忽略该参数
                parsedQueryDate = null;
            }
        }
        
        PageResult<ApplicationDTO> pageResult = applicationService.page(query, pageNum, pageSize, parsedQueryDate);
        return ResponseEntity.ok(pageResult);
    }

    @GetMapping("/list") // 获取全部预约列表（不支持筛选）
    public ResponseEntity<List<ApplicationDTO>> list() {
        // 直接获取所有申请，不调用page方法
        List<ApplicationDTO> allApplications = applicationService.getAllApplications();
        return ResponseEntity.ok(allApplications);
    }

    @GetMapping("/{id}") // 获取预约详情
    public ResponseEntity<ApplicationDTO> get(@PathVariable Long id) {
        return ResponseEntity.ok(applicationService.get(id));
    }
    
    @GetMapping("/room/{roomId}/future-approved") // 查询房间未来的已批准预约
    public ResponseEntity<List<ApplicationDTO>> getFutureApprovedApplications(@PathVariable Long roomId) {
        return ResponseEntity.ok(applicationService.getFutureApprovedApplications(roomId));
    }
    
    @GetMapping("/room/{roomId}/check-conflict") // 检查时间冲突
    public ResponseEntity<Boolean> checkTimeConflict(@PathVariable Long roomId,
                                                   @RequestParam Date startTime,
                                                   @RequestParam Date endTime,
                                                   @RequestParam(required = false) Long excludeApplicationId) {
        boolean hasConflict = applicationService.hasTimeConflict(roomId, startTime, endTime, excludeApplicationId);
        return ResponseEntity.ok(hasConflict);
    }
}
