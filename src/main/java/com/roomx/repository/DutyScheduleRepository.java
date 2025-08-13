package com.roomx.repository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.roomx.model.entity.DutySchedule;

@Repository
public interface DutyScheduleRepository extends JpaRepository<DutySchedule, Long> {
    
    /**
     * 根据日期查找值班安排
     */
    Optional<DutySchedule> findByDutyDate(Date dutyDate);
    
    /**
     * 查找指定日期范围内的值班安排
     */
    @Query("SELECT ds FROM DutySchedule ds WHERE ds.dutyDate >= :startDate AND ds.dutyDate <= :endDate ORDER BY ds.dutyDate")
    List<DutySchedule> findByDateRange(@Param("startDate") Date startDate, @Param("endDate") Date endDate);
    
    /**
     * 按月份查找值班安排
     */
    @Query("SELECT ds FROM DutySchedule ds WHERE FUNCTION('DATE_FORMAT', ds.dutyDate, '%Y-%m') = :month ORDER BY ds.dutyDate")
    List<DutySchedule> findByMonth(@Param("month") String month);

    /**
     * 分页查询值班安排
     */
    @Query("SELECT ds FROM DutySchedule ds ORDER BY ds.dutyDate DESC")
    Page<DutySchedule> findAllOrderByDateDesc(Pageable pageable);
    
    /**
     * 查找某用户的值班安排
     */
    @Query("SELECT ds FROM DutySchedule ds WHERE ds.dutyUser.id = :userId ORDER BY ds.dutyDate DESC")
    List<DutySchedule> findByDutyUserId(@Param("userId") Long userId);
    
    /**
     * 获取今日值班安排
     */
    @Query("SELECT ds FROM DutySchedule ds WHERE DATE(ds.dutyDate) = DATE(:today)")
    Optional<DutySchedule> findTodayDuty(@Param("today") Date today);
}
