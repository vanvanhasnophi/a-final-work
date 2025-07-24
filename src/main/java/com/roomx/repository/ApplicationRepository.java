package com.roomx.repository;

import com.roomx.entity.Application;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApplicationRepository extends JpaRepository<Application, Long> {
    // 申请数据访问
}
