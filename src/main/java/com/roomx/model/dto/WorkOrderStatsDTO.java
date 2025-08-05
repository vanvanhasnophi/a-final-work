package com.roomx.model.dto;

import java.util.Date;

import com.roomx.constant.enums.OrderType;
import com.roomx.constant.enums.WorkOrderPriority;
import com.roomx.constant.enums.WorkOrderStatus;

import lombok.Data;

@Data
public class WorkOrderStatsDTO {
    private Long id;
    private Date statsDate;
    private String statsType;
    private OrderType orderType;
    private WorkOrderStatus status;
    private WorkOrderPriority priority;
    private Long assigneeId;
    private String assigneeName;
    private Long roomId;
    private String roomName;
    private Integer totalCount;
    private Integer completedCount;
    private Integer cancelledCount;
    private Integer rejectedCount;
    private Double avgProcessingTime;
    private Double avgRating;
    private Integer satisfactionCount;
    private Integer dissatisfactionCount;
    private Date createTime;
    private Date updateTime;
    
    // 计算字段
    private Double completionRate;
    private Double satisfactionRate;
} 