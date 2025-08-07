package com.roomx.service.impl;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.roomx.constant.enums.ApplicationStatus;
import com.roomx.exception.ConcurrentModificationException;
import com.roomx.model.dto.ApplicationDTO;
import com.roomx.model.dto.ApplicationQuery;
import com.roomx.model.dto.PageResult;
import com.roomx.model.entity.Application;
import com.roomx.model.entity.Room;
import com.roomx.model.entity.User;
import com.roomx.repository.ApplicationRepository;
import com.roomx.repository.RoomRepository;
import com.roomx.repository.UserRepository;
import com.roomx.service.ApplicationService;

import jakarta.persistence.criteria.Predicate;

@Service
public class ApplicationServiceImpl implements ApplicationService {
    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    
    // 教室级别的锁管理器，用于防止同一教室的并发操作
    private final java.util.concurrent.ConcurrentHashMap<Long, Lock> roomLocks = new java.util.concurrent.ConcurrentHashMap<>();

    public ApplicationServiceImpl(ApplicationRepository applicationRepository, UserRepository userRepository, RoomRepository roomRepository) {
        this.applicationRepository = applicationRepository;
        this.userRepository = userRepository;
        this.roomRepository = roomRepository;
    }
    
    /**
     * 获取教室锁
     */
    private Lock getRoomLock(Long roomId) {
        return roomLocks.computeIfAbsent(roomId, k -> new ReentrantLock());
    }

