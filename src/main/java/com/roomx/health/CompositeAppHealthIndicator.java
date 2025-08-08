package com.roomx.health;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.boot.actuate.health.Status;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

/**
 * 自定义聚合健康指示器，整合核心依赖状态（可扩展）。
 * 若未启用 redis 或 redis 连接失败但允许降级时不会影响整体 UP（标记为 WARN）。
 */
@Component
@Primary
@ConditionalOnClass(HealthIndicator.class)
@ConditionalOnProperty(name = "management.custom.health.composite.enabled", matchIfMissing = true)
@ConditionalOnMissingBean(name = "compositeAppHealthIndicator")
public class CompositeAppHealthIndicator implements HealthIndicator {

    private final org.springframework.context.ApplicationContext ctx;

    public CompositeAppHealthIndicator(org.springframework.context.ApplicationContext ctx) {
        this.ctx = ctx;
    }

    @Override
    public Health health() {
        Map<String, Object> details = new LinkedHashMap<>();
        Status overall = Status.UP;

        // 数据库健康（Spring Boot DataSourceHealthIndicator 已存在，借助其状态）
        var dbIndicator = getIndicator("db");
        if (dbIndicator != null) {
            Health h = dbIndicator.health();
            details.put("database", h.getStatus());
            if (Status.DOWN.equals(h.getStatus()) || Status.OUT_OF_SERVICE.equals(h.getStatus())) {
                overall = Status.DOWN;
            }
        }

        // Redis 健康（如果有）
        var redisIndicator = getIndicator("redis");
        if (redisIndicator != null) {
            Health h = redisIndicator.health();
            details.put("redis", h.getStatus());
            if (Status.DOWN.equals(h.getStatus())) {
                // 降级策略：Redis DOWN 不直接拉低整体（视业务关键程度可配置）
                details.put("redis.degraded", true);
            }
        } else {
            details.put("redis", "disabled");
        }

        return Health.status(overall).withDetails(details).build();
    }

    private HealthIndicator getIndicator(String name) {
        try {
            // Spring Actuator 内部命名约定: <name>HealthIndicator bean 名称通常包含 name
            return ctx.getBeansOfType(HealthIndicator.class).entrySet().stream()
                    .filter(e -> e.getKey().toLowerCase().contains(name.toLowerCase()))
                    .map(Map.Entry::getValue)
                    .findFirst()
                    .orElse(null);
        } catch (Exception e) {
            return null;
        }
    }
}
