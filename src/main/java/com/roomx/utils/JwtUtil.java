package com.roomx.utils;

import io.jsonwebtoken.*;
import java.util.Date;
import com.roomx.constant.enums.UserRole;

public class JwtUtil {
    private static final String SECRET = "yourSecretKey";
    private static final long EXPIRATION = 86400000; // 1天

    public static String generateToken(String username, UserRole role) {
        return Jwts.builder()
                .setSubject(username)
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION))
                .signWith(SignatureAlgorithm.HS256, SECRET)
                .compact();
    }

    public static Claims parseToken(String token) {
        return Jwts.parser().setSigningKey(SECRET).parseClaimsJws(token).getBody();
    }

    public static void invalidateToken(String username) {
        // 无效化token
        
        // 删除token
    }
}
