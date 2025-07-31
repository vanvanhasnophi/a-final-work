package com.roomx.service;

import java.util.List;

import com.roomx.model.dto.ApplicationDTO;
import com.roomx.model.dto.ApplicationQuery;
import com.roomx.model.dto.PageResult;

public interface ApplicationService {
    ApplicationDTO apply(ApplicationDTO applicationDTO);
    ApplicationDTO modify(Long applicationId, ApplicationDTO applicationDTO);
    ApplicationDTO get(Long applicationId);
    void approve(Long applicationId, String reason);
    void reject(Long applicationId, String reason);
    void cancel(Long applicationId, String reason);
    
    PageResult<ApplicationDTO> page(ApplicationQuery query, int pageNum, int pageSize, java.util.Date queryDate);
    
    // 获取所有申请（不支持筛选）
    List<ApplicationDTO> getAllApplications();
    
    // 查询房间未来的已批准预约
    List<ApplicationDTO> getFutureApprovedApplications(Long roomId);
    
    // 检查时间冲突
    boolean hasTimeConflict(Long roomId, java.util.Date startTime, java.util.Date endTime, Long excludeApplicationId);
}
