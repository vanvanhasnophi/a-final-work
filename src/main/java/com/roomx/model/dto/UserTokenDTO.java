package com.roomx.model.dto;

import com.roomx.model.entity.User;
import lombok.Data;

@Data
public class UserTokenDTO {
    private String token;
    private Long id;
    private String username;
    private String nickname;
    private String role;

    public static UserTokenDTO fromLogin(User user, String token) {
        if(user==null) throw new IllegalArgumentException("user is null");
        UserTokenDTO dto = new UserTokenDTO();
        dto.setToken(token);
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setNickname(user.getNickname());
        dto.setRole(user.getRole().name());
        return dto;
    }
}
