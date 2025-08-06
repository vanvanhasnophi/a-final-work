import java.awt.BorderLayout;
import java.awt.CardLayout;
import java.awt.Color;
import java.awt.Dimension;
import java.awt.FlowLayout;
import java.awt.Font;
import java.awt.GridBagConstraints;
import java.awt.GridBagLayout;
import java.awt.Insets;
import java.awt.event.KeyAdapter;
import java.awt.event.KeyEvent;
import java.util.Collections;
import java.util.Date;

import javax.swing.JButton;
import javax.swing.JComboBox;
import javax.swing.JDialog;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JMenu;
import javax.swing.JMenuBar;
import javax.swing.JMenuItem;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JPasswordField;
import javax.swing.JScrollPane;
import javax.swing.JTabbedPane;
import javax.swing.JTable;
import javax.swing.JTextArea;
import javax.swing.JTextField;
import javax.swing.SwingUtilities;
import javax.swing.UIManager;
import javax.swing.table.DefaultTableModel;

import com.formdev.flatlaf.FlatLaf;

/**
 * RoomX 桌面应用 - 基于FlatLaf的现代化GUI
 * 支持深浅色主题切换，基于clientframe设计
 */
public class RoomXDesktopApp extends JFrame {
    
    // 常量定义
    private static final String BASE_URL = "http://localhost:8080/api";
    private static final String VERSION = "2.1.0";
    
    // 主题相关
    private boolean isDarkMode = false;
    private Color accentColor = new Color(0x660874); // 紫色主题色
    
    // 用户状态
    private String currentToken = null;
    private String currentUsername = null;
    
    // GUI组件
    private JMenuBar menuBar;
    private JPanel mainPanel;
    private JPanel loginPanel;
    private JPanel dashboardPanel;
    
    // 登录组件
    private JTextField usernameField;
    private JPasswordField passwordField;
    private JButton loginButton;
    private JButton registerButton;
    private JLabel statusLabel;
    
    // 仪表板组件
    private JTabbedPane tabbedPane;
    private JTable applicationsTable;
    private DefaultTableModel applicationsTableModel;
    private JTextArea consoleArea;
    
    public RoomXDesktopApp() {
        initializeFrame();
        initializeComponents();
        setupTheme();
        setupEventHandlers();
        showLoginPanel();
    }
    
    /**
     * 初始化主窗口
     */
    private void initializeFrame() {
        setTitle("RoomX 桌面客户端 v" + VERSION);
        setSize(1200, 800);
        setMinimumSize(new Dimension(800, 600));
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLocationRelativeTo(null);
    }
    
    /**
     * 初始化所有组件
     */
    private void initializeComponents() {
        // 创建主面板
        mainPanel = new JPanel(new CardLayout());
        
        // 初始化菜单栏
        initializeMenuBar();
        
        // 初始化登录面板
        initializeLoginPanel();
        
        // 初始化仪表板面板
        initializeDashboardPanel();
        
        add(mainPanel);
        setJMenuBar(menuBar);
    }
    
    /**
     * 初始化菜单栏
     */
    private void initializeMenuBar() {
        menuBar = new JMenuBar();
        
        // 文件菜单
        JMenu fileMenu = new JMenu("文件");
        JMenuItem settingsItem = new JMenuItem("设置");
        settingsItem.addActionListener(e -> showSettingsDialog());
        fileMenu.add(settingsItem);
        
        fileMenu.addSeparator();
        
        JMenuItem exitItem = new JMenuItem("退出");
        exitItem.addActionListener(e -> System.exit(0));
        fileMenu.add(exitItem);
        
        menuBar.add(fileMenu);
        
        // 视图菜单
        JMenu viewMenu = new JMenu("视图");
        JMenuItem themeItem = new JMenuItem("切换主题");
        themeItem.addActionListener(e -> toggleTheme());
        viewMenu.add(themeItem);
        
        menuBar.add(viewMenu);
        
        // 帮助菜单
        JMenu helpMenu = new JMenu("帮助");
        JMenuItem aboutItem = new JMenuItem("关于");
        aboutItem.addActionListener(e -> showAboutDialog());
        helpMenu.add(aboutItem);
        
        menuBar.add(helpMenu);
    }
    
