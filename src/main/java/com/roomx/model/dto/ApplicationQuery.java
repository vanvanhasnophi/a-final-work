package com.roomx.model.dto;

import com.roomx.constant.enums.ApplicationStatus;
import com.roomx.constant.enums.RoomType;
import java.util.Date;
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
} 