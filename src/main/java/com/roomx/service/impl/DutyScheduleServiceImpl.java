package com.roomx.service.impl;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.roomx.constant.enums.ApproverPermission;
import com.roomx.constant.enums.UserRole;
import com.roomx.model.dto.DutyScheduleDTO;
import com.roomx.model.dto.PageResult;
import com.roomx.model.entity.DutySchedule;
import com.roomx.model.entity.User;
import com.roomx.model.vo.DutyScheduleVO;
import com.roomx.repository.DutyScheduleRepository;
import com.roomx.repository.UserRepository;
import com.roomx.service.DutyScheduleService;

@Service
@Transactional
public class DutyScheduleServiceImpl implements DutyScheduleService {
    
    @Autowired
    private DutyScheduleRepository dutyScheduleRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Override
    public DutyScheduleDTO createDutySchedule(DutyScheduleDTO dutyScheduleDTO, String createdByUsername) {
        // 检查日期是否已有值班安排
        if (dutyScheduleRepository.findByDutyDate(dutyScheduleDTO.getDutyDate()).isPresent()) {
            throw new IllegalArgumentException("该日期已有值班安排");
        }
        
        User dutyUser = userRepository.findById(dutyScheduleDTO.getDutyUserId())
                .orElseThrow(() -> new IllegalArgumentException("值班人员不存在"));
        User createdBy = userRepository.findByUsername(createdByUsername);
        if (createdBy == null) {
            throw new IllegalArgumentException("创建人不存在");
        }
        
        // 验证值班人员权限
        validateDutyUser(dutyUser);
        
        DutySchedule dutySchedule = new DutySchedule();
        dutySchedule.setDutyDate(dutyScheduleDTO.getDutyDate());
        dutySchedule.setDutyUser(dutyUser);
        dutySchedule.setCreatedBy(createdBy);
        dutySchedule.setRemark(dutyScheduleDTO.getRemark());
        
        DutySchedule saved = dutyScheduleRepository.save(dutySchedule);
        return convertToDTO(saved);
    }
    
    @Override
    public DutyScheduleDTO updateDutySchedule(Long id, DutyScheduleDTO dutyScheduleDTO, String updatedByUsername) {
        DutySchedule existing = dutyScheduleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("值班安排不存在"));
        
        // 如果日期有变更，检查新日期是否已有值班安排
        if (!existing.getDutyDate().equals(dutyScheduleDTO.getDutyDate())) {
            if (dutyScheduleRepository.findByDutyDate(dutyScheduleDTO.getDutyDate()).isPresent()) {
                throw new IllegalArgumentException("该日期已有值班安排");
            }
        }
        
        User dutyUser = userRepository.findById(dutyScheduleDTO.getDutyUserId())
                .orElseThrow(() -> new IllegalArgumentException("值班人员不存在"));
        
        // 验证值班人员权限
        validateDutyUser(dutyUser);
        
        existing.setDutyDate(dutyScheduleDTO.getDutyDate());
        existing.setDutyUser(dutyUser);
        existing.setRemark(dutyScheduleDTO.getRemark());
        
