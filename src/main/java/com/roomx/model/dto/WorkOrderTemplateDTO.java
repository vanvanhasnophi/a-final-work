package com.roomx.model.dto;

import java.util.Date;

import com.roomx.constant.enums.OrderType;
import com.roomx.constant.enums.WorkOrderPriority;

import lombok.Data;

@Data
public class WorkOrderTemplateDTO {
    private Long id;
    private String name;
    private String description;
    private String category;
    private OrderType orderType;
    private WorkOrderPriority defaultPriority;
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
    private Date updateTime;
} 