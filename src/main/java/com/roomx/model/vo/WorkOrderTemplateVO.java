package com.roomx.model.vo;

import java.util.Date;

import com.roomx.constant.enums.OrderType;
import com.roomx.constant.enums.WorkOrderPriority;

import lombok.Data;

@Data
public class WorkOrderTemplateVO {
    private Long id;
    private String name;
    private String description;
    private String category;
    private OrderType orderType;
    private String orderTypeDesc;
    private WorkOrderPriority defaultPriority;
    private String defaultPriorityDesc;
    private String titleTemplate;
    private String descriptionTemplate;
    private String requiredFields;
    private String optionalFields;
    private String defaultTags;
    private String defaultAssigneeRole;
    private Integer estimatedHours;
    private Boolean isEnabled;
    private Integer usageCount;
    private Long creatorId;
    private String creatorName;
    private Date createTime;
    private String createTimeStr;
    private Date updateTime;
    private String updateTimeStr;
    
    // 扩展字段
    private String categoryDesc;
    private String statusColor;
    private Boolean canEdit;
    private Boolean canDelete;
} 