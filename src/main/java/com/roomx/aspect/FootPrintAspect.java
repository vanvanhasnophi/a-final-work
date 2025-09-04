package com.roomx.aspect;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import com.roomx.model.dto.ApplicationDTO;
import com.roomx.model.dto.RoomDTO;
import com.roomx.model.dto.UserInfoDTO;
import com.roomx.service.FootPrintAsyncService;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;

/**
 * FootPrint自动记录切面
 * 监听关键业务操作并自动记录到FootPrint表
 */
@Aspect
@Component
@Slf4j
public class FootPrintAspect {

    @Autowired
    private FootPrintAsyncService footPrintAsyncService;

    // 缓存用户操作，避免短时间内重复记录
    private final Map<String, Long> operationCache = new ConcurrentHashMap<>();
    private static final long CACHE_TIMEOUT = 5000; // 5秒内相同操作不重复记录

    /**
     * 监听申请创建操作
     */
    @AfterReturning(
        pointcut = "execution(* com.roomx.service.impl.ApplicationServiceImpl.apply(..))",
        returning = "result"
    )
    public void recordApplicationCreation(JoinPoint joinPoint, ApplicationDTO result) {
        try {
            if (result != null) {
                String action = "application create";
                String description = String.format("用户提交了教室申请: %s，时间: %s - %s", 
                    result.getRoomName(), 
                    result.getStartTime(), 
                    result.getEndTime());
                
                createFootPrint(result.getUserId(), result.getUserId(), result.getId(), 
                    result.getRoomId(), action, description, null);
                    
                log.debug("记录申请创建FootPrint: 用户={}, 申请={}", result.getUserId(), result.getId());
            }
        } catch (Exception e) {
            log.error("记录申请创建FootPrint失败", e);
        }
    }

    /**
     * 监听申请审批操作
     */
    @AfterReturning(
        pointcut = "execution(* com.roomx.service.impl.ApplicationServiceImpl.approve(..))"
    )
    public void recordApplicationApproval(JoinPoint joinPoint) {
        try {
            Object[] args = joinPoint.getArgs();
            if (args.length >= 2) {
                Long applicationId = (Long) args[0];
                String reason = (String) args[1];
                
                String action = "application approve";
                String description = String.format("申请已通过审批: 申请ID=%d，审批原因: %s", 
                    applicationId, reason);
                
                Long operatorId = getCurrentOperatorId();
                createFootPrint(operatorId, null, applicationId, 
                    null, action, description, null);
                    
                log.debug("记录申请审批FootPrint: 操作员={}, 申请={}", operatorId, applicationId);
            }
        } catch (Exception e) {
            log.error("记录申请审批FootPrint失败", e);
        }
    }

    /**
     * 监听申请驳回操作
     */
    @AfterReturning(
        pointcut = "execution(* com.roomx.service.impl.ApplicationServiceImpl.reject(..))"
    )
    public void recordApplicationRejection(JoinPoint joinPoint) {
        try {
            Object[] args = joinPoint.getArgs();
            if (args.length >= 2) {
                Long applicationId = (Long) args[0];
                String reason = (String) args[1];
                
                String action = "application reject";
                String description = String.format("申请已被驳回: 申请ID=%d，驳回原因: %s", 
                    applicationId, reason);
                
                Long operatorId = getCurrentOperatorId();
                createFootPrint(operatorId, null, applicationId, 
                    null, action, description, null);
                    
                log.debug("记录申请驳回FootPrint: 操作员={}, 申请={}", operatorId, applicationId);
            }
        } catch (Exception e) {
            log.error("记录申请驳回FootPrint失败", e);
        }
    }

