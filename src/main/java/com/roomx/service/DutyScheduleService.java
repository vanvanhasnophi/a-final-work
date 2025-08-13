package com.roomx.service;

import java.util.Date;
import java.util.List;

import com.roomx.model.dto.DutyScheduleDTO;
import com.roomx.model.dto.PageResult;
import com.roomx.model.vo.DutyScheduleVO;

public interface DutyScheduleService {
    
    /**
     * 创建值班安排
     */
    DutyScheduleDTO createDutySchedule(DutyScheduleDTO dutyScheduleDTO, String createdByUsername);
    
    /**
     * 更新值班安排
     */
    DutyScheduleDTO updateDutySchedule(Long id, DutyScheduleDTO dutyScheduleDTO, String updatedByUsername);
    
    /**
     * 删除值班安排
     */
    void deleteDutySchedule(Long id);
    
    /**
     * 根据ID获取值班安排
     */
    DutyScheduleDTO getDutySchedule(Long id);
    
    /**
     * 分页查询值班安排
     */
    PageResult<DutyScheduleVO> getDutySchedules(int pageNum, int pageSize);
    
    /**
     * 获取指定日期范围的值班安排
     */
    List<DutyScheduleVO> getDutySchedulesByDateRange(Date startDate, Date endDate);

    /**
     * 按月份查找值班安排
     */
    List<DutyScheduleVO> getDutySchedulesByMonth(String month);

    /**
     * 获取今日值班人员
     */
    DutyScheduleVO getTodayDuty();
    
    /**
     * 获取可值班人员列表（admin和approver，权限正常以上）
     */
    List<DutyScheduleDTO> getAvailableDutyUsers();
}
