package com.roomx.service;

/**
 * FootPrint异步服务接口
 * 用于在独立事务中创建FootPrint记录
 */
public interface FootPrintAsyncService {
    
    /**
     * 异步创建FootPrint记录
     * 使用独立事务，确保即使父事务回滚也能成功保存
     */
    void createFootPrintAsync(Long operatorId, Long userId, Long applicationId, 
                             Long roomId, String action, String description, String tempInfo);
}
