package com.roomx.utils;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import java.security.Key;
import java.util.Date;
import com.roomx.constant.enums.UserRole;

public class JwtUtil {
    private static final String SECRET_STRING = "yourSecretKeyForRoomXApplication2024";
    private static final Key SECRET_KEY = Keys.hmacShaKeyFor(SECRET_STRING.getBytes());
    private static final long EXPIRATION = 86400000; // 1天

    public static String generateToken(String username, UserRole role) {
        return Jwts.builder()
                .setSubject(username)
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION))
                .signWith(SECRET_KEY, SignatureAlgorithm.HS256)
                .compact();
    }

    public static Claims parseToken(String token) {
        return Jwts.parser()
                .setSigningKey(SECRET_KEY)
                .parseClaimsJws(token)
                .getBody();
    }

    public static boolean validateToken(String token) {
        try {
            Jwts.parser()
                .setSigningKey(SECRET_KEY)
                .parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public static String getUsernameFromToken(String token) {
        Claims claims = parseToken(token);
        return claims.getSubject();
    }

    public static UserRole getRoleFromToken(String token) {
        Claims claims = parseToken(token);
        return (UserRole) claims.get("role");
    }

    public static void invalidateToken(String username) {
        // 无效化token
        // 在实际应用中，可以将token加入黑名单
        // 这里简化处理，实际可以通过Redis等缓存来实现
    }
}