    /**
     * 监听申请取消操作
     */
    @AfterReturning(
        pointcut = "execution(* com.roomx.service.impl.ApplicationServiceImpl.cancel(..))"
    )
    public void recordApplicationCancellation(JoinPoint joinPoint) {
        try {
            Object[] args = joinPoint.getArgs();
            if (args.length >= 2) {
                Long applicationId = (Long) args[0];
                String reason = (String) args[1];
                
                String action = "application cancel";
                String description = String.format("用户取消了申请: ID=%d，取消原因: %s", applicationId, reason);
                
                Long operatorId = getCurrentOperatorId();
                createFootPrint(operatorId, operatorId, applicationId, null, action, description, null);
                    
                log.debug("记录申请取消FootPrint: 用户={}, 申请={}", operatorId, applicationId);
            }
        } catch (Exception e) {
            log.error("记录申请取消FootPrint失败", e);
        }
    }

    /**
     * 监听申请签到操作
     */
    @AfterReturning(
        pointcut = "execution(* com.roomx.service.impl.ApplicationServiceImpl.checkin(..))"
    )
    public void recordApplicationCheckin(JoinPoint joinPoint) {
        try {
            Object[] args = joinPoint.getArgs();
            if (args.length >= 1) {
                Long applicationId = (Long) args[0];
                
                String action = "application checkin";
                String description = String.format("用户签到了申请: 申请ID=%d", applicationId);
                
                Long operatorId = getCurrentOperatorId();
                createFootPrint(operatorId, operatorId, applicationId, 
                    null, action, description, null);
                    
                log.debug("记录申请签到FootPrint: 用户={}, 申请={}", operatorId, applicationId);
            }
        } catch (Exception e) {
            log.error("记录申请签到FootPrint失败", e);
        }
    }

    /**
     * 监听用户信息更新操作
     */
    @AfterReturning(
        pointcut = "execution(* com.roomx.service.impl.UserServiceImpl.updateUserInfo(..))",
        returning = "result"
    )
    public void recordUserInfoUpdate(JoinPoint joinPoint, UserInfoDTO result) {
        try {
            if (result != null) {
                String action = "user update";
                String description = String.format("用户更新了个人信息: %s", result.getNickname());
                
                createFootPrint(result.getId(), result.getId(), null, null, action, description, null);
                    
                log.debug("记录用户信息更新FootPrint: 用户={}", result.getId());
            }
        } catch (Exception e) {
            log.error("记录用户信息更新FootPrint失败", e);
        }
    }

    /**
     * 监听用户密码修改操作
     */
    @AfterReturning(
        pointcut = "execution(* com.roomx.service.impl.AuthServiceImpl.updatePassword(..))",
        returning = "result"
    )
    public void recordUserPasswordUpdate(JoinPoint joinPoint, int result) {
        try {
            if (result > 0) { // 修改成功
                String action = "user password";
                String description = "用户修改了密码";
                
                Long operatorId = getCurrentOperatorId();
                createFootPrint(operatorId, operatorId, null, null, action, description, null);
                
                log.debug("记录用户密码修改FootPrint: 用户={}", operatorId);
            }
        } catch (Exception e) {
            log.error("记录用户密码修改FootPrint失败", e);
        }
    }

    /**
     * 监听教室创建操作
     */
    @AfterReturning(
        pointcut = "execution(* com.roomx.service.impl.RoomServiceImpl.addRoom(..))",
        returning = "result"
    )
    public void recordRoomCreation(JoinPoint joinPoint, RoomDTO result) {
        try {
            if (result != null) {
                String action = "room create";
                String description = String.format("创建了新教室: %s，位置: %s", 
                    result.getName(), 
                    result.getLocation());
                
                Long operatorId = getCurrentOperatorId();
                createFootPrint(operatorId, null, null, result.getId(), action, description, null);
                    
                log.debug("记录教室创建FootPrint: 操作员={}, 教室={}", operatorId, result.getId());
            }
        } catch (Exception e) {
            log.error("记录教室创建FootPrint失败", e);
        }
    }

