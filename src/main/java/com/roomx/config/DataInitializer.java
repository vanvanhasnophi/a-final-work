package com.roomx.config;

import java.util.Date;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.roomx.constant.enums.ApplicationStatus;
import com.roomx.constant.enums.ApproverPermission;
import com.roomx.constant.enums.RoomStatus;
import com.roomx.constant.enums.RoomType;
import com.roomx.constant.enums.UserRole;
import com.roomx.model.entity.Application;
import com.roomx.model.entity.Room;
import com.roomx.model.entity.User;
import com.roomx.repository.ApplicationRepository;
import com.roomx.repository.RoomRepository;
import com.roomx.repository.UserRepository;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // 检查是否已有数据
        if (userRepository.count() > 0) {
            System.out.println("数据库中已有数据，跳过初始化");
            return;
        }

        System.out.println("开始初始化示例数据...");

        // 创建用户
        createUsers();
        
        // 创建房间
        createRooms();
        
        // 创建申请
        createApplications();

        System.out.println("示例数据初始化完成！");
    }

    private void createUsers() {
        // 创建管理员
        User admin = new User();
        admin.setUsername("admin");
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setNickname("系统管理员");
        admin.setEmail("admin@roomx.com");
        admin.setPhone("13333333333");
        admin.setRole(UserRole.ADMIN);
        admin.setCreateTime(new Date());
        admin.setLastLoginTime(new Date());
        userRepository.save(admin);

        // 创建申请人
        User applier1 = new User();
        applier1.setUsername("zhangsan");
        applier1.setPassword(passwordEncoder.encode("123456"));
        applier1.setNickname("张三");
        applier1.setEmail("zhangsan@tsinghua.edu.cn");
        applier1.setPhone("13234567890");
        applier1.setRole(UserRole.APPLIER);
        applier1.setDepartment("技术部");
        applier1.setCreateTime(new Date());
        applier1.setLastLoginTime(new Date());
        userRepository.save(applier1);

        User applier2 = new User();
        applier2.setUsername("lisi");
        applier2.setPassword(passwordEncoder.encode("123456"));
        applier2.setNickname("李四");
        applier2.setEmail("lisi@tsinghua.edu.cn");
        applier2.setPhone("132345645678");
        applier2.setRole(UserRole.APPLIER);
        applier2.setDepartment("管理科学与工程系");
        applier2.setCreateTime(new Date());
        applier2.setLastLoginTime(new Date());
        userRepository.save(applier2);

        User applier3 = new User();
        applier3.setUsername("wangwu");
        applier3.setPassword(passwordEncoder.encode("123456"));
        applier3.setNickname("王五");
        applier3.setEmail("wangwu@tsinghua.edu.cn");
        applier3.setPhone("13234567890");
        applier3.setRole(UserRole.APPLIER);
        applier3.setDepartment("自动化系");
        applier3.setCreateTime(new Date());
        applier3.setLastLoginTime(new Date());
        userRepository.save(applier3);

        User applier4 = new User();
        applier4.setUsername("zhaoliu");
        applier4.setPassword(passwordEncoder.encode("123456"));
        applier4.setNickname("赵六");
        applier4.setEmail("zhaoliu@tsinghua.edu.cn");
        applier4.setPhone("13233232323");
        applier4.setRole(UserRole.APPLIER);
        applier4.setDepartment("计算机系");
        applier4.setCreateTime(new Date());
        applier4.setLastLoginTime(new Date());
        userRepository.save(applier4);

        User applier5 = new User();
        applier5.setUsername("qianqi");
        applier5.setPassword(passwordEncoder.encode("123456"));
        applier5.setNickname("钱七");
        applier5.setEmail("qianqi@tsinghua.edu.cn");
        applier5.setPhone("1323325523");
        applier5.setRole(UserRole.APPLIER);
        applier5.setDepartment("电子系");
        applier5.setCreateTime(new Date());
        applier5.setLastLoginTime(new Date());
        userRepository.save(applier5);

        // 创建审批人
        User approver1 = new User();
        approver1.setUsername("approver1");
        approver1.setPassword(passwordEncoder.encode("123456"));
        approver1.setNickname("审批员1");
        approver1.setEmail("approver1@tsinghua.edu.cn");
        approver1.setPhone("13233255983");
        approver1.setRole(UserRole.APPROVER);
        approver1.setDepartment("IT中心");
        approver1.setPermission(ApproverPermission.EXTENDED);
        approver1.setCreateTime(new Date());
        approver1.setLastLoginTime(new Date());
        userRepository.save(approver1);

        User approver2 = new User();
        approver2.setUsername("approver2");
        approver2.setPassword(passwordEncoder.encode("123456"));
        approver2.setNickname("审批员2");
        approver2.setEmail("approver2@tsinghua.edu.cn");
        approver2.setPhone("13232344383");
        approver2.setRole(UserRole.APPROVER);
        approver2.setDepartment("IT中心");
        approver2.setPermission(ApproverPermission.EXTENDED);
        approver2.setCreateTime(new Date());
        approver2.setLastLoginTime(new Date());
        userRepository.save(approver2);

        // 创建服务人员
        User serviceStaff1 = new User();
        serviceStaff1.setUsername("service1");
        serviceStaff1.setPassword(passwordEncoder.encode("123456"));
        serviceStaff1.setNickname("服务人员1");
        serviceStaff1.setEmail("service1@tsinghua.edu.cn");
        serviceStaff1.setPhone("13277255983");
        serviceStaff1.setRole(UserRole.SERVICE_STAFF);
        serviceStaff1.setServiceArea("前台服务");
        serviceStaff1.setCreateTime(new Date());
        serviceStaff1.setLastLoginTime(new Date());
        userRepository.save(serviceStaff1);

        User serviceStaff2 = new User();
        serviceStaff2.setUsername("service2");
        serviceStaff2.setPassword(passwordEncoder.encode("123456"));
        serviceStaff2.setNickname("服务人员2");
        serviceStaff2.setEmail("service2@tsinghua.edu.cn");
        serviceStaff2.setPhone("13662255983");
        serviceStaff2.setRole(UserRole.SERVICE_STAFF);
        serviceStaff2.setServiceArea("后勤服务");
        serviceStaff2.setCreateTime(new Date());
        serviceStaff2.setLastLoginTime(new Date());
        userRepository.save(serviceStaff2);

        // 创建维修人员
        User maintainer1 = new User();
        maintainer1.setUsername("maintainer1");
        maintainer1.setPassword(passwordEncoder.encode("123456"));
        maintainer1.setNickname("维修人员1");
        maintainer1.setEmail("maintainer1@tsinghua.edu.cn");
        maintainer1.setPhone("13233255654");
        maintainer1.setRole(UserRole.MAINTAINER);
        maintainer1.setSkill("电气维修");
        maintainer1.setCreateTime(new Date());
        maintainer1.setLastLoginTime(new Date());
        userRepository.save(maintainer1);

        User maintainer2 = new User();
        maintainer2.setUsername("maintainer2");
        maintainer2.setPassword(passwordEncoder.encode("123456"));
        maintainer2.setNickname("维修人员2");
        maintainer2.setEmail("maintainer2@tsinghua.edu.cn");
        maintainer2.setPhone("13237655654");
        maintainer2.setRole(UserRole.MAINTAINER);
        maintainer2.setSkill("设备维护");
        maintainer2.setCreateTime(new Date());
        maintainer2.setLastLoginTime(new Date());
        userRepository.save(maintainer2);
    }

    private void createRooms() {
        // 会议室A - 研讨间，可用
        Room room1 = new Room();
        room1.setName("会议室A");
        room1.setDescription("大型会议室，配备投影仪和音响设备");
        room1.setType(RoomType.SEMINAR_ROOM);
        room1.setCapacity(20L);
        room1.setLocation("1楼101室");
        room1.setStatus(RoomStatus.AVAILABLE);
        room1.setCreateTime(new Date());
        room1.setUpdateTime(new Date());
        room1.setLastMaintenanceTime(new Date(System.currentTimeMillis() - 30L * 24 * 60 * 60 * 1000));
        roomRepository.save(room1);

        // 会议室B - 研讨间，已预约
        Room room2 = new Room();
        room2.setName("会议室B");
        room2.setDescription("中型会议室，适合小组讨论");
        room2.setType(RoomType.SEMINAR_ROOM);
        room2.setCapacity(12L);
        room2.setLocation("1楼102室");
        room2.setStatus(RoomStatus.RESERVED);
        room2.setCreateTime(new Date());
        room2.setUpdateTime(new Date());
        room2.setLastMaintenanceTime(new Date(System.currentTimeMillis() - 25L * 24 * 60 * 60 * 1000));
        roomRepository.save(room2);

        // 培训室A - 平面教室，可用
        Room room3 = new Room();
        room3.setName("培训室A");
        room3.setDescription("专业培训教室，配备多媒体设备");
        room3.setType(RoomType.LECTURE_ROOM);
        room3.setCapacity(30L);
        room3.setLocation("2楼201室");
        room3.setStatus(RoomStatus.AVAILABLE);
        room3.setCreateTime(new Date());
        room3.setUpdateTime(new Date());
        room3.setLastMaintenanceTime(new Date(System.currentTimeMillis() - 20L * 24 * 60 * 60 * 1000));
        roomRepository.save(room3);

        // 培训室B - 平面教室，使用中
        Room room4 = new Room();
        room4.setName("培训室B");
        room4.setDescription("小型培训室，适合技能培训");
        room4.setType(RoomType.LECTURE_ROOM);
        room4.setCapacity(15L);
        room4.setLocation("2楼202室");
        room4.setStatus(RoomStatus.USING);
        room4.setCreateTime(new Date());
        room4.setUpdateTime(new Date());
        room4.setLastMaintenanceTime(new Date(System.currentTimeMillis() - 15L * 24 * 60 * 60 * 1000));
        roomRepository.save(room4);

        // 案例教室A - 案例教室，可用
        Room room5 = new Room();
        room5.setName("案例教室A");
        room5.setDescription("案例讨论专用教室");
        room5.setType(RoomType.CASE_ROOM);
        room5.setCapacity(25L);
        room5.setLocation("3楼301室");
        room5.setStatus(RoomStatus.AVAILABLE);
        room5.setCreateTime(new Date());
        room5.setUpdateTime(new Date());
        room5.setLastMaintenanceTime(new Date(System.currentTimeMillis() - 10L * 24 * 60 * 60 * 1000));
        roomRepository.save(room5);

        // 实验室A - 实验室，维修中
        Room room6 = new Room();
        room6.setName("实验室A");
        room6.setDescription("计算机实验室，配备专业设备");
        room6.setType(RoomType.LAB_ROOM);
        room6.setCapacity(40L);
        room6.setLocation("4楼401室");
        room6.setStatus(RoomStatus.MAINTENANCE);
        room6.setCreateTime(new Date());
        room6.setUpdateTime(new Date());
        room6.setLastMaintenanceTime(new Date(System.currentTimeMillis() - 5L * 24 * 60 * 60 * 1000));
        roomRepository.save(room6);

        // 研讨间A - 研讨间，可用
        Room room7 = new Room();
        room7.setName("研讨间A");
        room7.setDescription("小型研讨间，适合3-5人讨论");
        room7.setType(RoomType.SEMINAR_ROOM);
        room7.setCapacity(5L);
        room7.setLocation("5楼501室");
        room7.setStatus(RoomStatus.AVAILABLE);
        room7.setCreateTime(new Date());
        room7.setUpdateTime(new Date());
        room7.setLastMaintenanceTime(new Date(System.currentTimeMillis() - 35L * 24 * 60 * 60 * 1000));
        roomRepository.save(room7);

        // 研讨间B - 研讨间，清洁中
        Room room8 = new Room();
        room8.setName("研讨间B");
        room8.setDescription("中型研讨间，适合8-10人讨论");
        room8.setType(RoomType.SEMINAR_ROOM);
        room8.setCapacity(10L);
        room8.setLocation("5楼502室");
        room8.setStatus(RoomStatus.CLEANING);
        room8.setCreateTime(new Date());
        room8.setUpdateTime(new Date());
        room8.setLastMaintenanceTime(new Date(System.currentTimeMillis() - 40L * 24 * 60 * 60 * 1000));
        roomRepository.save(room8);

        // 会议室C - 研讨间，可用
        Room room9 = new Room();
        room9.setName("会议室C");
        room9.setDescription("VIP会议室，配备高级设备");
        room9.setType(RoomType.SEMINAR_ROOM);
        room9.setCapacity(8L);
        room9.setLocation("6楼601室");
        room9.setStatus(RoomStatus.AVAILABLE);
        room9.setCreateTime(new Date());
        room9.setUpdateTime(new Date());
        room9.setLastMaintenanceTime(new Date(System.currentTimeMillis() - 45L * 24 * 60 * 60 * 1000));
        roomRepository.save(room9);

        // 多功能厅 - 其他，可用
        Room room10 = new Room();
        room10.setName("多功能厅");
        room10.setDescription("大型多功能厅，可容纳100人");
        room10.setType(RoomType.OTHER_ROOM);
        room10.setCapacity(100L);
        room10.setLocation("1楼大厅");
        room10.setStatus(RoomStatus.AVAILABLE);
        room10.setCreateTime(new Date());
        room10.setUpdateTime(new Date());
        room10.setLastMaintenanceTime(new Date(System.currentTimeMillis() - 50L * 24 * 60 * 60 * 1000));
        roomRepository.save(room10);
    }

    private void createApplications() {
        // 获取用户和房间
        User zhangsan = userRepository.findByUsername("zhangsan");
        User lisi = userRepository.findByUsername("lisi");
        User wangwu = userRepository.findByUsername("wangwu");

        // 由于RoomRepository没有findByName方法，我们直接使用ID
        Room room1 = roomRepository.findById(1L).orElse(null);
        Room room2 = roomRepository.findById(2L).orElse(null);
        Room room3 = roomRepository.findById(3L).orElse(null);
        Room room5 = roomRepository.findById(5L).orElse(null);
        Room room7 = roomRepository.findById(7L).orElse(null);
        Room room9 = roomRepository.findById(9L).orElse(null);

        if (zhangsan != null && room1 != null) {
            // 张三的申请 - 已批准
            Application app1 = new Application();
            app1.setCrowd(15L);
            app1.setContact("zhangsan@tsinghua.edu.cn");
            app1.setReason("技术部周会讨论项目进展");
            app1.setStatus(ApplicationStatus.APPROVED);
            app1.setCreateTime(new Date(System.currentTimeMillis() - 7L * 24 * 60 * 60 * 1000));
            app1.setUpdateTime(new Date(System.currentTimeMillis() - 6L * 24 * 60 * 60 * 1000));
            app1.setStartTime(new Date(System.currentTimeMillis() - 5L * 24 * 60 * 60 * 1000));
            app1.setEndTime(new Date(System.currentTimeMillis() - 5L * 24 * 60 * 60 * 1000));
            app1.setRoom(room1);
            app1.setUser(zhangsan);
            app1.syncUserInfo(zhangsan);
            app1.syncRoomInfo(room1);
            applicationRepository.save(app1);

            // 张三的申请 - 待审批
            Application app6 = new Application();
            app6.setCrowd(20L);
            app6.setContact("zhangsan@tsinghua.edu.cn");
            app6.setReason("技术部代码评审会议");
            app6.setStatus(ApplicationStatus.PENDING);
            app6.setCreateTime(new Date());
            app6.setUpdateTime(new Date());
            app6.setStartTime(new Date(System.currentTimeMillis() + 3L * 24 * 60 * 60 * 1000));
            app6.setEndTime(new Date(System.currentTimeMillis() + 3L * 24 * 60 * 60 * 1000));
            app6.setRoom(room1);
            app6.setUser(zhangsan);
            app6.syncUserInfo(zhangsan);
            app6.syncRoomInfo(room1);
            applicationRepository.save(app6);
        }

        if (lisi != null && room2 != null) {
            // 李四的申请 - 待审批
            Application app2 = new Application();
            app2.setCrowd(8L);
            app2.setContact("lisi@tsinghua.edu.cn");
            app2.setReason("管理科学与工程系产品发布会");
            app2.setStatus(ApplicationStatus.PENDING);
            app2.setCreateTime(new Date(System.currentTimeMillis() - 3L * 24 * 60 * 60 * 1000));
            app2.setUpdateTime(new Date(System.currentTimeMillis() - 3L * 24 * 60 * 60 * 1000));
            app2.setStartTime(new Date(System.currentTimeMillis() + 2L * 24 * 60 * 60 * 1000));
            app2.setEndTime(new Date(System.currentTimeMillis() + 2L * 24 * 60 * 60 * 1000));
            app2.setRoom(room2);
            app2.setUser(lisi);
            app2.syncUserInfo(lisi);
            app2.syncRoomInfo(room2);
            applicationRepository.save(app2);

            // 李四的申请 - 已驳回
            Application app7 = new Application();
            app7.setCrowd(10L);
            app7.setContact("lisi@tsinghua.edu.cn");
            app7.setReason("管理科学与工程系客户需求分析");
            app7.setStatus(ApplicationStatus.REJECTED);
            app7.setCreateTime(new Date());
            app7.setUpdateTime(new Date());
            app7.setStartTime(new Date(System.currentTimeMillis() + 5L * 24 * 60 * 60 * 1000));
            app7.setEndTime(new Date(System.currentTimeMillis() + 5L * 24 * 60 * 60 * 1000));
            app7.setRoom(room2);
            app7.setUser(lisi);
            app7.syncUserInfo(lisi);
            app7.syncRoomInfo(room2);
            applicationRepository.save(app7);
        }

        if (wangwu != null && room3 != null) {
            // 王五的申请 - 已批准
            Application app3 = new Application();
            app3.setCrowd(25L);
            app3.setContact("wangwu@tsinghua.edu.cn");
            app3.setReason("自动化系新员工培训");
            app3.setStatus(ApplicationStatus.APPROVED);
            app3.setCreateTime(new Date(System.currentTimeMillis() - 10L * 24 * 60 * 60 * 1000));
            app3.setUpdateTime(new Date(System.currentTimeMillis() - 9L * 24 * 60 * 60 * 1000));
            app3.setStartTime(new Date(System.currentTimeMillis() - 8L * 24 * 60 * 60 * 1000));
            app3.setEndTime(new Date(System.currentTimeMillis() - 8L * 24 * 60 * 60 * 1000));
            app3.setRoom(room3);
            app3.setUser(wangwu);
            app3.syncUserInfo(wangwu);
            app3.syncRoomInfo(room3);
            applicationRepository.save(app3);

            // 王五的申请 - 已完成
            Application app8 = new Application();
            app8.setCrowd(30L);
            app8.setContact("wangwu@tsinghua.edu.cn");
            app8.setReason("自动化系年度总结会议");
            app8.setStatus(ApplicationStatus.COMPLETED);
            app8.setCreateTime(new Date(System.currentTimeMillis() - 15L * 24 * 60 * 60 * 1000));
            app8.setUpdateTime(new Date(System.currentTimeMillis() - 14L * 24 * 60 * 60 * 1000));
            app8.setStartTime(new Date(System.currentTimeMillis() - 13L * 24 * 60 * 60 * 1000));
            app8.setEndTime(new Date(System.currentTimeMillis() - 13L * 24 * 60 * 60 * 1000));
            app8.setRoom(room3);
            app8.setUser(wangwu);
            app8.syncUserInfo(wangwu);
            app8.syncRoomInfo(room3);
            applicationRepository.save(app8);
        }
    }
} 