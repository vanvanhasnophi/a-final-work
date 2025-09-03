package com.roomx.model.dto;

import lombok.Data;

@Data
public class FootPrintQueryDTO {
    private Long operatorId;
    private Long userId;
    private Long applicationId;
    private Long roomId;
    private String action;
    private String startDate;
    private String endDate;
    
    // 分页参数
    private Integer page = 0;
    private Integer size = 10;
    private String sort = "timestamp";
    private String direction = "desc";
}
