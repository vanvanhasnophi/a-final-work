package com.roomx.model.dto;

import java.util.Date;

import com.roomx.constant.enums.ApplicationStatus;
import com.roomx.constant.enums.RoomType;

import lombok.Data;

@Data
public class ApplicationQuery {
    private Long userId;
    private String username;
    private String nickname;

    private Long roomId;
    private String roomName;
    private String roomLocation;
    private RoomType roomType;
    private Long roomCapacity;

    private ApplicationStatus status;
    private String contact;
    private Date createTime;
    private Date updateTime;
    private Date startTime;
    private Date endTime;
    // queryDate字段已移除，现在在控制器中手动处理
} 