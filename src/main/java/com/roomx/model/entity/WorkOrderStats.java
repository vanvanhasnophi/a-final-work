package com.roomx.model.entity;

import java.util.Date;

import com.roomx.constant.enums.OrderType;
import com.roomx.constant.enums.WorkOrderPriority;
import com.roomx.constant.enums.WorkOrderStatus;

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
@Table(name = "work_order_stats")
public class WorkOrderStats {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // 统计日期
    @Column(name = "stats_date", nullable = false)
    private Date statsDate;
    
    // 统计类型：日统计、周统计、月统计
    @Column(name = "stats_type", length = 20, nullable = false)
    private String statsType;
    
    // 工单类型
    @Enumerated(EnumType.STRING)
    @Column(name = "order_type")
    private OrderType orderType;
    
    // 工单状态
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private WorkOrderStatus status;
    
    // 工单优先级
    @Enumerated(EnumType.STRING)
    @Column(name = "priority")
    private WorkOrderPriority priority;
    
    // 处理人ID
    @Column(name = "assignee_id")
    private Long assigneeId;
    
    @Column(name = "assignee_name", length = 100)
    private String assigneeName;
    
    // 房间ID
    @Column(name = "room_id")
    private Long roomId;
    
    @Column(name = "room_name", length = 100)
    private String roomName;
    
    // 统计数据
    @Column(name = "total_count")
    private Integer totalCount = 0;
    
    @Column(name = "completed_count")
    private Integer completedCount = 0;
    
    @Column(name = "cancelled_count")
    private Integer cancelledCount = 0;
    
    @Column(name = "rejected_count")
    private Integer rejectedCount = 0;
    
    // 平均处理时间（分钟）
    @Column(name = "avg_processing_time")
    private Double avgProcessingTime;
    
    // 平均评分
    @Column(name = "avg_rating")
    private Double avgRating;
    
    // 满意度统计
    @Column(name = "satisfaction_count")
    private Integer satisfactionCount = 0;
    
    @Column(name = "dissatisfaction_count")
    private Integer dissatisfactionCount = 0;
    
    // 时间信息
    @Column(name = "create_time", nullable = false)
    private Date createTime;
    
    @Column(name = "update_time", nullable = false)
    private Date updateTime;

    // 构造函数
    public WorkOrderStats() {
        this.createTime = new Date();
        this.updateTime = this.createTime;
    }
    
    // 计算完成率
    public Double getCompletionRate() {
        if (totalCount == null || totalCount == 0) {
            return 0.0;
        }
        return (double) completedCount / totalCount * 100;
    }
    
    // 计算满意度率
    public Double getSatisfactionRate() {
        int totalFeedback = (satisfactionCount == null ? 0 : satisfactionCount) + 
                           (dissatisfactionCount == null ? 0 : dissatisfactionCount);
        if (totalFeedback == 0) {
            return 0.0;
        }
        return (double) satisfactionCount / totalFeedback * 100;
    }
} 