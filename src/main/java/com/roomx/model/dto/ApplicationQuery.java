package com.roomx.model.dto;

import java.util.Date;

import com.roomx.constant.enums.ApplicationStatus;
import com.roomx.constant.enums.RoomType;

import lombok.Data;

@Data
public class ApplicationQuery {
    private Long userId;
    private String user; // 统一搜索字段，同时搜索用户名和昵称
    private String username; // 保留严格搜索功能
    private String nickname; // 保留严格搜索功能

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
    private Boolean showExpired; // 是否显示过期申请
    // queryDate字段已移除，现在在控制器中手动处理
} 