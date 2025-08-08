package com.roomx.repository;

import java.util.Date;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.roomx.constant.enums.ApplicationStatus;
import com.roomx.model.entity.Application;

public interface ApplicationRepository extends JpaRepository<Application, Long>, JpaSpecificationExecutor<Application> {
    // 申请数据访问 - 使用冗余字段
    List<Application> findByRoomId(Long roomId);
    
    // 用户相关查询
    List<Application> findByUserId(Long userId);


    List<Application> findByUsername(String username);

    
    List<Application> findByRoomName(String roomName);
    
    // 状态相关查询
    List<Application> findByStatus(com.roomx.constant.enums.ApplicationStatus status);
    
    // 组合查询
    List<Application> findByUserIdAndStatus(Long userId, com.roomx.constant.enums.ApplicationStatus status);
    
    // 时间范围查询
    List<Application> findByStartTimeBetween(java.util.Date startTime, java.util.Date endTime);
    
    // 查询教室未来的已批准预约
    List<Application> findByRoomIdAndStatusAndEndTimeAfter(Long roomId, ApplicationStatus status, Date endTime);
    
    // 查询教室的待审批申请
    List<Application> findByRoomIdAndStatus(Long roomId, ApplicationStatus status);
    
    // 按天筛选使用时间范围
    List<Application> findByStartTimeGreaterThanEqualAndEndTimeLessThanEqual(Date startDate, Date endDate);
    
    // 按天筛选使用时间范围（带状态）
    List<Application> findByStartTimeGreaterThanEqualAndEndTimeLessThanEqualAndStatus(Date startDate, Date endDate, ApplicationStatus status);
    
    // 按天筛选使用时间范围（带教室ID）
    List<Application> findByStartTimeGreaterThanEqualAndEndTimeLessThanEqualAndRoomId(Date startDate, Date endDate, Long roomId);
    
    // 查询教室在当前时间段内的已批准申请
    List<Application> findByRoomIdAndStatusAndStartTimeBeforeAndEndTimeAfter(Long roomId, ApplicationStatus status, Date startTime, Date endTime);
    
    // 查询教室在指定时间范围内的已批准申请
    List<Application> findByRoomIdAndStatusAndStartTimeBetween(Long roomId, ApplicationStatus status, Date startTime, Date endTime);
    
    // 查询教室在指定时间范围内结束的已批准申请
    List<Application> findByRoomIdAndStatusAndEndTimeBetween(Long roomId, ApplicationStatus status, Date startTime, Date endTime);
    
    // 查询指定状态和时间范围内的申请
    List<Application> findByStatusAndStartTimeBetween(ApplicationStatus status, Date startTime, Date endTime);
    
    // 查询创建时间在指定日期之后的申请（用于优化缓存查询）
    List<Application> findByCreateTimeAfter(Date createTime);
    
    // 查询待处理和进行中的申请（用于状态监控优化）
    List<Application> findByStatusIn(List<ApplicationStatus> statuses);
}
