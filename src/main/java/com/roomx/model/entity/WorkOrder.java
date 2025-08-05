package com.roomx.model.entity;

import java.util.Date;

import com.roomx.constant.enums.OrderType;
import com.roomx.constant.enums.WorkOrderPriority;
import com.roomx.constant.enums.WorkOrderStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "work_order")
public class WorkOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // 工单编号，用于业务标识
    @Column(name = "order_no", unique = true, nullable = false, length = 50)
    private String orderNo;
    
    // 工单标题
    @Column(name = "title", nullable = false, length = 200)
    private String title;
    
    // 工单描述（冗余存储，避免JOIN查询）
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    // 工单类型
    @Enumerated(EnumType.STRING)
    @Column(name = "order_type", nullable = false)
    private OrderType orderType;
    
    // 工单状态
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private WorkOrderStatus status;
    
    // 工单优先级
    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false)
    private WorkOrderPriority priority;
    
    // 提交人信息（冗余存储）
    @Column(name = "submitter_id", nullable = false)
    private Long submitterId;
    
    @Column(name = "submitter_name", length = 100)
    private String submitterName;
    
    @Column(name = "submitter_role", length = 50)
    private String submitterRole;
    
    @Column(name = "submitter_phone", length = 20)
    private String submitterPhone;
    
    @Column(name = "submitter_email", length = 100)
    private String submitterEmail;
    
    // 处理人信息（冗余存储）
    @Column(name = "assignee_id")
    private Long assigneeId;
    
    @Column(name = "assignee_name", length = 100)
    private String assigneeName;
    
    @Column(name = "assignee_role", length = 50)
    private String assigneeRole;
    
    @Column(name = "assignee_phone", length = 20)
    private String assigneePhone;
    
    @Column(name = "assignee_email", length = 100)
    private String assigneeEmail;
    
    // 相关房间信息（冗余存储）
    @Column(name = "room_id")
    private Long roomId;
    
    @Column(name = "room_name", length = 100)
    private String roomName;
    
    @Column(name = "room_location", length = 200)
    private String roomLocation;
    
    @Column(name = "room_type", length = 50)
    private String roomType;
    
    @Column(name = "room_capacity")
    private Long roomCapacity;
    
    // 工单标签，用于分类和搜索
    @Column(name = "tags", length = 500)
    private String tags;
    
    // 附件信息（JSON格式，避免关联查询）
    @Column(name = "attachments", columnDefinition = "TEXT")
    private String attachments;
    
    // 时间信息
    @Column(name = "create_time", nullable = false)
    private Date createTime;
    
    @Column(name = "update_time", nullable = false)
    private Date updateTime;
    
    @Column(name = "expected_completion_time")
    private Date expectedCompletionTime;
    
    @Column(name = "actual_completion_time")
    private Date actualCompletionTime;
    
    // 备注信息
    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;
    
    // 处理结果
    @Column(name = "result", columnDefinition = "TEXT")
    private String result;
    
    // 评分（1-5分）
    @Column(name = "rating")
    private Integer rating;
    
    // 评价内容
    @Column(name = "feedback", columnDefinition = "TEXT")
    private String feedback;

    // 性能优化字段
    @Column(name = "processing_time_minutes")
    private Long processingTimeMinutes;
    
    @Column(name = "is_overdue")
    private Boolean isOverdue = false;
    
    @Column(name = "comment_count")
    private Integer commentCount = 0;
    
    @Column(name = "attachment_count")
    private Integer attachmentCount = 0;
    
    // 搜索优化字段
    @Column(name = "search_keywords", length = 1000)
    private String searchKeywords;
    
    // 统计字段
    @Column(name = "view_count")
    private Integer viewCount = 0;
    
    @Column(name = "last_activity_time")
    private Date lastActivityTime;
    
    // 自定义字段（JSON格式，支持扩展）
    @Column(name = "custom_fields", columnDefinition = "TEXT")
    private String customFields;
    
    // 分离存储标识
    @Column(name = "detail_storage_type", length = 20)
    private String detailStorageType; // JSON, MONGODB, REDIS
    
    @Column(name = "detail_storage_id", length = 100)
    private String detailStorageId;

    // JPA关联，用于数据完整性检查，但不用于查询
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submitter_id", referencedColumnName = "id", insertable = false, updatable = false)
    private User submitter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id", referencedColumnName = "id", insertable = false, updatable = false)
    private User assignee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", referencedColumnName = "id", insertable = false, updatable = false)
    private Room room;

    // 构造函数
    public WorkOrder() {
        this.createTime = new Date();
        this.updateTime = this.createTime;
        this.status = WorkOrderStatus.PENDING;
        this.priority = WorkOrderPriority.MEDIUM;
        this.lastActivityTime = this.createTime;
    }
    
    // 生成工单编号
    public void generateOrderNo() {
        if (this.orderNo == null) {
            this.orderNo = "WO" + System.currentTimeMillis();
        }
    }
    
    // 同步提交人信息
    public void syncSubmitterInfo(User user) {
        if (user != null) {
            this.submitterId = user.getId();
            this.submitterName = user.getUsername();
            this.submitterRole = user.getRole() != null ? user.getRole().name() : null;
            this.submitterPhone = user.getPhone();
            this.submitterEmail = user.getEmail();
        }
    }
    
    // 同步处理人信息
    public void syncAssigneeInfo(User user) {
        if (user != null) {
            this.assigneeId = user.getId();
            this.assigneeName = user.getUsername();
            this.assigneeRole = user.getRole() != null ? user.getRole().name() : null;
            this.assigneePhone = user.getPhone();
            this.assigneeEmail = user.getEmail();
        }
    }
    
    // 同步房间信息
    public void syncRoomInfo(Room room) {
        if (room != null) {
            this.roomId = room.getId();
            this.roomName = room.getName();
            this.roomLocation = room.getLocation();
            this.roomType = room.getType() != null ? room.getType().name() : null;
            this.roomCapacity = room.getCapacity();
        }
    }
    
    // 更新工单状态
    public void updateStatus(WorkOrderStatus newStatus) {
        this.status = newStatus;
        this.updateTime = new Date();
        this.lastActivityTime = this.updateTime;
        
        if (newStatus == WorkOrderStatus.COMPLETED && this.actualCompletionTime == null) {
            this.actualCompletionTime = new Date();
            this.calculateProcessingTime();
        }
    }
    
    // 计算处理时间
    public void calculateProcessingTime() {
        if (this.createTime != null && this.actualCompletionTime != null) {
            long diffInMillies = this.actualCompletionTime.getTime() - this.createTime.getTime();
            this.processingTimeMinutes = diffInMillies / (1000 * 60);
        }
    }
    
    // 检查是否逾期
    public void checkOverdue() {
        if (this.expectedCompletionTime != null && this.status != WorkOrderStatus.COMPLETED 
            && this.status != WorkOrderStatus.CANCELLED && this.status != WorkOrderStatus.REJECTED) {
            this.isOverdue = new Date().after(this.expectedCompletionTime);
        }
    }
    
    // 更新搜索关键词
    public void updateSearchKeywords() {
        StringBuilder keywords = new StringBuilder();
        if (this.title != null) keywords.append(this.title).append(" ");
        if (this.description != null) keywords.append(this.description).append(" ");
        if (this.submitterName != null) keywords.append(this.submitterName).append(" ");
        if (this.assigneeName != null) keywords.append(this.assigneeName).append(" ");
        if (this.roomName != null) keywords.append(this.roomName).append(" ");
        if (this.tags != null) keywords.append(this.tags).append(" ");
        this.searchKeywords = keywords.toString().toLowerCase();
    }
    
    // 增加查看次数
    public void incrementViewCount() {
        this.viewCount = (this.viewCount == null ? 0 : this.viewCount) + 1;
    }
    
    // 增加评论数量
    public void incrementCommentCount() {
        this.commentCount = (this.commentCount == null ? 0 : this.commentCount) + 1;
        this.lastActivityTime = new Date();
    }
    
    // 减少评论数量
    public void decrementCommentCount() {
        this.commentCount = Math.max(0, (this.commentCount == null ? 0 : this.commentCount) - 1);
    }
    
    // 增加附件数量
    public void incrementAttachmentCount() {
        this.attachmentCount = (this.attachmentCount == null ? 0 : this.attachmentCount) + 1;
    }
    
    // 减少附件数量
    public void decrementAttachmentCount() {
        this.attachmentCount = Math.max(0, (this.attachmentCount == null ? 0 : this.attachmentCount) - 1);
    }
}