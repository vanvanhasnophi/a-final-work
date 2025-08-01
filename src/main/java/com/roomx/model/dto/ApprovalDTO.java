package com.roomx.model.dto;

import lombok.Data;

@Data
public class ApprovalDTO {
    private Long applicationId;
    private Boolean approved; // true表示批准，false表示拒绝
    private String reason; // 审批意见
} 