        DutySchedule updated = dutyScheduleRepository.save(existing);
        return convertToDTO(updated);
    }
    
    @Override
    public void deleteDutySchedule(Long id) {
        if (!dutyScheduleRepository.existsById(id)) {
            throw new IllegalArgumentException("值班安排不存在");
        }
        dutyScheduleRepository.deleteById(id);
    }
    
    @Override
    public DutyScheduleDTO getDutySchedule(Long id) {
        DutySchedule dutySchedule = dutyScheduleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("值班安排不存在"));
        return convertToDTO(dutySchedule);
    }
    
    @Override
    public PageResult<DutyScheduleVO> getDutySchedules(int pageNum, int pageSize) {
        Pageable pageable = PageRequest.of(pageNum - 1, pageSize);
        Page<DutySchedule> page = dutyScheduleRepository.findAllOrderByDateDesc(pageable);
        
        List<DutyScheduleVO> voList = page.getContent().stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());
        
        PageResult<DutyScheduleVO> result = new PageResult<>();
        result.setRecords(voList);
        result.setTotal(page.getTotalElements());
        result.setPageNum(pageNum);
        result.setPageSize(pageSize);
        return result;
    }

    @Override
    public List<DutyScheduleVO> getDutySchedulesByMonth(String month) {
        List<DutySchedule> schedules = dutyScheduleRepository.findByMonth(month);
        return schedules.stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());
    }

    @Override
    public List<DutyScheduleVO> getDutySchedulesByDateRange(Date startDate, Date endDate) {
        List<DutySchedule> schedules = dutyScheduleRepository.findByDateRange(startDate, endDate);
        return schedules.stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());
    }
    
    @Override
    public DutyScheduleVO getTodayDuty() {
        Date today = new Date();
        return dutyScheduleRepository.findTodayDuty(today)
                .map(this::convertToVO)
                .orElse(null);
    }
    
    @Override
    public List<DutyScheduleDTO> getAvailableDutyUsers() {
        // 获取admin和approver用户，且approver的权限必须是NORMAL或EXTENDED
        List<User> users = userRepository.findAll().stream()
                .filter(user -> {
                    if (user.getRole() == UserRole.ADMIN) {
                        return true;
                    }
                    if (user.getRole() == UserRole.APPROVER) {
                        ApproverPermission permission = user.getPermission();
                        return permission == ApproverPermission.NORMAL || permission == ApproverPermission.EXTENDED;
                    }
                    return false;
                })
                .collect(Collectors.toList());
        
        return users.stream()
                .map(user -> {
                    DutyScheduleDTO dto = new DutyScheduleDTO();
                    dto.setDutyUserId(user.getId());
                    dto.setDutyUserName(user.getUsername());
                    dto.setDutyUserNickname(user.getNickname());
                    return dto;
                })
                .collect(Collectors.toList());
    }
    
    private void validateDutyUser(User user) {
        if (user.getRole() == UserRole.ADMIN) {
            return; // admin总是可以值班
        }
        
        if (user.getRole() == UserRole.APPROVER) {
            ApproverPermission permission = user.getPermission();
            if (permission == ApproverPermission.NORMAL || permission == ApproverPermission.EXTENDED) {
                return; // 权限正常以上的approver可以值班
            }
        }
        
        throw new IllegalArgumentException("该用户无值班权限");
    }
    
    private DutyScheduleDTO convertToDTO(DutySchedule entity) {
        DutyScheduleDTO dto = new DutyScheduleDTO();
        dto.setId(entity.getId());
        dto.setDutyDate(entity.getDutyDate());
        dto.setDutyUserId(entity.getDutyUser().getId());
        dto.setDutyUserName(entity.getDutyUser().getUsername());
        dto.setDutyUserNickname(entity.getDutyUser().getNickname());
        dto.setRemark(entity.getRemark());
        dto.setCreatedBy(entity.getCreatedBy().getId());
        dto.setCreatedByName(entity.getCreatedBy().getUsername());
        dto.setCreateTime(entity.getCreateTime());
        dto.setUpdateTime(entity.getUpdateTime());
        return dto;
    }
    
    private DutyScheduleVO convertToVO(DutySchedule entity) {
        DutyScheduleVO vo = new DutyScheduleVO();
        vo.setId(entity.getId());
        vo.setDutyDate(entity.getDutyDate());
        vo.setDutyUserName(entity.getDutyUser().getUsername());
        vo.setDutyUserNickname(entity.getDutyUser().getNickname());
        vo.setDutyUserEmail(entity.getDutyUser().getEmail());
        vo.setDutyUserPhone(entity.getDutyUser().getPhone());
        vo.setRemark(entity.getRemark());
        vo.setCreatedByName(entity.getCreatedBy().getUsername());
        vo.setCreateTime(entity.getCreateTime());
        return vo;
    }
}
