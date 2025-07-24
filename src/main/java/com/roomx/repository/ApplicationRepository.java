package com.roomx.repository;

import com.roomx.entity.Application;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApplicationRepository extends JpaRepository<Application, Long> {
    // 申请数据访问
    List<Application> findByUserId(Long userId);
    List<Application> findByRoomId(Long roomId);
    List<Application> findByStatus(Application.Status status);
    List<Application> findByUserIdAndRoomId(Long userId, Long roomId);
    List<Application> findByUserIdAndStatus(Long userId, Application.Status status);
    List<Application> findByRoomIdAndStatus(Long roomId, Application.Status status);
    List<Application> findByUserIdAndRoomIdAndStatus(Long userId, Long roomId, Application.Status status);
}
