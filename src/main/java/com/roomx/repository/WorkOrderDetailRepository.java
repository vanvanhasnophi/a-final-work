package com.roomx.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.roomx.model.entity.WorkOrderDetail;

@Repository
public interface WorkOrderDetailRepository extends JpaRepository<WorkOrderDetail, Long> {
    
    // 根据工单ID查询详情
    Optional<WorkOrderDetail> findByWorkOrderId(Long workOrderId);
    
    // 根据工单ID和版本查询
    Optional<WorkOrderDetail> findByWorkOrderIdAndVersion(Long workOrderId, Integer version);
    
    // 根据是否归档查询
    Optional<WorkOrderDetail> findByWorkOrderIdAndIsArchived(Long workOrderId, Boolean isArchived);
    
    // 查询最新版本
    @Query("SELECT wd FROM WorkOrderDetail wd WHERE wd.workOrderId = :workOrderId ORDER BY wd.version DESC")
    Optional<WorkOrderDetail> findLatestByWorkOrderId(@Param("workOrderId") Long workOrderId);
    
    // 查询所有版本
    @Query("SELECT wd FROM WorkOrderDetail wd WHERE wd.workOrderId = :workOrderId ORDER BY wd.version ASC")
    java.util.List<WorkOrderDetail> findAllVersionsByWorkOrderId(@Param("workOrderId") Long workOrderId);
    
    // 检查是否存在详情
    boolean existsByWorkOrderId(Long workOrderId);
    
    // 删除工单的所有详情
    void deleteByWorkOrderId(Long workOrderId);
} 