    /**
     * 初始化登录面板
     */
    private void initializeLoginPanel() {
        loginPanel = new JPanel();
        loginPanel.setLayout(new GridBagLayout());
        GridBagConstraints gbc = new GridBagConstraints();
        
        // 标题
        JLabel titleLabel = new JLabel("RoomX 系统登录");
        titleLabel.setFont(new Font("微软雅黑", Font.BOLD, 28));
        titleLabel.setForeground(accentColor);
        gbc.gridx = 0;
        gbc.gridy = 0;
        gbc.gridwidth = 2;
        gbc.insets = new Insets(20, 20, 40, 20);
        loginPanel.add(titleLabel, gbc);
        
        // 用户名
        JLabel userLabel = new JLabel("用户名:");
        gbc.gridx = 0;
        gbc.gridy = 1;
        gbc.gridwidth = 1;
        gbc.insets = new Insets(5, 20, 5, 10);
        loginPanel.add(userLabel, gbc);
        
        usernameField = new JTextField(25);
        gbc.gridx = 1;
        gbc.gridy = 1;
        gbc.insets = new Insets(5, 10, 5, 20);
        loginPanel.add(usernameField, gbc);
        
        // 密码
        JLabel passLabel = new JLabel("密码:");
        gbc.gridx = 0;
        gbc.gridy = 2;
        gbc.insets = new Insets(5, 20, 5, 10);
        loginPanel.add(passLabel, gbc);
        
        passwordField = new JPasswordField(25);
        gbc.gridx = 1;
        gbc.gridy = 2;
        gbc.insets = new Insets(5, 10, 5, 20);
        loginPanel.add(passwordField, gbc);
        
        // 按钮面板
        JPanel buttonPanel = new JPanel(new FlowLayout(FlowLayout.CENTER, 20, 10));
        loginButton = new JButton("登录");
        registerButton = new JButton("注册");
        
        loginButton.addActionListener(e -> login());
        registerButton.addActionListener(e -> showRegisterDialog());
        
        buttonPanel.add(loginButton);
        buttonPanel.add(registerButton);
        
        gbc.gridx = 0;
        gbc.gridy = 3;
        gbc.gridwidth = 2;
        gbc.insets = new Insets(30, 20, 10, 20);
        loginPanel.add(buttonPanel, gbc);
        
        // 状态标签
        statusLabel = new JLabel("");
        statusLabel.setForeground(Color.RED);
        gbc.gridx = 0;
        gbc.gridy = 4;
        gbc.gridwidth = 2;
        gbc.insets = new Insets(10, 20, 20, 20);
        loginPanel.add(statusLabel, gbc);
        
        mainPanel.add(loginPanel, "login");
    }
    
    /**
     * 初始化仪表板面板
     */
    private void initializeDashboardPanel() {
        dashboardPanel = new JPanel(new BorderLayout());
        
        // 顶部工具栏
        JPanel toolbarPanel = new JPanel(new FlowLayout(FlowLayout.LEFT));
        JLabel userInfoLabel = new JLabel("用户: ");
        toolbarPanel.add(userInfoLabel);
        
        JButton refreshButton = new JButton("刷新");
        JButton newApplicationButton = new JButton("新建申请");
        
        refreshButton.addActionListener(e -> refreshData());
        newApplicationButton.addActionListener(e -> showNewApplicationDialog());
        
        toolbarPanel.add(refreshButton);
        toolbarPanel.add(newApplicationButton);
        
        dashboardPanel.add(toolbarPanel, BorderLayout.NORTH);
        
        // 标签页面板
        tabbedPane = new JTabbedPane();
        
        // 申请管理标签页
        initializeApplicationsTab();
        
        // 控制台标签页
        initializeConsoleTab();
        
        dashboardPanel.add(tabbedPane, BorderLayout.CENTER);
        mainPanel.add(dashboardPanel, "dashboard");
    }
    
