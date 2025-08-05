package com.roomx.model.entity;

import java.util.Date;

import com.roomx.constant.enums.OrderType;
import com.roomx.constant.enums.WorkOrderPriority;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "work_order_template")
public class WorkOrderTemplate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // 模板名称
    @Column(name = "name", nullable = false, length = 100)
    private String name;
    
    // 模板描述
    @Column(name = "description", length = 500)
    private String description;
    
    // 模板分类
    @Column(name = "category", length = 50)
    private String category;
    
    // 工单类型
    @Enumerated(EnumType.STRING)
    @Column(name = "order_type", nullable = false)
    private OrderType orderType;
    
    // 默认优先级
    @Enumerated(EnumType.STRING)
    @Column(name = "default_priority")
    private WorkOrderPriority defaultPriority;
    
    // 模板内容
    @Column(name = "title_template", length = 200)
    private String titleTemplate;
    
    @Column(name = "description_template", columnDefinition = "TEXT")
    private String descriptionTemplate;
    
    // 必填字段配置（JSON格式）
    @Column(name = "required_fields", columnDefinition = "TEXT")
    private String requiredFields;
    
    // 可选字段配置（JSON格式）
    @Column(name = "optional_fields", columnDefinition = "TEXT")
    private String optionalFields;
    
    // 默认标签
    @Column(name = "default_tags", length = 500)
    private String defaultTags;
    
    // 默认处理人角色
    @Column(name = "default_assignee_role", length = 50)
    private String defaultAssigneeRole;
    
    // 预计完成时间（小时）
    @Column(name = "estimated_hours")
    private Integer estimatedHours;
    
    // 是否启用
    @Column(name = "is_enabled")
    private Boolean isEnabled = true;
    
    // 使用次数
    @Column(name = "usage_count")
    private Integer usageCount = 0;
    
    // 创建者信息
    @Column(name = "creator_id")
    private Long creatorId;
    
    @Column(name = "creator_name", length = 100)
    private String creatorName;
    
    // 时间信息
    @Column(name = "create_time", nullable = false)
    private Date createTime;
    
    @Column(name = "update_time", nullable = false)
    private Date updateTime;

    // 构造函数
    public WorkOrderTemplate() {
        this.createTime = new Date();
        this.updateTime = this.createTime;
    }
    
    // 增加使用次数
    public void incrementUsageCount() {
        this.usageCount = (this.usageCount == null ? 0 : this.usageCount) + 1;
    }
} 