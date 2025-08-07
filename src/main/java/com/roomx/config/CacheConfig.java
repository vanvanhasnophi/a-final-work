package com.roomx.config;


import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableCaching
public class CacheConfig {
    
    /**
     * 配置缓存管理器
     * 使用内存缓存，也可以配置Redis缓存
     */
    @Bean
    public CacheManager cacheManager() {
        ConcurrentMapCacheManager cacheManager = new ConcurrentMapCacheManager();
        
        // 配置缓存名称
        cacheManager.setCacheNames(java.util.Arrays.asList(
            "users",
            "rooms", 
            "applications",
            "stats",
            "notifications"
        ));
        
        return cacheManager;
    }
    
    /**
     * 缓存配置
     */
    @Bean
    public org.springframework.cache.interceptor.CacheResolver cacheResolver() {
        return new org.springframework.cache.interceptor.SimpleCacheResolver(cacheManager());
    }
    
    /**
     * 缓存键生成器
     */
    @Bean
    public org.springframework.cache.interceptor.KeyGenerator keyGenerator() {
        return (target, method, params) -> {
            StringBuilder sb = new StringBuilder();
            sb.append(target.getClass().getSimpleName());
            sb.append(".");
            sb.append(method.getName());
            for (Object param : params) {
                sb.append(".");
                sb.append(param.toString());
            }
            return sb.toString();
        };
    }
} 