package com.roomx.service;

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
    
    PageResult<ApplicationDTO> page(ApplicationQuery query, int pageNum, int pageSize);
}
