package com.roomx.model.dto;

import java.util.Date;
import java.util.Map;

import lombok.Data;

@Data
public class WorkOrderDetailDTO {
    private Long id;
    private Long workOrderId;
    private String detailedDescription;
    private String problemAnalysis;
    private String solution;
    private String processingSteps;
    private String technicalParams;
    private String costInfo;
    private String materialList;
    private String toolList;
    private String safetyNotes;
    private String qualityStandards;
    private String acceptanceCriteria;
    private String historyRecords;
    private String relatedDocuments;
    private String externalIntegrations;
    private String customFields;
    private String metadata;
    private Date createTime;
    private Date updateTime;
    private Integer version;
    private Boolean isArchived;
    private Date archiveTime;
    
    // 扩展字段
    private Map<String, Object> parsedProcessingSteps;
    private Map<String, Object> parsedTechnicalParams;
    private Map<String, Object> parsedCostInfo;
    private Map<String, Object> parsedMaterialList;
    private Map<String, Object> parsedToolList;
    private Map<String, Object> parsedHistoryRecords;
    private Map<String, Object> parsedRelatedDocuments;
    private Map<String, Object> parsedExternalIntegrations;
    private Map<String, Object> parsedCustomFields;
    private Map<String, Object> parsedMetadata;
} 