    @Override
    @Transactional
    public ApplicationDTO apply(ApplicationDTO applicationDTO) {
        // 验证必要字段
        if (applicationDTO.getRoomId() == null) {
            throw new IllegalArgumentException("教室ID不能为空");
        }
        if (applicationDTO.getUserId() == null) {
            throw new IllegalArgumentException("用户ID不能为空");
        }
        if (applicationDTO.getStartTime() == null) {
            throw new IllegalArgumentException("开始时间不能为空");
        }
        if (applicationDTO.getEndTime() == null) {
            throw new IllegalArgumentException("结束时间不能为空");
        }
        if (applicationDTO.getReason() == null || applicationDTO.getReason().trim().isEmpty()) {
            throw new IllegalArgumentException("使用原因不能为空");
        }
        
        Long roomId = applicationDTO.getRoomId();
        Lock roomLock = getRoomLock(roomId);
        
        // 尝试获取教室锁，如果获取失败则抛出并发异常
        if (!roomLock.tryLock()) {
            throw new ConcurrentModificationException("教室正在被其他用户操作，请稍后重试");
        }
        
        try {
            // 获取用户和教室信息
            User user = userRepository.findById(applicationDTO.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
            Room room = roomRepository.findById(applicationDTO.getRoomId())
                .orElseThrow(() -> new IllegalArgumentException("教室不存在"));
            
            // 在事务中重新检查时间冲突，确保数据一致性
            if (hasTimeConflict(applicationDTO.getRoomId(), applicationDTO.getStartTime(), applicationDTO.getEndTime(), null)) {
                throw new IllegalArgumentException("所选时间段与已有预约冲突，请选择其他时间");
            }
            
            Application application = new Application();
            
            // 同步用户和教室信息到冗余字段
            application.syncUserInfo(user);
            application.syncRoomInfo(room);
            
            // 设置申请信息
            application.setCrowd(applicationDTO.getCrowd());
            application.setReason(applicationDTO.getReason());
            application.setStatus(ApplicationStatus.PENDING); // 确保状态为待审批
            application.setCreateTime(new Date());  // 设置创建时间
            application.setUpdateTime(new Date());  // 设置更新时间
            application.setStartTime(applicationDTO.getStartTime());
            application.setEndTime(applicationDTO.getEndTime());
            
            return ApplicationDTO.fromEntity(applicationRepository.save(application));
        } finally {
            roomLock.unlock();
        }
    }

    @Override
    @Transactional
    public ApplicationDTO modify(Long applicationId, ApplicationDTO applicationDTO) {
        Application existingApplication = applicationRepository.findById(applicationId).orElse(null);
        if (existingApplication == null) {
            throw new IllegalArgumentException("申请不存在");
        }
        
        Long roomId = existingApplication.getRoomId();
        Lock roomLock = getRoomLock(roomId);
        
        // 尝试获取教室锁
        if (!roomLock.tryLock()) {
            throw new ConcurrentModificationException("教室正在被其他用户操作，请稍后重试");
        }
        
        try {
            // 重新获取申请，确保数据是最新的
            existingApplication = applicationRepository.findById(applicationId).orElse(null);
            if (existingApplication == null) {
                throw new IllegalArgumentException("申请不存在");
            }
            
            // 检查申请状态
            if (existingApplication.getStatus() != ApplicationStatus.PENDING) {
                throw new IllegalArgumentException("只能修改待审批的申请");
            }
            
            // 如果修改了时间，需要检查时间冲突
            if (applicationDTO.getStartTime() != null && applicationDTO.getEndTime() != null) {
                if (hasTimeConflict(roomId, applicationDTO.getStartTime(), applicationDTO.getEndTime(), applicationId)) {
                    throw new IllegalArgumentException("修改后的时间段与已有预约冲突");
                }
            }
            
            existingApplication.setCrowd(applicationDTO.getCrowd());
            existingApplication.setReason(applicationDTO.getReason());
            existingApplication.setUpdateTime(applicationDTO.getUpdateTime());
            existingApplication.setStartTime(applicationDTO.getStartTime());
            existingApplication.setEndTime(applicationDTO.getEndTime());     
            return ApplicationDTO.fromEntity(applicationRepository.save(existingApplication));
        } finally {
            roomLock.unlock();
        }
    }

    @Override
    public PageResult<ApplicationDTO> page(ApplicationQuery query, int pageNum, int pageSize, java.util.Date queryDate) {
        Specification<Application> spec = (root, cq, cb) -> {
            ArrayList<Predicate> predicates = new ArrayList<>();
            
            // 直接使用冗余字段进行查询，避免JOIN
            if (query.getUserId() != null) {
                predicates.add(cb.equal(root.get("userId"), query.getUserId()));
            }
            if (query.getRoomId() != null) {
                predicates.add(cb.equal(root.get("roomId"), query.getRoomId()));
            }
            if (query.getStatus() != null) {
                predicates.add(cb.equal(root.get("status"), query.getStatus()));
            }
            if (query.getCreateTime() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createTime"), query.getCreateTime()));
            }
            // 按天筛选使用时间范围
            if (queryDate != null) {
                // 将查询日期转换为当天的开始和结束时间
                java.util.Calendar queryCal = java.util.Calendar.getInstance();
                queryCal.setTime(queryDate);
                queryCal.set(java.util.Calendar.HOUR_OF_DAY, 0);
                queryCal.set(java.util.Calendar.MINUTE, 0);
                queryCal.set(java.util.Calendar.SECOND, 0);
                queryCal.set(java.util.Calendar.MILLISECOND, 0);
                Date queryStartTime = queryCal.getTime();
                
                queryCal.set(java.util.Calendar.HOUR_OF_DAY, 23);
                queryCal.set(java.util.Calendar.MINUTE, 59);
                queryCal.set(java.util.Calendar.SECOND, 59);
                queryCal.set(java.util.Calendar.MILLISECOND, 999);
                Date queryEndTime = queryCal.getTime();
                
                // 查询申请时间区间与查询日期有重合的申请
                // 条件：申请的开始时间 <= 查询日期的结束时间 AND 申请的结束时间 >= 查询日期的开始时间
                predicates.add(cb.and(
                    cb.lessThanOrEqualTo(root.get("startTime"), queryEndTime),
                    cb.greaterThanOrEqualTo(root.get("endTime"), queryStartTime)
                ));
            } else {
                // 单独的时间条件（保留原有逻辑）
                if (query.getStartTime() != null) {
                    predicates.add(cb.greaterThanOrEqualTo(root.get("startTime"), query.getStartTime()));
                }
                if (query.getEndTime() != null) {
                    predicates.add(cb.lessThanOrEqualTo(root.get("endTime"), query.getEndTime()));
                }
            }
            
            // 用户相关字段 - 使用冗余字段
            if (query.getUsername() != null && !query.getUsername().isEmpty()) {
                predicates.add(cb.like(root.get("username"), "%" + query.getUsername() + "%"));
            }
            if (query.getNickname() != null && !query.getNickname().isEmpty()) {
                predicates.add(cb.like(root.get("userNickname"), "%" + query.getNickname() + "%"));
            }
            if (query.getContact() != null && !query.getContact().isEmpty()) {
                predicates.add(cb.like(root.get("contact"), "%" + query.getContact() + "%"));
            }
            
            // 教室相关字段 - 使用冗余字段
            if (query.getRoomName() != null && !query.getRoomName().isEmpty()) {
                predicates.add(cb.like(root.get("roomName"), "%" + query.getRoomName() + "%"));
            }
            if (query.getRoomLocation() != null && !query.getRoomLocation().isEmpty()) {
                predicates.add(cb.like(root.get("roomLocation"), "%" + query.getRoomLocation() + "%"));
            }
            if (query.getRoomType() != null) {
                predicates.add(cb.equal(root.get("roomType"), query.getRoomType().name()));
            }
            if (query.getRoomCapacity() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("roomCapacity"), query.getRoomCapacity()));
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
    @Transactional(readOnly = true)
    public List<ApplicationDTO> getAllApplications() {
        List<Application> allApplications = applicationRepository.findAll();
        return allApplications.stream()
            .map(ApplicationDTO::fromEntity)
            .collect(java.util.stream.Collectors.toList());
    }

    @Override
    @Transactional
    public void approve(Long applicationId, String reason) {
        Application application = applicationRepository.findById(applicationId).orElse(null);
        if (application == null) {
            throw new IllegalArgumentException("申请不存在");
        }
        
        Long roomId = application.getRoomId();
        Lock roomLock = getRoomLock(roomId);
        
        // 尝试获取教室锁
        if (!roomLock.tryLock()) {
            throw new ConcurrentModificationException("教室正在被其他用户操作，请稍后重试");
        }
        
        try {
            // 重新获取申请，确保数据是最新的
            application = applicationRepository.findById(applicationId).orElse(null);
            if (application == null) {
                throw new IllegalArgumentException("申请不存在");
            }
            
            // 检查申请状态是否仍然是待审批
            if (application.getStatus() != ApplicationStatus.PENDING) {
                throw new IllegalArgumentException("申请状态已变更，无法审批");
            }
            
            application.setStatus(ApplicationStatus.APPROVED);
            applicationRepository.save(application);
            
            // 自动驳回时间冲突的待审批申请
            List<Application> pendingApplications = applicationRepository.findByRoomIdAndStatus(
                application.getRoomId(), ApplicationStatus.PENDING);
            
            for (Application otherApplication : pendingApplications) {
                if (!otherApplication.getId().equals(applicationId) && 
                    otherApplication.getStartTime().before(application.getEndTime()) &&
                    otherApplication.getEndTime().after(application.getStartTime())) {
                    reject(otherApplication.getId(), "时间冲突，自动驳回");
                }
            }
        } finally {
            roomLock.unlock();
        }
    }

    @Override
    @Transactional
    public void reject(Long applicationId, String reason) {
        Application application = applicationRepository.findById(applicationId).orElse(null);
        if (application == null) {
            throw new IllegalArgumentException("申请不存在");
        }
        
        // 检查申请状态
        if (application.getStatus() != ApplicationStatus.PENDING) {
            throw new IllegalArgumentException("只能驳回待审批的申请");
        }
        
        application.setStatus(ApplicationStatus.REJECTED);
        applicationRepository.save(application);
    }


    @Override
    @Transactional
    public void cancel(Long applicationId, String reason) {
        Application application = applicationRepository.findById(applicationId).orElse(null);
        if (application == null) {
            throw new IllegalArgumentException("申请不存在");
        }
        
        // 检查申请状态
        if (application.getStatus() != ApplicationStatus.PENDING && 
            application.getStatus() != ApplicationStatus.APPROVED) {
            throw new IllegalArgumentException("只能取消待审批或已批准的申请");
        }
        
        application.setStatus(ApplicationStatus.CANCELLED);
        applicationRepository.save(application);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ApplicationDTO> getFutureApprovedApplications(Long roomId) {
        Date now = new Date();
        List<Application> applications = applicationRepository.findByRoomIdAndStatusAndEndTimeAfter(
            roomId, ApplicationStatus.APPROVED, now);
        return applications.stream()
            .map(ApplicationDTO::fromEntity)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasTimeConflict(Long roomId, Date startTime, Date endTime, Long excludeApplicationId) {
        // 使用数据库级别的锁来确保查询的一致性
        List<Application> approvedApplications = applicationRepository.findByRoomIdAndStatusAndEndTimeAfter(
            roomId, ApplicationStatus.APPROVED, new Date());
        
        for (Application application : approvedApplications) {
            // 排除指定的申请（用于修改时检查）
            if (application.getId().equals(excludeApplicationId)) {
                continue;
            }
            
            // 检查时间重叠
            if (startTime.before(application.getEndTime()) && endTime.after(application.getStartTime())) {
                return true;
            }
        }
        return false;
    }

} 