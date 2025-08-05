package com.roomx.model.dto;

import java.util.Date;
import java.util.List;

import com.roomx.constant.enums.OrderType;
import com.roomx.constant.enums.WorkOrderPriority;

import lombok.Data;

@Data
public class WorkOrderCreateRequest {
    // 工单基本信息
    private String title;
    private String description;
    private OrderType orderType;
    private WorkOrderPriority priority;
    
    // 房间信息
    private Long roomId;
    
    // 标签和附件
    private String tags;
    private List<String> attachments;
    
    // 时间信息
    private Date expectedCompletionTime;
    
    // 备注
    private String remarks;
    
    // 模板ID（如果使用模板）
    private Long templateId;
    
    // 自定义字段（JSON格式）
    private String customFields;
} 