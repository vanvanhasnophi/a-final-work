package com.roomx.model.dto;

import java.util.Date;
import java.util.List;

import com.roomx.constant.enums.OrderType;
import com.roomx.constant.enums.WorkOrderPriority;
import com.roomx.constant.enums.WorkOrderStatus;

import lombok.Data;

@Data
public class WorkOrderStatsQuery {
    // 统计类型
    private String statsType; // DAILY, WEEKLY, MONTHLY
    
    // 时间范围
    private Date startDate;
    private Date endDate;
    
    // 过滤条件
    private List<OrderType> orderTypes;
    private List<WorkOrderStatus> statuses;
    private List<WorkOrderPriority> priorities;
    private List<Long> assigneeIds;
    private List<Long> roomIds;
    
    // 分组维度
    private String groupBy; // orderType, status, priority, assignee, room
    
    // 排序
    private String sortBy = "statsDate";
    private String sortOrder = "DESC";
} 