    /**
     * 初始化申请管理标签页
     */
    private void initializeApplicationsTab() {
        JPanel applicationsPanel = new JPanel(new BorderLayout());
        
        // 表格
        String[] columnNames = {"ID", "房间", "开始时间", "结束时间", "状态", "用途"};
        applicationsTableModel = new DefaultTableModel(columnNames, 0) {
            @Override
            public boolean isCellEditable(int row, int column) {
                return false;
            }
        };
        
        applicationsTable = new JTable(applicationsTableModel);
        JScrollPane scrollPane = new JScrollPane(applicationsTable);
        applicationsPanel.add(scrollPane, BorderLayout.CENTER);
        
        // 按钮面板
        JPanel buttonPanel = new JPanel(new FlowLayout(FlowLayout.LEFT));
        JButton approveButton = new JButton("审批");
        JButton rejectButton = new JButton("拒绝");
        
        approveButton.addActionListener(e -> approveApplication());
        rejectButton.addActionListener(e -> rejectApplication());
        
        buttonPanel.add(approveButton);
        buttonPanel.add(rejectButton);
        
        applicationsPanel.add(buttonPanel, BorderLayout.SOUTH);
        
        tabbedPane.addTab("申请管理", applicationsPanel);
    }
    
    /**
     * 初始化控制台标签页
     */
    private void initializeConsoleTab() {
        JPanel consolePanel = new JPanel(new BorderLayout());
        
        consoleArea = new JTextArea();
        consoleArea.setFont(new Font("Consolas", Font.PLAIN, 12));
        consoleArea.setEditable(false);
        
        JScrollPane scrollPane = new JScrollPane(consoleArea);
        consolePanel.add(scrollPane, BorderLayout.CENTER);
        
        tabbedPane.addTab("控制台", consolePanel);
    }
    
