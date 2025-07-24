package com.roomx.entity;

import java.util.Date;

public class Application {
    private Long id;
    private Long userId;
    private Long roomId;
    private Long crowd;
    private String reason;
    private Status status;
    private Date createTime;
    private Date updateTime;
    public enum Status {
        PENDING, // 待审批
        APPROVED, // 已批准
        REJECTED, // 已拒绝
        CANCELLED, // 已取消
        COMPLETED, // 已完成
        EXPIRED // 已过期
    }

    // getter/setter
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getRoomId() {
        return roomId;
    }

    public void setRoomId(Long roomId) {
        this.roomId = roomId;
    }

    public Long getCrowd() {
        return crowd;
    }

    public void setCrowd(Long crowd) {
        this.crowd = crowd;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public Date getCreateTime() {
        return createTime;
    }

    public void setCreateTime(Date createTime) {
        this.createTime = createTime;
    }

    public Date getUpdateTime() {
        return updateTime;
    }

    public void setUpdateTime(Date updateTime) {
        this.updateTime = updateTime;
    }


}
