package com.roomx.config;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
// Use GenericJackson2JsonRedisSerializer to avoid deprecated default typing setup
import org.springframework.data.redis.serializer.StringRedisSerializer;

// Removed explicit ObjectMapper with activateDefaultTyping for security & deprecation reasons

/**
 * Redis 配置类
 * 提供 Redis 缓存管理器和 RedisTemplate 配置
 */
@Configuration
@EnableCaching
// 生产环境默认启用；开发环境可通过 redis.enabled=true 或添加 redis profile 启用
@Profile({"prod", "dev", "redis"})
@org.springframework.boot.autoconfigure.condition.ConditionalOnProperty(name = "redis.enabled", havingValue = "true", matchIfMissing = false)
public class RedisConfig {

    private static final Logger log = LoggerFactory.getLogger(RedisConfig.class);

    @Value("${spring.redis.host:localhost}")
    private String redisHost;

    @Value("${spring.redis.port:6379}")
    private int redisPort;

    @Value("${spring.redis.password:}")
    private String redisPassword;

    @Value("${spring.redis.database:0}")
    private int database;

    @Value("${redis.fail-fast:false}")
    private boolean failFast;

    /**
     * Redis 连接工厂配置
     */
    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        RedisStandaloneConfiguration redisConfig = new RedisStandaloneConfiguration();
        redisConfig.setHostName(redisHost);
        redisConfig.setPort(redisPort);
        redisConfig.setDatabase(database);
        
        // 如果有密码则设置密码
        if (redisPassword != null && !redisPassword.trim().isEmpty()) {
            redisConfig.setPassword(redisPassword);
        }
        
        return new LettuceConnectionFactory(redisConfig);
    }

    /**
     * Redis 缓存管理器配置
     */
    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory redisConnectionFactory) {
        // 默认缓存配置
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(30)) // 默认30分钟过期
                .serializeKeysWith(org.springframework.data.redis.serializer.RedisSerializationContext.SerializationPair
                        .fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(org.springframework.data.redis.serializer.RedisSerializationContext.SerializationPair
                        .fromSerializer(new GenericJackson2JsonRedisSerializer()));

        // 为不同缓存设置不同的过期时间
        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();
        
        // 用户缓存 - 1小时过期
        cacheConfigurations.put("users", defaultConfig.entryTtl(Duration.ofHours(1)));
        
        // 教室缓存 - 2小时过期
        cacheConfigurations.put("rooms", defaultConfig.entryTtl(Duration.ofHours(2)));
        
        // 申请缓存 - 30分钟过期
        cacheConfigurations.put("applications", defaultConfig.entryTtl(Duration.ofMinutes(30)));
        
        // 统计缓存 - 10分钟过期
        cacheConfigurations.put("stats", defaultConfig.entryTtl(Duration.ofMinutes(10)));
        
        // 通知缓存 - 5分钟过期
        cacheConfigurations.put("notifications", defaultConfig.entryTtl(Duration.ofMinutes(5)));

        return RedisCacheManager.builder(redisConnectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigurations)
                .build();
    }

    /**
     * RedisTemplate 配置
     * 用于直接操作 Redis
     */
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory redisConnectionFactory) {
        RedisTemplate<String, Object> redisTemplate = new RedisTemplate<>();
        redisTemplate.setConnectionFactory(redisConnectionFactory);

        // Key serializers
        StringRedisSerializer keySerializer = new StringRedisSerializer();
        redisTemplate.setKeySerializer(keySerializer);
        redisTemplate.setHashKeySerializer(keySerializer);

        // Value serializers - generic JSON (includes type info in safe envelope)
        GenericJackson2JsonRedisSerializer genericSerializer = new GenericJackson2JsonRedisSerializer();
        redisTemplate.setValueSerializer(genericSerializer);
        redisTemplate.setHashValueSerializer(genericSerializer);

        redisTemplate.afterPropertiesSet();
        return redisTemplate;
    }

    /**
     * 启动后验证 Redis 连接（可选失败策略）
     */
    @Bean
    public org.springframework.beans.factory.SmartInitializingSingleton redisStartupValidator(
            RedisConnectionFactory redisConnectionFactory) {
        return () -> {
            try (var connection = redisConnectionFactory.getConnection()) {
                String pong = connection.ping();
                log.info("Redis 连接验证成功: PING -> {}", pong);
            } catch (Exception ex) {
                String msg = "Redis 连接验证失败: " + ex.getMessage();
                if (failFast) {
                    log.error(msg + " (fail-fast=true, 中止启动)");
                    throw new IllegalStateException(msg, ex);
                } else {
                    log.warn(msg + " (fail-fast=false, 继续使用应用其余功能)");
                }
            }
        };
    }

    /**
     * 缓存键生成器
     */
    @Bean
    public org.springframework.cache.interceptor.KeyGenerator keyGenerator() {
        return (target, method, params) -> {
            StringBuilder sb = new StringBuilder();
            sb.append(target.getClass().getSimpleName())
              .append(":")
              .append(method.getName());
            
            for (Object param : params) {
                sb.append(":").append(param != null ? param.toString() : "null");
            }
            
            return sb.toString();
        };
    }
}
