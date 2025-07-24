package com.roomx.service;

import com.roomx.entity.Application;
import java.util.List;

public interface ApplicationService {
    Application apply(Application application);
    Application modify(Long applicationId, Application application);
    List<Application> list();
    List<Application> listByUser(Long userId);
    List<Application> listByRoom(Long roomId);
    Application get(Long id);
    void approve(Long applicationId, String reason);
    void reject(Long applicationId, String reason);
    void cancel(Long applicationId, String reason);
    
    
}
