package com.roomx.model.dto;

import java.util.Date;

import lombok.Data;

/**
 * 值班表DTO
 */
@Data
public class DutyScheduleDTO {
    private Long id;
    private Date dutyDate;
    private Long dutyUserId;
    private String dutyUserName;
    private String dutyUserNickname;
    private String remark;
    private Long createdBy;
    private String createdByName;
    private Date createTime;
    private Date updateTime;
}
