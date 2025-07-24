package com.roomx.entity;

import java.util.Date;

public class Room {
    private Long id;
    private String name;
    private String description;
    private Type type;
    private Long capacity;
    private String location;
    private Status status;
    private Date createTime;
    private Date updateTime;
    private Date lastMaintenanceTime;

    public enum Status {
        AVAILABLE, // 可用, 默认
        UNAVAILABLE, // 不可用
        MAINTENANCE, // 维修中
        RESERVED, // 已预约
        USING, // 使用中
        CLEANING // 清洁中
    }

    public enum Type {
       LECTURE_ROOM,SEMINAR_ROOM,CASE_ROOM,NO_TYPE
    }

    // getter/setter
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Type getType() {
        return type;
    }

    public void setType(Type type) {
        this.type = type;
    }

    public Long getCapacity() {
        return capacity;
    }

    public void setCapacity(Long capacity) {
        this.capacity = capacity;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
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
