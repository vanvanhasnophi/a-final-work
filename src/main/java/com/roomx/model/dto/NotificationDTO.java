package com.roomx.model.dto;

import java.util.Date;

import com.roomx.model.entity.Notification;

import lombok.Data;

@Data
public class NotificationDTO {
    private Long id;
    private String title;
    private String content;
    private String type;
    private String priority;
    private Boolean isRead;
    private Long userId;
    private Date createTime;
    private Date readTime;
    private String actionType;
    private String actionTarget;
    private Long relatedId;
    private String relatedType;

    public NotificationDTO() {}

    public NotificationDTO(Notification notification) {
        this.id = notification.getId();
        this.title = notification.getTitle();
        this.content = notification.getContent();
        this.type = notification.getType();
        this.priority = notification.getPriority();
        this.isRead = notification.getIsRead();
        this.userId = notification.getUserId();
        this.createTime = notification.getCreateTime();
        this.readTime = notification.getReadTime();
        this.actionType = notification.getActionType();
        this.actionTarget = notification.getActionTarget();
        this.relatedId = notification.getRelatedId();
        this.relatedType = notification.getRelatedType();
    }

    public static NotificationDTO fromEntity(Notification notification) {
        return new NotificationDTO(notification);
    }
} 