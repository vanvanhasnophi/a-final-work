package com.roomx.service.impl;

import com.roomx.entity.Application;
import com.roomx.repository.ApplicationRepository;
import com.roomx.service.ApplicationService;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ApplicationServiceImpl implements ApplicationService {
    private final ApplicationRepository applicationRepository;

    public ApplicationServiceImpl(ApplicationRepository applicationRepository) {
        this.applicationRepository = applicationRepository;
    }

    @Override
    public Application apply(Application application) {
        return applicationRepository.save(application);
    }

    @Override
    public Application modify(Long applicationId, Application application) {
        Application existingApplication = applicationRepository.findById(applicationId).orElse(null);
        if (existingApplication != null) {
            existingApplication.update(application);
            return applicationRepository.save(existingApplication);
        }
        return null;
    }

    @Override
    public List<Application> list() {
        return applicationRepository.findAll();
    }   

    @Override
    public List<Application> listByUser(Long userId) {
        return applicationRepository.findByUserId(userId);
    }

    @Override
    public List<Application> listByRoom(Long roomId) {
        return applicationRepository.findByRoomId(roomId);
    }

    @Override
    public Application get(Long id) {
        return applicationRepository.findById(id).orElse(null);
    }

    @Override
    public void approve(Long applicationId) {
        Application application = applicationRepository.findById(applicationId).orElse(null);
        if (application != null) {
            application.setStatus(Application.Status.APPROVED);
            for(Application otherApplication : applicationRepository.findByRoomId(application.getRoomId())) {
                if(otherApplication.getStatus() == Application.Status.PENDING) {
                    otherApplication.setStatus(Application.Status.SUSPENDED);// 挂起其他申请
                }
            }
            applicationRepository.save(application);
        }
    }

    @Override
    public void reject(Long applicationId) {
        Application application = applicationRepository.findById(applicationId).orElse(null);
        if (application != null) {
            application.setStatus(Application.Status.REJECTED);
            applicationRepository.save(application);
        }
    }


    @Override
    public void cancel(Long applicationId) {
        Application application = applicationRepository.findById(applicationId).orElse(null);
        if (application != null) {
            application.setStatus(Application.Status.CANCELLED);
            applicationRepository.save(application);
        }
    }

} 