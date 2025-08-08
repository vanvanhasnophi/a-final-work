package com.roomx.service;

import java.util.Collection;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

/**
 * Redis 服务类
 * 提供 Redis 的基本操作方法
 */
@Service
// 开发或生产并且 redis.enabled=true 时启用（或显式 redis profile）
@ConditionalOnBean(RedisTemplate.class)
@ConditionalOnProperty(name = "redis.enabled", havingValue = "true")
public class RedisService {

    private final RedisTemplate<String, Object> redisTemplate;

    @Autowired
    public RedisService(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    // ========== 字符串操作 ==========

    /**
     * 设置缓存
     */
    public void set(String key, Object value) {
        redisTemplate.opsForValue().set(key, value);
    }

    /**
     * 设置缓存并指定过期时间
     */
    public void set(String key, Object value, long timeout, TimeUnit unit) {
        redisTemplate.opsForValue().set(key, value, timeout, unit);
    }

    /**
     * 获取缓存
     */
    public Object get(String key) {
        return redisTemplate.opsForValue().get(key);
    }

    /**
     * 获取缓存，指定类型
     */
    @SuppressWarnings("unchecked")
    public <T> T get(String key, Class<T> type) {
        Object value = get(key);
        return value != null ? (T) value : null;
    }

    /**
     * 删除缓存
     */
    public Boolean delete(String key) {
        return redisTemplate.delete(key);
    }

    /**
     * 批量删除缓存
     */
    public Long delete(Collection<String> keys) {
        return redisTemplate.delete(keys);
    }

    /**
     * 检查key是否存在
     */
    public Boolean hasKey(String key) {
        return redisTemplate.hasKey(key);
    }

    /**
     * 设置过期时间
     */
    public Boolean expire(String key, long timeout, TimeUnit unit) {
        return redisTemplate.expire(key, timeout, unit);
    }

    /**
     * 获取过期时间
     */
    public Long getExpire(String key, TimeUnit unit) {
        return redisTemplate.getExpire(key, unit);
    }

    // ========== 哈希操作 ==========

    /**
     * 设置哈希缓存
     */
    public void hSet(String key, String hashKey, Object value) {
        redisTemplate.opsForHash().put(key, hashKey, value);
    }

    /**
     * 获取哈希缓存
     */
    public Object hGet(String key, String hashKey) {
        return redisTemplate.opsForHash().get(key, hashKey);
    }

    /**
     * 获取哈希缓存，指定类型
     */
    @SuppressWarnings("unchecked")
    public <T> T hGet(String key, String hashKey, Class<T> type) {
        Object value = hGet(key, hashKey);
        return value != null ? (T) value : null;
    }

    /**
     * 删除哈希缓存
     */
    public Long hDelete(String key, Object... hashKeys) {
        return redisTemplate.opsForHash().delete(key, hashKeys);
    }

    /**
     * 检查哈希key是否存在
     */
    public Boolean hHasKey(String key, String hashKey) {
        return redisTemplate.opsForHash().hasKey(key, hashKey);
    }

    // ========== 列表操作 ==========

    /**
     * 从左边推入列表
     */
    public Long lPush(String key, Object value) {
        return redisTemplate.opsForList().leftPush(key, value);
    }

    /**
     * 从右边推入列表
     */
    public Long rPush(String key, Object value) {
        return redisTemplate.opsForList().rightPush(key, value);
    }

    /**
     * 从左边弹出列表
     */
    public Object lPop(String key) {
        return redisTemplate.opsForList().leftPop(key);
    }

    /**
     * 从右边弹出列表
     */
    public Object rPop(String key) {
        return redisTemplate.opsForList().rightPop(key);
    }

    /**
     * 获取列表长度
     */
    public Long lSize(String key) {
        return redisTemplate.opsForList().size(key);
    }

    // ========== 集合操作 ==========

    /**
     * 添加到集合
     */
    public Long sAdd(String key, Object... values) {
        return redisTemplate.opsForSet().add(key, values);
    }

    /**
     * 从集合中移除
     */
    public Long sRemove(String key, Object... values) {
        return redisTemplate.opsForSet().remove(key, values);
    }

    /**
     * 检查集合中是否存在
     */
    public Boolean sIsMember(String key, Object value) {
        return redisTemplate.opsForSet().isMember(key, value);
    }

    /**
     * 获取集合大小
     */
    public Long sSize(String key) {
        return redisTemplate.opsForSet().size(key);
    }

    // ========== 工具方法 ==========

    /**
     * 获取 Redis 信息
     */
    public String getRedisInfo() {
        try {
            var connectionFactory = redisTemplate.getConnectionFactory();
            if (connectionFactory != null) {
                var connection = connectionFactory.getConnection();
                var info = connection.serverCommands().info();
                return info != null ? info.toString() : "Redis信息为空";
            }
            return "Redis连接工厂不可用";
        } catch (Exception e) {
            return "无法获取Redis信息: " + e.getMessage();
        }
    }

    /**
     * 清空当前数据库的所有key
     * 谨慎使用！
     */
    public String flushDb() {
        try {
            var connectionFactory = redisTemplate.getConnectionFactory();
            if (connectionFactory != null) {
                var connection = connectionFactory.getConnection();
                connection.serverCommands().flushDb();
                return "数据库清空成功";
            }
            return "Redis连接工厂不可用";
        } catch (Exception e) {
            return "数据库清空失败: " + e.getMessage();
        }
    }
}
