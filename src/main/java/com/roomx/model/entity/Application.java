package com.roomx.entity;

import java.util.Date;
import com.roomx.enums.ApplicationStatus;

public class Application {
    private Long id;
    private Long userId;
    private Long roomId;
    private Long crowd;
    private String reason;
    private ApplicationStatus status;
    private Date createTime;
    private Date updateTime;
    private Date startTime;
    private Date endTime;

    // constructor
    public Application() {
        this.createTime = new Date();
        this.updateTime = this.createTime;
        this.status = ApplicationStatus.PENDING;
    }

    public Application(Long userId, Long roomId, Long crowd, String reason, Date startTime, Date endTime) {
        this.userId = userId;
        this.roomId = roomId;
        this.crowd = crowd;
        this.reason = reason;
        this.startTime = startTime;
        this.endTime = endTime;
        this.createTime = new Date();
        this.updateTime = this.createTime;
        this.status = ApplicationStatus.PENDING;
    }
    // getter/setter

    public void update(Application application, Date updateTime) {
        this.id = application.getId();
        this.userId = application.getUserId();
        this.roomId = application.getRoomId();
        this.crowd = application.getCrowd();
        this.reason = application.getReason();
        this.status = application.getStatus();
        this.createTime = application.getCreateTime();
        this.updateTime = updateTime;
        this.startTime = application.getStartTime();
        this.endTime = application.getEndTime();
    }

    public void update(Application application) {
        this.id = application.getId();
        this.userId = application.getUserId();
        this.roomId = application.getRoomId();
        this.crowd = application.getCrowd();
        this.reason = application.getReason();
        this.status = application.getStatus();
        this.createTime = application.getCreateTime();
        this.updateTime = new Date();
        this.startTime = application.getStartTime();
        this.endTime = application.getEndTime();
    }

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

    public ApplicationStatus getStatus() {
        return status;
    }

    public void setStatus(ApplicationStatus status) {
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

    public Date getExpireTime() {
        return expireTime;
    }

    public void setExpireTime(Date expireTime) {
        this.expireTime = expireTime;
    }

    public Date getStartTime() {
        return startTime;
    }

    public void setStartTime(Date startTime) {
        this.startTime = startTime;
    }   

    public Date getEndTime() {
        return endTime;
    }

    public void setEndTime(Date endTime) {
        this.endTime = endTime;
    }

}
