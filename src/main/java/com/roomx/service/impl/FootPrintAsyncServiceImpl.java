package com.roomx.service.impl;

import java.util.Date;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.roomx.model.entity.FootPrint;
import com.roomx.repository.FootPrintRepository;
import com.roomx.service.FootPrintAsyncService;

import lombok.extern.slf4j.Slf4j;

/**
 * FootPrint异步服务实现
 * 使用独立事务处理FootPrint创建，确保数据持久化
 */
@Slf4j
@Service
public class FootPrintAsyncServiceImpl implements FootPrintAsyncService {

    @Autowired
    private FootPrintRepository footPrintRepository;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW, rollbackFor = Exception.class)
    public void createFootPrintAsync(Long operatorId, Long userId, Long applicationId, 
                                   Long roomId, String action, String description, String tempInfo) {
        try {
            log.info("开始创建FootPrint记录: operatorId={}, userId={}, applicationId={}, roomId={}, action={}", 
                    operatorId, userId, applicationId, roomId, action);
            
            // 检查事务状态
            boolean isTransactionActive = TransactionSynchronizationManager.isActualTransactionActive();
            String txName = TransactionSynchronizationManager.getCurrentTransactionName();
            log.info("事务状态: isActive={}, txName={}", isTransactionActive, txName);
            
            FootPrint footPrint = new FootPrint();
            footPrint.setOperatorId(operatorId);
            footPrint.setUserId(userId);
            footPrint.setApplicationId(applicationId);
            footPrint.setRoomId(roomId);
            footPrint.setAction(action);
            footPrint.setAttach(description);
            footPrint.setTempInfo(tempInfo);
            footPrint.setTimestamp(new Date());
            
            log.info("准备保存FootPrint到数据库");
            
            FootPrint saved = footPrintRepository.save(footPrint);
            
            log.info("FootPrint保存成功，准备flush到数据库: savedId={}", saved.getId());
            
            // 强制刷新到数据库
            footPrintRepository.flush();
            
            log.info("FootPrint flush完成");
            
            log.info("FootPrint异步创建完成: id={}, operator={}, action={}, target=user:{}/room:{}/app:{}", 
                    saved.getId(), operatorId, action, userId, roomId, applicationId);
            
        } catch (Exception e) {
            log.error("FootPrint异步创建失败: operatorId={}, action={}, error={}", 
                     operatorId, action, e.getMessage(), e);
            throw e; // 重新抛出异常以便事务回滚
        }
    }
}
