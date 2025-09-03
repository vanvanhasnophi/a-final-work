package com.roomx.repository;

import java.util.Date;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.roomx.model.entity.FootPrint;

@Repository
public interface FootPrintRepository extends JpaRepository<FootPrint, Long> {
    
    /**
     * 根据操作人ID查找记录
     */
    Page<FootPrint> findByOperatorId(Long operatorId, Pageable pageable);
    
    /**
     * 根据用户ID查找记录
     */
    Page<FootPrint> findByUserId(Long userId, Pageable pageable);
    
    /**
     * 根据应用ID查找记录
     */
    Page<FootPrint> findByApplicationId(Long applicationId, Pageable pageable);
    
    /**
     * 根据房间ID查找记录
     */
    Page<FootPrint> findByRoomId(Long roomId, Pageable pageable);
    
    /**
     * 根据操作类型查找记录
     */
    Page<FootPrint> findByAction(String action, Pageable pageable);
    
    /**
     * 根据时间范围查找记录
     */
    Page<FootPrint> findByTimestampBetween(Date startTime, Date endTime, Pageable pageable);
    
    /**
     * 复合查询 - 根据操作人和时间范围
     */
    Page<FootPrint> findByOperatorIdAndTimestampBetween(Long operatorId, Date startTime, Date endTime, Pageable pageable);
    
    /**
     * 复合查询 - 根据用户和操作类型
     */
    Page<FootPrint> findByUserIdAndAction(Long userId, String action, Pageable pageable);
    
    /**
     * 复合查询 - 根据房间和时间范围
     */
    Page<FootPrint> findByRoomIdAndTimestampBetween(Long roomId, Date startTime, Date endTime, Pageable pageable);
    
    /**
     * 统计操作人的操作次数
     */
    @Query("SELECT COUNT(f) FROM FootPrint f WHERE f.operatorId = :operatorId")
    long countByOperatorId(@Param("operatorId") Long operatorId);
    
    /**
     * 统计某个时间范围内的操作次数
     */
    @Query("SELECT COUNT(f) FROM FootPrint f WHERE f.timestamp BETWEEN :startTime AND :endTime")
    long countByTimestampBetween(@Param("startTime") Date startTime, @Param("endTime") Date endTime);
    
    /**
     * 获取最近的操作记录
     */
    List<FootPrint> findTop10ByOrderByTimestampDesc();
    
    /**
     * 删除指定时间之前的记录（用于清理历史数据）
     */
    @Modifying
    @Query("DELETE FROM FootPrint f WHERE f.timestamp < :cutoffDate")
    void deleteByTimestampBefore(@Param("cutoffDate") Date cutoffDate);
    
    /**
     * 自定义复合查询
     */
    @Query("SELECT f FROM FootPrint f WHERE " +
           "(:operatorId IS NULL OR f.operatorId = :operatorId) AND " +
           "(:userId IS NULL OR f.userId = :userId) AND " +
           "(:applicationId IS NULL OR f.applicationId = :applicationId) AND " +
           "(:roomId IS NULL OR f.roomId = :roomId) AND " +
           "(:action IS NULL OR f.action = :action) AND " +
           "(:startTime IS NULL OR f.timestamp >= :startTime) AND " +
           "(:endTime IS NULL OR f.timestamp <= :endTime)")
    Page<FootPrint> findByConditions(
        @Param("operatorId") Long operatorId,
        @Param("userId") Long userId,
        @Param("applicationId") Long applicationId,
        @Param("roomId") Long roomId,
        @Param("action") String action,
        @Param("startTime") Date startTime,
        @Param("endTime") Date endTime,
        Pageable pageable
    );
    
    /**
     * 获取用户主动操作的记录（只包括作为操作人的记录）
     */
    Page<FootPrint> findByOperatorIdOrderByTimestampDesc(Long operatorId, Pageable pageable);
    
