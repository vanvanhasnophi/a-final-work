package com.roomx.model.vo;

import java.util.Date;

import lombok.Data;

/**
 * 值班表VO
 */
@Data
public class DutyScheduleVO {
    private Long id;
    private Date dutyDate;
    private String dutyUserName;
    private String dutyUserNickname;
    private String dutyUserEmail;
    private String dutyUserPhone;
    private String remark;
    private String createdByName;
    private Date createTime;
}
