package com.roomx.model.dto;

import lombok.Data;

@Data
public class FootPrintCreateDTO {
    private Long userId;
    private Long applicationId;
    private Long roomId;
    private String action;
    private String desc;
    private String tempInfo; // 临时信息字段
    
    // operatorId 和 timestamp 将在 service 中自动设置
}
