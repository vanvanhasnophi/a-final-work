package com.roomx.service.impl;

import com.roomx.model.entity.Application;
import com.roomx.repository.ApplicationRepository;
import com.roomx.service.ApplicationService;
import org.springframework.stereotype.Service;
import com.roomx.model.dto.ApplicationDTO;
import com.roomx.constant.enums.ApplicationStatus;
import java.util.stream.Collectors;
import com.roomx.model.dto.PageResult;
import com.roomx.model.dto.ApplicationQuery;
import com.roomx.repository.UserRepository;
import com.roomx.repository.RoomRepository;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;

@Service
public class ApplicationServiceImpl implements ApplicationService {
    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;

    public ApplicationServiceImpl(ApplicationRepository applicationRepository, UserRepository userRepository, RoomRepository roomRepository) {
        this.applicationRepository = applicationRepository;
        this.userRepository = userRepository;
        this.roomRepository = roomRepository;
    }

    @Override
    public ApplicationDTO apply(ApplicationDTO applicationDTO) {
        Application application = new Application();
        application.setUser(userRepository.findById(applicationDTO.getUserId()).orElseThrow(() -> new IllegalArgumentException("user not found")));
        application.setRoom(roomRepository.findById(applicationDTO.getRoomId()).orElseThrow(() -> new IllegalArgumentException("room not found")));
        application.setCrowd(applicationDTO.getCrowd());
        application.setReason(applicationDTO.getReason());
        application.setStatus(applicationDTO.getStatus());
        application.setCreateTime(applicationDTO.getCreateTime());  
        application.setUpdateTime(applicationDTO.getUpdateTime());
        application.setStartTime(applicationDTO.getStartTime());
        application.setEndTime(applicationDTO.getEndTime());
        return ApplicationDTO.fromEntity(applicationRepository.save(application));
    }

    @Override
    public ApplicationDTO modify(Long applicationId, ApplicationDTO applicationDTO) {
        Application existingApplication = applicationRepository.findById(applicationId).orElse(null);
        if (existingApplication != null) {
            existingApplication.setCrowd(applicationDTO.getCrowd());
            existingApplication.setReason(applicationDTO.getReason());
            existingApplication.setStatus(applicationDTO.getStatus());
            existingApplication.setUpdateTime(applicationDTO.getUpdateTime());
            existingApplication.setStartTime(applicationDTO.getStartTime());
            existingApplication.setEndTime(applicationDTO.getUpdateTime());     
            return ApplicationDTO.fromEntity(applicationRepository.save(existingApplication));
        }
        return null;
    }

    @Override
    public PageResult<ApplicationDTO> page(ApplicationQuery query, int pageNum, int pageSize) {
        Specification<Application> spec = (root, cq, cb) -> {
            ArrayList<Predicate> predicates = new ArrayList<>();
            if (query.getUserId() != null) {
                predicates.add(cb.equal(root.get("userId").as(Long.class), query.getUserId()));
            }
            if (query.getRoomId() != null) {
                predicates.add(cb.equal(root.get("roomId").as(Long.class), query.getRoomId()));
            }
            if (query.getStatus() != null) {
                predicates.add(cb.equal(root.get("status").as(ApplicationStatus.class), query.getStatus()));
            }
            if (query.getCreateTime() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createTime").as(java.util.Date.class), query.getCreateTime()));
            }
            if (query.getStartTime() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("startTime").as(java.util.Date.class), query.getStartTime()));
            }
            if (query.getEndTime() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("endTime").as(java.util.Date.class), query.getEndTime()));
            }
            // user相关字段
            if (query.getUsername() != null && !query.getUsername().isEmpty()) {
                Join userJoin = root.join("user", JoinType.LEFT);
                predicates.add(cb.like(userJoin.get("username").as(String.class), "%" + query.getUsername() + "%"));
            }
            if (query.getNickname() != null && !query.getNickname().isEmpty()) {
                Join userJoin = root.join("user", JoinType.LEFT);
                predicates.add(cb.like(userJoin.get("nickname").as(String.class), "%" + query.getNickname() + "%"));
            }
            if (query.getContact() != null && !query.getContact().isEmpty()) {
                Join userJoin = root.join("user", JoinType.LEFT);
                predicates.add(cb.like(userJoin.get("contact").as(String.class), "%" + query.getContact() + "%"));
            }
            // room相关字段
            if (query.getRoomName() != null && !query.getRoomName().isEmpty()) {
                Join roomJoin = root.join("room", JoinType.LEFT);
                predicates.add(cb.like(roomJoin.get("name").as(String.class), "%" + query.getRoomName() + "%"));
            }
            if (query.getRoomLocation() != null && !query.getRoomLocation().isEmpty()) {
                Join roomJoin = root.join("room", JoinType.LEFT);
                predicates.add(cb.like(roomJoin.get("location").as(String.class), "%" + query.getRoomLocation() + "%"));
            }
            if (query.getRoomType() != null) {
                Join roomJoin = root.join("room", JoinType.LEFT);
                predicates.add(cb.equal(roomJoin.get("type").as(com.roomx.constant.enums.RoomType.class), query.getRoomType()));
            }
            if (query.getRoomCapacity() != null) {
                Join roomJoin = root.join("room", JoinType.LEFT);
                predicates.add(cb.greaterThanOrEqualTo(roomJoin.get("capacity").as(Long.class), query.getRoomCapacity()));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        Pageable pageable = PageRequest.of(pageNum - 1, pageSize);
        Page<Application> page = applicationRepository.findAll(spec, pageable);
        PageResult<ApplicationDTO> result = new PageResult<>();
        result.setRecords(page.getContent().stream().map(ApplicationDTO::fromEntity).collect(Collectors.toList()));
        result.setTotal(page.getTotalElements());
        result.setPageNum(pageNum);
        result.setPageSize(pageSize);
        return result;
    }


    @Override
    public ApplicationDTO get(Long id) {
        Application application = applicationRepository.findById(id).orElse(null);
        if(application==null) throw new IllegalArgumentException("application not found");
        return ApplicationDTO.fromEntity(application);
    }

    @Override
    public void approve(Long applicationId, String reason) {
        Application application = applicationRepository.findById(applicationId).orElse(null);
        if (application != null) {
            application.setStatus(ApplicationStatus.APPROVED);
            for(Application otherApplication : applicationRepository.findByRoomId(application.getRoomId())) {
                if(otherApplication.getStatus() == ApplicationStatus.PENDING&&otherApplication.getStartTime().before(application.getEndTime())&&otherApplication.getEndTime().after(application.getStartTime())) {
                    reject(otherApplication.getId(), "other application is in the same time");
                }
            }
            applicationRepository.save(application);
        }
    }

    @Override
    public void reject(Long applicationId, String reason) {
        Application application = applicationRepository.findById(applicationId).orElse(null);
        if (application != null) {
            application.setStatus(ApplicationStatus.REJECTED);
            applicationRepository.save(application);
        }
    }


    @Override
    public void cancel(Long applicationId, String reason) {
        Application application = applicationRepository.findById(applicationId).orElse(null);
        if (application != null) {
            application.setStatus(ApplicationStatus.CANCELLED);
            applicationRepository.save(application);
        }
    }

} 