package com.roomx.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.roomx.model.entity.Notification;

public interface NotificationRepository extends JpaRepository<Notification, Long>, JpaSpecificationExecutor<Notification> {
    
    // 根据用户ID查找通知（分页）
    Page<Notification> findByUserIdOrderByCreateTimeDesc(Long userId, Pageable pageable);
    
    // 根据用户ID查找未读通知
    List<Notification> findByUserIdAndIsReadFalseOrderByCreateTimeDesc(Long userId);
    
    // 统计用户未读通知数量
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.userId = :userId AND n.isRead = false")
    Long countUnreadByUserId(@Param("userId") Long userId);
    
    // 根据用户ID和类型查找通知
    List<Notification> findByUserIdAndTypeOrderByCreateTimeDesc(Long userId, String type);
} 