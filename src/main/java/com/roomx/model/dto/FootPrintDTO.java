package com.roomx.model.dto;

import java.util.Date;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.Data;

@Data
public class FootPrintDTO {
    private Long id;
    private Long operatorId;
    private Long userId;
    private Long applicationId;
    private Long roomId;
    private String action;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date timestamp;
    
    private String desc;
    
    // 临时信息字段
    private String tempInfo;
    
    // 扩展字段，用于前端显示
    private String operatorName;
    private String userName;
    private String roomName;
    private String applicationName;
    
    // 可见性控制字段（不存储在数据库，由 service 层计算）
    private boolean visible = true;
    
    // 操作可见性级别（根据CSV规则：admin, approver, operator, none）
    private String operator;
}
