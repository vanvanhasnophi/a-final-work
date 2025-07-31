package com.roomx.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

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
}
