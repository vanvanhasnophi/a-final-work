package com.roomx.controller;

import com.roomx.entity.User;
import com.roomx.service.UserService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
public class UserController {
    private final UserService userService;
    // 构造器注入
    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/action")
    public String doAction(@RequestBody User user) {
        return userService.doRoleSpecificAction(user);
    }
}