    /**
     * 获取用户相关的所有记录（包括用户操作的+用户被操作的+相关申请的）
     * 包括：operatorId = userId 或 userId = targetUserId 或 applicationId in (用户的申请)
     */
    @Query("SELECT DISTINCT f FROM FootPrint f LEFT JOIN Application a ON f.applicationId = a.id " +
           "WHERE f.operatorId = :targetUserId " +
           "   OR f.userId = :targetUserId " +
           "   OR a.userId = :targetUserId " +
           "ORDER BY f.timestamp DESC")
    Page<FootPrint> findUserRelatedFootPrints(@Param("targetUserId") Long targetUserId, Pageable pageable);
    
    /**
     * 获取房间相关的所有记录（包括对房间的直接操作+相关申请）
     * 包括：roomId = targetRoomId 或 applicationId in (房间的申请)
     */
    @Query("SELECT DISTINCT f FROM FootPrint f LEFT JOIN Application a ON f.applicationId = a.id " +
           "WHERE f.roomId = :targetRoomId " +
           "   OR a.roomId = :targetRoomId " +
           "ORDER BY f.timestamp DESC")
    Page<FootPrint> findRoomRelatedFootPrints(@Param("targetRoomId") Long targetRoomId, Pageable pageable);
    
    /**
     * 根据申请ID查找相关记录，并同时查找该申请涉及的用户和房间的相关记录
     */
    @Query("SELECT DISTINCT f FROM FootPrint f LEFT JOIN Application a ON f.applicationId = a.id " +
           "LEFT JOIN Application targetApp ON targetApp.id = :applicationId " +
           "WHERE f.applicationId = :applicationId " +
           "   OR (targetApp.userId IS NOT NULL AND (f.operatorId = targetApp.userId OR f.userId = targetApp.userId)) " +
           "   OR (targetApp.roomId IS NOT NULL AND (f.roomId = targetApp.roomId OR a.roomId = targetApp.roomId)) " +
           "ORDER BY f.timestamp DESC")
    Page<FootPrint> findApplicationRelatedFootPrints(@Param("applicationId") Long applicationId, Pageable pageable);
    
    /**
     * 统计用户相关的操作次数（包括主动操作和被操作）
     */
    @Query("SELECT COUNT(DISTINCT f) FROM FootPrint f LEFT JOIN Application a ON f.applicationId = a.id " +
           "WHERE f.operatorId = :targetUserId " +
           "   OR f.userId = :targetUserId " +
           "   OR a.userId = :targetUserId")
    long countUserRelatedFootPrints(@Param("targetUserId") Long targetUserId);
    
    /**
     * 统计房间相关的操作次数（包括直接操作和申请操作）
     */
    @Query("SELECT COUNT(DISTINCT f) FROM FootPrint f LEFT JOIN Application a ON f.applicationId = a.id " +
           "WHERE f.roomId = :targetRoomId " +
           "   OR a.roomId = :targetRoomId")
    long countRoomRelatedFootPrints(@Param("targetRoomId") Long targetRoomId);
    
    /**
     * 按时间范围查询用户相关记录
     */
    @Query("SELECT DISTINCT f FROM FootPrint f LEFT JOIN Application a ON f.applicationId = a.id " +
           "WHERE (f.operatorId = :targetUserId " +
           "   OR f.userId = :targetUserId " +
           "   OR a.userId = :targetUserId) " +
           "   AND f.timestamp BETWEEN :startTime AND :endTime " +
           "ORDER BY f.timestamp DESC")
    Page<FootPrint> findUserRelatedFootPrintsByTimeRange(
        @Param("targetUserId") Long targetUserId, 
        @Param("startTime") Date startTime, 
        @Param("endTime") Date endTime, 
        Pageable pageable);
    
    /**
     * 按时间范围查询房间相关记录
     */
    @Query("SELECT DISTINCT f FROM FootPrint f LEFT JOIN Application a ON f.applicationId = a.id " +
           "WHERE (f.roomId = :targetRoomId " +
           "   OR a.roomId = :targetRoomId) " +
           "   AND f.timestamp BETWEEN :startTime AND :endTime " +
           "ORDER BY f.timestamp DESC")
    Page<FootPrint> findRoomRelatedFootPrintsByTimeRange(
        @Param("targetRoomId") Long targetRoomId, 
        @Param("startTime") Date startTime, 
        @Param("endTime") Date endTime, 
        Pageable pageable);
}
