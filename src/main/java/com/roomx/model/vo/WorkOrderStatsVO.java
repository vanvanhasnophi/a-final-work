package com.roomx.model.vo;

import java.util.Date;

import com.roomx.constant.enums.OrderType;
import com.roomx.constant.enums.WorkOrderPriority;
import com.roomx.constant.enums.WorkOrderStatus;

import lombok.Data;

@Data
public class WorkOrderStatsVO {
    private Long id;
    private Date statsDate;
    private String statsDateStr;
    private String statsType;
    private OrderType orderType;
    private String orderTypeDesc;
    private WorkOrderStatus status;
    private String statusDesc;
    private WorkOrderPriority priority;
    private String priorityDesc;
    private Long assigneeId;
    private String assigneeName;
    private Long roomId;
    private String roomName;
    private Integer totalCount;
    private Integer completedCount;
    private Integer cancelledCount;
    private Integer rejectedCount;
    private Double avgProcessingTime;
    private String avgProcessingTimeStr;
    private Double avgRating;
    private Integer satisfactionCount;
    private Integer dissatisfactionCount;
    private Date createTime;
    private String createTimeStr;
    private Date updateTime;
    private String updateTimeStr;
    
    // 计算字段
    private Double completionRate;
    private String completionRateStr;
    private Double satisfactionRate;
    private String satisfactionRateStr;
    private String statusColor;
    private String priorityColor;
} 