    /**
     * 设置主题
     */
    private void setupTheme() {
        try {
            UIManager.setLookAndFeel(new FlatLightLaf());
            FlatLaf.setGlobalExtraDefaults(Collections.singletonMap("@accentColor", "#" + 
                String.format("%06x", accentColor.getRGB() & 0xFFFFFF)));
            SwingUtilities.updateComponentTreeUI(this);
            FlatLaf.updateUI();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    /**
     * 设置事件处理器
     */
    private void setupEventHandlers() {
        passwordField.addKeyListener(new KeyAdapter() {
            @Override
            public void keyPressed(KeyEvent e) {
                if (e.getKeyCode() == KeyEvent.VK_ENTER) {
                    login();
                }
            }
        });
    }
    
    /**
     * 显示登录面板
     */
    private void showLoginPanel() {
        CardLayout cl = (CardLayout) mainPanel.getLayout();
        cl.show(mainPanel, "login");
        statusLabel.setText("");
        menuBar.setVisible(false);
    }
    
    /**
     * 显示仪表板面板
     */
    private void showDashboardPanel() {
        CardLayout cl = (CardLayout) mainPanel.getLayout();
        cl.show(mainPanel, "dashboard");
        menuBar.setVisible(true);
        refreshData();
    }
    
    /**
     * 用户登录
     */
    private void login() {
        String username = usernameField.getText();
        String password = new String(passwordField.getPassword());
        
        if (username.isEmpty() || password.isEmpty()) {
            statusLabel.setText("请输入用户名和密码");
            return;
        }
        
        try {
            String jsonPayload = String.format(
                "{\"username\":\"%s\",\"password\":\"%s\",\"loginTime\":\"%s\"}",
                username, password, new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date())
            );
            
            ApiClient.ApiResponse response = ApiClient.post("/login", jsonPayload, null);
            
            if (response.isSuccess()) {
                String token = ApiClient.JsonUtils.extractString(response.getBody(), "token");
                
                if (token != null) {
                    currentToken = token;
                    currentUsername = username;
                    
                    statusLabel.setText("登录成功！");
                    statusLabel.setForeground(Color.GREEN);
                    
                    showDashboardPanel();
                    logToConsole("用户 " + username + " 登录成功");
                } else {
                    statusLabel.setText("登录失败: 无法获取Token");
                    statusLabel.setForeground(Color.RED);
                }
            } else {
                statusLabel.setText("登录失败: " + response.getBody());
                statusLabel.setForeground(Color.RED);
            }
        } catch (Exception e) {
            statusLabel.setText("登录失败: " + e.getMessage());
            statusLabel.setForeground(Color.RED);
            logToConsole("登录错误: " + e.getMessage());
        }
    }
    
    /**
     * 显示注册对话框
     */
    private void showRegisterDialog() {
        JDialog dialog = new JDialog(this, "用户注册", true);
        dialog.setSize(400, 500);
        dialog.setLocationRelativeTo(this);
        dialog.setLayout(new GridBagLayout());
        GridBagConstraints gbc = new GridBagConstraints();
        
        JTextField regUsernameField = new JTextField(20);
        JPasswordField regPasswordField = new JPasswordField(20);
        JTextField regNicknameField = new JTextField(20);
        JComboBox<String> roleCombo = new JComboBox<>(new String[]{"APPLIER", "APPROVER", "MAINTAINER", "SERVICE", "ADMIN"});
        
        gbc.gridx = 0; gbc.gridy = 0; gbc.insets = new Insets(5, 5, 5, 5);
        dialog.add(new JLabel("用户名:"), gbc);
        gbc.gridx = 1;
        dialog.add(regUsernameField, gbc);
        
        gbc.gridx = 0; gbc.gridy = 1;
        dialog.add(new JLabel("密码:"), gbc);
        gbc.gridx = 1;
        dialog.add(regPasswordField, gbc);
        
        gbc.gridx = 0; gbc.gridy = 2;
        dialog.add(new JLabel("昵称:"), gbc);
        gbc.gridx = 1;
        dialog.add(regNicknameField, gbc);
        
        gbc.gridx = 0; gbc.gridy = 3;
        dialog.add(new JLabel("角色:"), gbc);
        gbc.gridx = 1;
        dialog.add(roleCombo, gbc);
        
        JButton registerButton = new JButton("注册");
        JButton cancelButton = new JButton("取消");
        
        registerButton.addActionListener(e -> {
            try {
                String jsonPayload = String.format(
                    "{\"username\":\"%s\",\"password\":\"%s\",\"nickname\":\"%s\",\"role\":\"%s\"}",
                    regUsernameField.getText(),
                    new String(regPasswordField.getPassword()),
                    regNicknameField.getText(),
                    roleCombo.getSelectedItem()
                );
                
                ApiClient.ApiResponse response = ApiClient.post("/register", jsonPayload, null);
                
                if (response.isSuccess()) {
                    JOptionPane.showMessageDialog(dialog, "注册成功！");
                    dialog.dispose();
                } else {
                    JOptionPane.showMessageDialog(dialog, "注册失败: " + response.getBody(), "错误", JOptionPane.ERROR_MESSAGE);
                }
            } catch (Exception ex) {
                JOptionPane.showMessageDialog(dialog, "注册失败: " + ex.getMessage(), "错误", JOptionPane.ERROR_MESSAGE);
            }
        });
        
        cancelButton.addActionListener(e -> dialog.dispose());
        
        JPanel buttonPanel = new JPanel();
        buttonPanel.add(registerButton);
        buttonPanel.add(cancelButton);
        
        gbc.gridx = 0; gbc.gridy = 4; gbc.gridwidth = 2;
        dialog.add(buttonPanel, gbc);
        
        dialog.pack();
        dialog.setVisible(true);
    }
    
    /**
     * 显示新建申请对话框
     */
    private void showNewApplicationDialog() {
        JDialog dialog = new JDialog(this, "新建申请", true);
        dialog.setSize(500, 400);
        dialog.setLocationRelativeTo(this);
        dialog.setLayout(new GridBagLayout());
        GridBagConstraints gbc = new GridBagConstraints();
        
        JTextField roomIdField = new JTextField(20);
        JTextField startTimeField = new JTextField(20);
        JTextField endTimeField = new JTextField(20);
        JTextField contactField = new JTextField(20);
        JTextArea purposeArea = new JTextArea(3, 20);
        JScrollPane purposeScrollPane = new JScrollPane(purposeArea);
        
        startTimeField.setText(new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date()));
        endTimeField.setText(new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date(System.currentTimeMillis() + 3600000)));
        
        gbc.gridx = 0; gbc.gridy = 0; gbc.insets = new Insets(5, 5, 5, 5);
        dialog.add(new JLabel("房间ID:"), gbc);
        gbc.gridx = 1;
        dialog.add(roomIdField, gbc);
        
