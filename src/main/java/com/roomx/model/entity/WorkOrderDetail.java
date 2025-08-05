package com.roomx.model.entity;

import java.util.Date;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "work_order_detail")
public class WorkOrderDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // 关联的工单ID
    @Column(name = "work_order_id", nullable = false, unique = true)
    private Long workOrderId;
    
    // 详细描述（富文本格式）
    @Column(name = "detailed_description", columnDefinition = "TEXT")
    private String detailedDescription;
    
    // 问题分析
    @Column(name = "problem_analysis", columnDefinition = "TEXT")
    private String problemAnalysis;
    
    // 解决方案
    @Column(name = "solution", columnDefinition = "TEXT")
    private String solution;
    
    // 处理步骤（JSON格式）
    @Column(name = "processing_steps", columnDefinition = "TEXT")
    private String processingSteps;
    
    // 技术参数（JSON格式）
    @Column(name = "technical_params", columnDefinition = "TEXT")
    private String technicalParams;
    
    // 成本信息（JSON格式）
    @Column(name = "cost_info", columnDefinition = "TEXT")
    private String costInfo;
    
    // 材料清单（JSON格式）
    @Column(name = "material_list", columnDefinition = "TEXT")
    private String materialList;
    
    // 工具清单（JSON格式）
    @Column(name = "tool_list", columnDefinition = "TEXT")
    private String toolList;
    
    // 安全注意事项
    @Column(name = "safety_notes", columnDefinition = "TEXT")
    private String safetyNotes;
    
    // 质量检查标准
    @Column(name = "quality_standards", columnDefinition = "TEXT")
    private String qualityStandards;
    
    // 验收标准
    @Column(name = "acceptance_criteria", columnDefinition = "TEXT")
    private String acceptanceCriteria;
    
    // 历史记录（JSON格式）
    @Column(name = "history_records", columnDefinition = "TEXT")
    private String historyRecords;
    
    // 相关文档（JSON格式）
    @Column(name = "related_documents", columnDefinition = "TEXT")
    private String relatedDocuments;
    
    // 外部系统集成信息（JSON格式）
    @Column(name = "external_integrations", columnDefinition = "TEXT")
    private String externalIntegrations;
    
    // 自定义字段（JSON格式）
    @Column(name = "custom_fields", columnDefinition = "TEXT")
    private String customFields;
    
    // 元数据（JSON格式）
    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata;
    
    // 时间信息
    @Column(name = "create_time", nullable = false)
    private Date createTime;
    
    @Column(name = "update_time", nullable = false)
    private Date updateTime;
    
    // 版本信息
    @Column(name = "version")
    private Integer version = 1;
    
    // 是否已归档
    @Column(name = "is_archived")
    private Boolean isArchived = false;
    
    // 归档时间
    @Column(name = "archive_time")
    private Date archiveTime;
    
    // 构造函数
    public WorkOrderDetail() {
        this.createTime = new Date();
        this.updateTime = this.createTime;
    }
    
    // 更新版本
    public void incrementVersion() {
        this.version = (this.version == null ? 1 : this.version) + 1;
        this.updateTime = new Date();
    }
    
    // 归档
    public void archive() {
        this.isArchived = true;
        this.archiveTime = new Date();
        this.updateTime = this.archiveTime;
    }
    
    // 取消归档
    public void unarchive() {
        this.isArchived = false;
        this.archiveTime = null;
        this.updateTime = new Date();
    }
} 