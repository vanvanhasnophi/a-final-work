package com.roomx;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.EnableAspectJAutoProxy;

import com.roomx.constant.consist.appInfo;

@SpringBootApplication
@EnableAspectJAutoProxy
public class App {
    public static void main(String[] args) {
        SpringApplication.run(App.class, args);
        // 打印启动信息
        System.out.println("""
██████╗  ██████╗  ██████╗ ███╗   ███╗██╗  ██╗
██╔══██╗██╔═══██╗██╔═══██╗████╗ ████║╚██╗██╔╝
██████╔╝██║   ██║██║   ██║██╔████╔██║ ╚███╔╝
██╔══██╗██║   ██║██║   ██║██║╚██╔╝██║ ██╔██╗
██║  ██║╚██████╔╝╚██████╔╝██║ ╚═╝ ██║██╔╝ ██╗
╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝
\033[32mRoomX"""+"  "+ appInfo.VERSION+"\033[0m"+"                         By Vince");
        System.out.println("\033[32mRoomX 后端已启动\033[0m");
    }
}