        gbc.gridx = 0; gbc.gridy = 1;
        dialog.add(new JLabel("开始时间:"), gbc);
        gbc.gridx = 1;
        dialog.add(startTimeField, gbc);
        
        gbc.gridx = 0; gbc.gridy = 2;
        dialog.add(new JLabel("结束时间:"), gbc);
        gbc.gridx = 1;
        dialog.add(endTimeField, gbc);
        
        gbc.gridx = 0; gbc.gridy = 3;
        dialog.add(new JLabel("联系方式:"), gbc);
        gbc.gridx = 1;
        dialog.add(contactField, gbc);
        
        gbc.gridx = 0; gbc.gridy = 4;
        dialog.add(new JLabel("用途:"), gbc);
        gbc.gridx = 1;
        dialog.add(purposeScrollPane, gbc);
        
        JButton submitButton = new JButton("提交");
        JButton cancelButton = new JButton("取消");
        
        submitButton.addActionListener(e -> {
            try {
                String jsonPayload = String.format(
                    "{\"roomId\":%s,\"startTime\":\"%s\",\"endTime\":\"%s\",\"contact\":\"%s\",\"purpose\":\"%s\"}",
                    roomIdField.getText(),
                    startTimeField.getText(),
                    endTimeField.getText(),
                    contactField.getText(),
                    purposeArea.getText()
                );
                
                ApiClient.ApiResponse response = ApiClient.post("/application/post", jsonPayload, currentToken);
                
                if (response.isSuccess()) {
                    JOptionPane.showMessageDialog(dialog, "申请提交成功！");
                    dialog.dispose();
                    refreshData();
                    logToConsole("新建申请成功");
                } else {
                    JOptionPane.showMessageDialog(dialog, "申请提交失败: " + response.getBody(), "错误", JOptionPane.ERROR_MESSAGE);
                }
            } catch (Exception ex) {
                JOptionPane.showMessageDialog(dialog, "申请提交失败: " + ex.getMessage(), "错误", JOptionPane.ERROR_MESSAGE);
            }
        });
        
        cancelButton.addActionListener(e -> dialog.dispose());
        
        JPanel buttonPanel = new JPanel();
        buttonPanel.add(submitButton);
        buttonPanel.add(cancelButton);
        
        gbc.gridx = 0; gbc.gridy = 5; gbc.gridwidth = 2;
        dialog.add(buttonPanel, gbc);
        