    /**
     * 监听教室更新操作
     */
    @AfterReturning(
        pointcut = "execution(* com.roomx.service.impl.RoomServiceImpl.updateRoom(..))",
        returning = "result"
    )
    public void recordRoomUpdate(JoinPoint joinPoint, RoomDTO result) {
        try {
            if (result != null) {
                String action = "room update";
                String description = String.format("更新了教室信息: %s，状态: %s", 
                    result.getName(), 
                    result.getStatus());
                
                Long operatorId = getCurrentOperatorId();
                createFootPrint(operatorId, null, null, result.getId(), action, description, null);
                    
                log.debug("记录教室更新FootPrint: 操作员={}, 教室={}", operatorId, result.getId());
            }
        } catch (Exception e) {
            log.error("记录教室更新FootPrint失败", e);
        }
    }

    /**
     * 监听教室删除操作
     */
    @AfterReturning(
        pointcut = "execution(* com.roomx.service.impl.RoomServiceImpl.deleteRoom(..))"
    )
    public void recordRoomDeletion(JoinPoint joinPoint) {
        try {
            Object[] args = joinPoint.getArgs();
            if (args.length >= 1) {
                // 安全地转换参数类型
                Long roomId = null;
                if (args[0] instanceof Long) {
                    roomId = (Long) args[0];
                } else if (args[0] instanceof Number) {
                    roomId = ((Number) args[0]).longValue();
                }
                
                if (roomId != null) {
                    String action = "room delete";
                    String description = String.format("删除了教室: ID=%d", roomId);
                    
                    Long operatorId = getCurrentOperatorId();
                    createFootPrint(operatorId, null, null, roomId, action, description, null);
                        
                    log.debug("记录教室删除FootPrint: 操作员={}, 教室={}", operatorId, roomId);
                }
            }
        } catch (Exception e) {
            log.error("记录教室删除FootPrint失败", e);
        }
    }

    /**
     * 监听用户登录操作
     */
    @AfterReturning(
        pointcut = "execution(* com.roomx.service.impl.AuthServiceImpl.login(..))",
        returning = "result"
    )
    public void recordUserLogin(JoinPoint joinPoint, Object result) {
        try {
            // 从方法参数中获取用户登录信息
            Object[] args = joinPoint.getArgs();
            if (args.length >= 1 && result != null) {
                // 参数是UserLoginDTO，需要获取其中的用户名
                String username = null;
                if (args[0] instanceof com.roomx.model.dto.UserLoginDTO) {
                    com.roomx.model.dto.UserLoginDTO loginDTO = (com.roomx.model.dto.UserLoginDTO) args[0];
                    username = loginDTO.getUsername();
                } else {
                    username = args[0].toString();
                }
                
                String action = "user login";
                String description = String.format("用户登录: %s", username);
                
                // 获取用户ID（需要从结果中解析或通过用户名查询）
                Long userId = getCurrentUserId(); // 登录后可以获取用户ID
                if (userId != null) {
                    createFootPrint(userId, userId, null, null, action, description, null);
                    log.debug("记录用户登录FootPrint: 用户={}", userId);
                }
            }
        } catch (Exception e) {
            log.error("记录用户登录FootPrint失败", e);
        }
    }

    /**
     * 创建FootPrint记录
     */
    private void createFootPrint(Long operatorId, Long userId, Long applicationId, 
                                Long roomId, String action, String description, String tempInfo) {
        
        // 检查缓存，避免短时间重复记录
        String cacheKey = String.format("%d-%s-%s", 
            operatorId != null ? operatorId : 0, 
            action, 
            System.currentTimeMillis() / CACHE_TIMEOUT);
            
        if (operationCache.containsKey(cacheKey)) {
            return;
        }
        
        try {
            // 使用异步服务创建FootPrint，确保独立事务
            footPrintAsyncService.createFootPrintAsync(operatorId, userId, applicationId, 
                                                     roomId, action, description, tempInfo);
            
            // 更新缓存
            operationCache.put(cacheKey, System.currentTimeMillis());
            
            // 清理过期缓存
            cleanExpiredCache();
            
        } catch (Exception e) {
            log.error("创建FootPrint记录失败: operatorId={}, action={}", operatorId, action, e);
        }
    }

