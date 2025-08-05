package com.roomx.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.roomx.constant.enums.OrderType;
import com.roomx.constant.enums.WorkOrderPriority;
import com.roomx.model.entity.WorkOrderTemplate;

@Repository
public interface WorkOrderTemplateRepository extends JpaRepository<WorkOrderTemplate, Long> {
    
    // 根据是否启用查询
    Page<WorkOrderTemplate> findByIsEnabled(Boolean isEnabled, Pageable pageable);
    
    // 根据类型查询
    Page<WorkOrderTemplate> findByOrderType(OrderType orderType, Pageable pageable);
    
    // 根据分类查询
    Page<WorkOrderTemplate> findByCategory(String category, Pageable pageable);
    
    // 根据创建者查询
    Page<WorkOrderTemplate> findByCreatorId(Long creatorId, Pageable pageable);
    
    // 根据名称模糊查询
    Page<WorkOrderTemplate> findByNameContaining(String name, Pageable pageable);
    
    // 根据描述模糊查询
    Page<WorkOrderTemplate> findByDescriptionContaining(String description, Pageable pageable);
    
    // 根据类型和是否启用查询
    Page<WorkOrderTemplate> findByOrderTypeAndIsEnabled(OrderType orderType, Boolean isEnabled, Pageable pageable);
    
    // 根据分类和是否启用查询
    Page<WorkOrderTemplate> findByCategoryAndIsEnabled(String category, Boolean isEnabled, Pageable pageable);
    
    // 根据默认优先级查询
    Page<WorkOrderTemplate> findByDefaultPriority(WorkOrderPriority defaultPriority, Pageable pageable);
    
    // 根据默认处理人角色查询
    Page<WorkOrderTemplate> findByDefaultAssigneeRole(String defaultAssigneeRole, Pageable pageable);
    
    // 统计各类型的模板数量
    @Query("SELECT wt.orderType, COUNT(wt) FROM WorkOrderTemplate wt GROUP BY wt.orderType")
    List<Object[]> countByOrderType();
    
    // 统计各分类的模板数量
    @Query("SELECT wt.category, COUNT(wt) FROM WorkOrderTemplate wt GROUP BY wt.category")
    List<Object[]> countByCategory();
    
    // 统计各优先级的模板数量
    @Query("SELECT wt.defaultPriority, COUNT(wt) FROM WorkOrderTemplate wt GROUP BY wt.defaultPriority")
    List<Object[]> countByDefaultPriority();
    
    // 统计创建者的模板数量
    @Query("SELECT wt.creatorId, wt.creatorName, COUNT(wt) FROM WorkOrderTemplate wt GROUP BY wt.creatorId, wt.creatorName")
    List<Object[]> countByCreator();
    
    // 查询使用次数最多的模板
    @Query("SELECT wt FROM WorkOrderTemplate wt ORDER BY wt.usageCount DESC")
    List<WorkOrderTemplate> findTopUsedTemplates(Pageable pageable);
    
    // 根据名称或描述模糊查询
    @Query("SELECT wt FROM WorkOrderTemplate wt WHERE wt.name LIKE %:keyword% OR wt.description LIKE %:keyword%")
    Page<WorkOrderTemplate> findByNameOrDescriptionContaining(@Param("keyword") String keyword, Pageable pageable);
} 