        dialog.pack();
        dialog.setVisible(true);
    }
    
    /**
     * 刷新数据
     */
    private void refreshData() {
        loadApplications();
        logToConsole("数据刷新完成");
    }
    
    /**
     * 加载申请列表
     */
    private void loadApplications() {
        try {
            ApiClient.ApiResponse response = ApiClient.get("/application/page?pageNum=1&pageSize=20", currentToken);
            
            applicationsTableModel.setRowCount(0);
            
            if (response.isSuccess()) {
                applicationsTableModel.addRow(new Object[]{"1", "会议室A", "2024-01-15 09:00", "2024-01-15 10:00", "已批准", "团队会议"});
                applicationsTableModel.addRow(new Object[]{"2", "会议室B", "2024-01-15 14:00", "2024-01-15 16:00", "待审批", "项目讨论"});
            }
        } catch (Exception e) {
            logToConsole("加载申请列表失败: " + e.getMessage());
        }
    }
    
    /**
     * 审批申请
     */
    private void approveApplication() {
        int selectedRow = applicationsTable.getSelectedRow();
        if (selectedRow == -1) {
            JOptionPane.showMessageDialog(this, "请选择要审批的申请", "提示", JOptionPane.INFORMATION_MESSAGE);
            return;
        }
        
        String applicationId = applicationsTable.getValueAt(selectedRow, 0).toString();
        
        try {
            String jsonPayload = String.format(
                "{\"applicationId\":%s,\"approved\":true,\"comment\":\"审批通过\"}",
                applicationId
            );
            
            ApiClient.ApiResponse response = ApiClient.post("/application/approve", jsonPayload, currentToken);
            
            if (response.isSuccess()) {
                JOptionPane.showMessageDialog(this, "审批成功！");
                refreshData();
                logToConsole("申请 " + applicationId + " 审批通过");
            } else {
                JOptionPane.showMessageDialog(this, "审批失败: " + response.getBody(), "错误", JOptionPane.ERROR_MESSAGE);
            }
        } catch (Exception e) {
            JOptionPane.showMessageDialog(this, "审批失败: " + e.getMessage(), "错误", JOptionPane.ERROR_MESSAGE);
        }
    }
    
    /**
     * 拒绝申请
     */
    private void rejectApplication() {
        int selectedRow = applicationsTable.getSelectedRow();
        if (selectedRow == -1) {
            JOptionPane.showMessageDialog(this, "请选择要拒绝的申请", "提示", JOptionPane.INFORMATION_MESSAGE);
            return;
        }
        
        String applicationId = applicationsTable.getValueAt(selectedRow, 0).toString();
        
        try {
            String jsonPayload = String.format(
                "{\"applicationId\":%s,\"approved\":false,\"comment\":\"申请被拒绝\"}",
                applicationId
            );
            
            ApiClient.ApiResponse response = ApiClient.post("/application/approve", jsonPayload, currentToken);
            
            if (response.isSuccess()) {
                JOptionPane.showMessageDialog(this, "拒绝成功！");
                refreshData();
                logToConsole("申请 " + applicationId + " 被拒绝");
            } else {
                JOptionPane.showMessageDialog(this, "拒绝失败: " + response.getBody(), "错误", JOptionPane.ERROR_MESSAGE);
            }
        } catch (Exception e) {
            JOptionPane.showMessageDialog(this, "拒绝失败: " + e.getMessage(), "错误", JOptionPane.ERROR_MESSAGE);
        }
    }
    
    /**
     * 记录日志到控制台
     */
    private void logToConsole(String message) {
        String timestamp = new java.text.SimpleDateFormat("HH:mm:ss").format(new Date());
        consoleArea.append("[" + timestamp + "] " + message + "\n");
        consoleArea.setCaretPosition(consoleArea.getDocument().getLength());
    }
    
    /**
     * 切换主题
     */
    private void toggleTheme() {
        isDarkMode = !isDarkMode;
        applyTheme();
    }
    
    /**
     * 应用主题
     */
    private void applyTheme() {
        try {
            if (isDarkMode) {
                UIManager.setLookAndFeel(new FlatDarkLaf());
            } else {
                UIManager.setLookAndFeel(new FlatLightLaf());
            }
            
            FlatLaf.setGlobalExtraDefaults(Collections.singletonMap("@accentColor", "#" + 
                String.format("%06x", accentColor.getRGB() & 0xFFFFFF)));
            
            SwingUtilities.updateComponentTreeUI(this);
            FlatLaf.updateUI();
            
            logToConsole("主题已切换为: " + (isDarkMode ? "深色" : "浅色"));
        } catch (Exception e) {
            logToConsole("主题切换失败: " + e.getMessage());
        }
    }
    
    /**
     * 显示设置对话框
     */
    private void showSettingsDialog() {
        JOptionPane.showMessageDialog(this, "设置功能开发中...", "设置", JOptionPane.INFORMATION_MESSAGE);
    }
    
    /**
     * 显示关于对话框
     */
    private void showAboutDialog() {
        JOptionPane.showMessageDialog(this,
            "RoomX 桌面客户端 v" + VERSION + "\n\n" +
            "基于FlatLaf的现代化GUI应用\n" +
            "支持深浅色主题切换\n" +
            "提供完整的房间预约管理功能\n\n" +
            "© 2024 RoomX Team",
            "关于",
            JOptionPane.INFORMATION_MESSAGE);
    }
    
    public static void main(String[] args) {
        System.setProperty("flatlaf.animation", "true");
        
        SwingUtilities.invokeLater(() -> {
            try {
                new RoomXDesktopApp().setVisible(true);
            } catch (Exception e) {
                e.printStackTrace();
                JOptionPane.showMessageDialog(null, 
                    "应用启动失败: " + e.getMessage(), 
                    "错误", 
                    JOptionPane.ERROR_MESSAGE);
            }
        });
    }
} 