    /**
     * 获取当前操作员ID
     */
    private Long getCurrentOperatorId() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                Object userIdAttr = request.getAttribute("userId");
                if (userIdAttr instanceof Long) {
                    return (Long) userIdAttr;
                } else if (userIdAttr instanceof Number) {
                    return ((Number) userIdAttr).longValue();
                } else if (userIdAttr instanceof String) {
                    try {
                        return Long.parseLong((String) userIdAttr);
                    } catch (NumberFormatException e) {
                        log.debug("无法解析userId字符串: {}", userIdAttr);
                    }
                }
            }
        } catch (Exception e) {
            log.debug("获取当前操作员ID失败", e);
        }
        return null;
    }

    /**
     * 获取当前用户ID
     */
    private Long getCurrentUserId() {
        return getCurrentOperatorId(); // 当前实现中操作员ID就是用户ID
    }

    /**
     * 清理过期的操作缓存
     */
    private void cleanExpiredCache() {
        try {
            long now = System.currentTimeMillis();
            operationCache.entrySet().removeIf(entry -> 
                now - entry.getValue() > CACHE_TIMEOUT * 2);
        } catch (Exception e) {
            log.debug("清理FootPrint缓存失败", e);
        }
    }

    /**
     * 监听值班安排创建操作
     */
    @AfterReturning(
        pointcut = "execution(* com.roomx.service.impl.DutyScheduleServiceImpl.createDutySchedule(..))",
        returning = "result"
    )
    public void recordDutyScheduleCreation(JoinPoint joinPoint, Object result) {
        try {
            if (result != null) {
                Object[] args = joinPoint.getArgs();
                String createdByUsername = args.length >= 2 ? (String) args[1] : "unknown";
                
                String action = "duty create";
                String description = String.format("创建了新的值班安排，操作员: %s", createdByUsername);
                
                Long operatorId = getCurrentOperatorId();
                createFootPrint(operatorId, null, null, null, action, description, null);
                
                log.debug("记录值班安排创建FootPrint: 操作员={}", operatorId);
            }
        } catch (Exception e) {
            log.error("记录值班安排创建FootPrint失败", e);
        }
    }

    /**
     * 监听值班安排更新操作
     */
    @AfterReturning(
        pointcut = "execution(* com.roomx.service.impl.DutyScheduleServiceImpl.updateDutySchedule(..))",
        returning = "result"
    )
    public void recordDutyScheduleUpdate(JoinPoint joinPoint, Object result) {
        try {
            if (result != null) {
                Object[] args = joinPoint.getArgs();
                Long dutyId = args.length >= 1 ? (Long) args[0] : null;
                String updatedByUsername = args.length >= 3 ? (String) args[2] : "unknown";
                
                String action = "duty update";
                String description = String.format("更新了值班安排: ID=%d，操作员: %s", dutyId, updatedByUsername);
                
                Long operatorId = getCurrentOperatorId();
                createFootPrint(operatorId, null, null, null, action, description, null);
                
                log.debug("记录值班安排更新FootPrint: 操作员={}, 值班ID={}", operatorId, dutyId);
            }
        } catch (Exception e) {
            log.error("记录值班安排更新FootPrint失败", e);
        }
    }

    /**
     * 监听值班安排删除操作
     */
    @AfterReturning(
        pointcut = "execution(* com.roomx.service.impl.DutyScheduleServiceImpl.deleteDutySchedule(..))"
    )
    public void recordDutyScheduleDeletion(JoinPoint joinPoint) {
        try {
            Object[] args = joinPoint.getArgs();
            if (args.length >= 1) {
                Long dutyId = (Long) args[0];
                
                String action = "duty delete";
                String description = String.format("删除了值班安排: ID=%d", dutyId);
                
                Long operatorId = getCurrentOperatorId();
                createFootPrint(operatorId, null, null, null, action, description, null);
                
                log.debug("记录值班安排删除FootPrint: 操作员={}, 值班ID={}", operatorId, dutyId);
            }
        } catch (Exception e) {
            log.error("记录值班安排删除FootPrint失败", e);
        }
    }
}
