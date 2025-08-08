package com.roomx.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;

/**
 * CSRF 令牌获取接口：前端首次访问/刷新时调用 /api/csrf 获取并从 Set-Cookie 中取得 XSRF-TOKEN。
 * 若使用 fetch/axios 需带上凭据 credentials: 'include' 并从 cookie 读取，再设置 X-XSRF-TOKEN 头。
 */
@RestController
@RequestMapping("/api")
public class CsrfController {

    @Value("${security.csrf.enabled:true}")
    private boolean csrfEnabled;

    @Value("${security.csrf.expose-token:false}")
    private boolean exposeToken;

    @GetMapping("/csrf")
    public ResponseEntity<?> getCsrf(HttpServletRequest request) {
        if (!csrfEnabled) {
            return ResponseEntity.ok(Map.of(
                "enabled", false,
                "message", "CSRF protection disabled"
            ));
        }
        CsrfToken token = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
        if (token == null) {
            return ResponseEntity.status(500).body(Map.of(
                "enabled", true,
                "error", "CSRF token not available"
            ));
        }
        if (exposeToken) {
            // 显式返回 token（仅在开发或特殊需要时开启）
            return ResponseEntity.ok(Map.of(
                "enabled", true,
                "headerName", token.getHeaderName(),
                "parameterName", token.getParameterName(),
                "token", token.getToken(),
                "cookie", "XSRF-TOKEN"
            ));
        }
        // 默认不返回 token，前端从 Cookie: XSRF-TOKEN 读取
        return ResponseEntity.ok(Map.of(
            "enabled", true,
            "headerName", token.getHeaderName(),
            "parameterName", token.getParameterName(),
            "cookie", "XSRF-TOKEN"
        ));
    }
}
