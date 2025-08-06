import com.formdev.flatlaf.FlatLaf;

import javax.swing.Timer;
import javax.swing.*;
import javax.swing.border.LineBorder;
import javax.swing.event.DocumentEvent;
import javax.swing.event.DocumentListener;
import java.awt.*;
import java.awt.event.*;
import java.io.OutputStream;
import java.net.MalformedURLException;
import java.rmi.Naming;
import java.rmi.NotBoundException;
import java.rmi.RemoteException;
import java.text.MessageFormat;
import java.time.LocalDate;
import java.util.List;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public abstract class ClientFrame extends JFrame implements Command,settable{
    protected final ResourceBundle bundle;
    protected final JMenuBar menu=new JMenuBar();
    protected final JTextField idTextField=new JTextField();
    protected final JPasswordField passwordField=new JPasswordField();
    protected final JTextField commandInputBox;
    protected final JTextArea Messenger=new JTextArea("");
    protected final JTextArea Console=new JTextArea("");
    protected final JTextArea Notification=new JTextArea("");
    protected final JPanel commandPanel=new JPanel(new BorderLayout(5,5));
    protected final JPanel actionPanel=new JPanel(new BorderLayout());
    protected final JPanel buttonPanel=new JPanel(new GridLayout(1,3));
    protected final JPanel idPanel =new JPanel(new FlowLayout(FlowLayout.RIGHT));
    protected final JPanel passwordPanel=new JPanel(new FlowLayout(FlowLayout.RIGHT));
    protected final JPanel inputButtonPanel=new JPanel(new FlowLayout(FlowLayout.CENTER));
    protected final JPanel inputPanel=new JPanel(new GridBagLayout());
    protected final JPanel inputArea=new JPanel();
    protected final JPanel accountPanel=new JPanel(new FlowLayout());
    protected final JPanel ChooseARoom=new JPanel();
    protected final JPanel RoomNameL=new JPanel();
    protected final JPanel Actions=new JPanel();
    protected final JPanel ItPane=new JPanel(new BorderLayout());
    protected final JPanel OpPane=new JPanel(new BorderLayout());
    protected final JPanel TextPane=new JPanel();
    protected final JPanel InfoPane=new JPanel();
    protected final JScrollPane scrollPane =new JScrollPane(Console);
    protected final JButton registerButton;
    protected final JButton DisconnectButton;
    protected final JButton clearButton;
    protected final JButton scanButton;
    protected final JButton settingButton;
    protected final JButton AppTitle=new JButton("RoomX");
    protected final JLabel selected;
    protected final JLabel idLabel;
    protected final JLabel passwordLabel;
    protected final JLabel idLabelIn;
    protected final JLabel RoomLoc;
    protected final JComboBox<Integer> roomList=new JComboBox<>();
    protected final JMenu MFile;
    protected final JMenu MAccount;
    protected final JMenu MView;
    protected final JMenu MHelp;
    protected final ButtonListPanel OverallInfo;
    protected final ButtonListPanel FilteredInfo;

    protected final String version=properties.version;

    protected final Color commandFore=PresColor.GREEN.value();
    protected final Color commandBack=this.getBackground();

    protected final int[] ID={-1};
    protected final int[] count={0};//死去的变量突然攻击我

    protected final JFrame ActionFrame=new JFrame();

    private final settingFrame settings =new settingFrame(this);
    protected String loc;

    ClientFrame(){
        UIManager.put( "TextComponent.arc", 5 );
        System.setProperty( "flatlaf.animation", "true" );
        setLocale(settings.setting.getSetting("locale","default"));
        try{paintTheme();} catch (Exception ignored){}
        loc=settings.setting.getSetting("loc","127.0.0.1:1099");
        menu.setVisible(false);

        bundle = ResourceBundle.getBundle("sysmsg",getLocale());

        count[0]=0;
        LocalDate today=LocalDate.now();
        if(today.getMonthValue()==4&&today.getDayOfMonth()==26) count[0]=9999;
        setLayout(new BorderLayout());
        UIManager.put( "Component.focusWidth", 0 );
        UIManager.put( "ScrollBar.thumbArc", 999 );
        UIManager.put( "ScrollBar.thumbInsets", new Insets( 2, 2, 2, 2 ) );

        // Size of the form
        setSize(960, 540);
        setMinimumSize(new Dimension(960,540));
        this.setLocationRelativeTo(null);

        // Action Panel
        actionPanel.setVisible(false);

        ChooseARoom.setLayout(new FlowLayout(FlowLayout.CENTER));
        actionPanel.add(ChooseARoom,BorderLayout.NORTH);
        RoomLoc = new JLabel("  "+bundle.getString("roomLocTip"));
        RoomLoc.setFont(PresFont.fntDisplay);
        ChooseARoom.add(RoomLoc);

        RoomNameL.setLayout(new FlowLayout(FlowLayout.CENTER));
        actionPanel.add(RoomNameL,BorderLayout.CENTER);

        Actions.setLayout(new FlowLayout());
        actionPanel.add(Actions,BorderLayout.SOUTH);

        // RoomList ComboBox Paint
        ChooseARoom.add(roomList);
        roomList.setEnabled(true);
        roomList.setFont(PresFont.fntText);
        roomList.setVisible(true);

        /// File Menu
        MFile = new JMenu(bundle.getString("fileMenu"));
        MFile.setMnemonic(KeyEvent.VK_F);//设置快速访问符
        JMenuItem item;

        // Settings
        item=new JMenuItem(bundle.getString("settingsMenu"),KeyEvent.VK_S);
        item.setAccelerator(KeyStroke.getKeyStroke(KeyEvent.VK_S,InputEvent.ALT_DOWN_MASK));
        item.addActionListener(e->Load("general"));
        MFile.add(item);

        MFile.addSeparator();// Separator---------------------------------------------

        // Exit
        item=new JMenuItem(bundle.getString("exitMenu"),KeyEvent.VK_E);
        item.setAccelerator(KeyStroke.getKeyStroke(KeyEvent.VK_F4,InputEvent.ALT_DOWN_MASK));
        item.addActionListener(e->dispose());
        MFile.add(item);

        menu.add(MFile);
        /// End File Menu

        /// Account Menu
        MAccount = new JMenu(bundle.getString("accountMenu"));
        MAccount.setMnemonic(KeyEvent.VK_A);

        // Account Settings
        item=new JMenuItem(bundle.getString("accountSettingsMenu"),KeyEvent.VK_S);
        item.addActionListener(e->Load("account"));
        MAccount.add(item);
        MAccount.addSeparator();// Separator---------------------------------------------
        // Disconnect
        item=new JMenuItem(bundle.getString("disconnectMenu"),KeyEvent.VK_D);
        JMenuItem finalItem1 = item;
        item.addActionListener(e->{
            if(ID[0]>0) clientDisconnect(true);
        });
        MAccount.add(item);


        menu.add(MAccount);
        /// End Account Menu


        /// View Menu
        MView = new JMenu(bundle.getString("viewMenu"));
        MView.setMnemonic(KeyEvent.VK_V);
        // Show/Hide Command
        item=new JMenuItem(bundle.getString(commandPanel.isVisible()?"hideCommandMenu":"showCommandMenu"),KeyEvent.VK_C);
        item.setAccelerator(KeyStroke.getKeyStroke(KeyEvent.VK_C, InputEvent.ALT_DOWN_MASK));
        JMenuItem finalItem2 = item;
        item.addActionListener(e->{
            commandPanel.setVisible(!commandPanel.isVisible());
            finalItem2.setText(bundle.getString(commandPanel.isVisible()?"hideCommandMenu":"showCommandMenu"));
        });
        MView.add(item);

        /* Light/Dark Mode
        item=new JMenuItem("<html><body>Light/Dark <u>M</u>ode</body></html>",KeyEvent.VK_M);
        item.addActionListener(e->switchLD());
        MView.add(item);*/
        menu.add(MView);
        /// End View Menu

        /// Help Menu
        MHelp = new JMenu(bundle.getString("helpMenu"));
        MHelp.setMnemonic(KeyEvent.VK_H);

        // Command Help
        item=new JMenuItem(bundle.getString("commandHelpMenu"),KeyEvent.VK_C);
        item.setAccelerator(KeyStroke.getKeyStroke(KeyEvent.VK_M, InputEvent.ALT_DOWN_MASK));
        item.addActionListener(e->{
            commandPanel.setVisible(true);
            finalItem2.setText(bundle.getString(commandPanel.isVisible()?"hideCommandMenu":"showCommandMenu"));
            help();
        });
        MHelp.add(item);

        MHelp.addSeparator();// Separator---------------------------------------------

        // About
        item=new JMenuItem(bundle.getString("aboutMenu"),KeyEvent.VK_A);
        item.setAccelerator(KeyStroke.getKeyStroke(KeyEvent.VK_A,InputEvent.ALT_DOWN_MASK));
        item.addActionListener(e->about(false));
        MHelp.add(item);

        menu.add(MHelp);
        /// End Help Menu

        setJMenuBar(menu);

        // Selected Label
        selected = new JLabel(bundle.getString("NA"));
        selected.setFont(PresFont.fntText);
        RoomNameL.add(selected);
        selected.setVisible(true);


        // Input Panel & Account Panel
        BoxLayout layoutI=new BoxLayout(inputArea,BoxLayout.Y_AXIS);
        inputArea.setLayout(layoutI);

        idPanel.setAlignmentX(Component.CENTER_ALIGNMENT);
        idPanel.setAlignmentY(Component.CENTER_ALIGNMENT);
        idLabel = new JLabel(bundle.getString("idTip"));
        idPanel.add(idLabel);
        idLabelIn = new JLabel(bundle.getString("greeting"));
        accountPanel.add(idLabelIn);
        idLabel.setFont(PresFont.fnt);
        idLabelIn.setFont(PresFont.fntDisplay);

        idPanel.add(idTextField);
        idTextField.setFont(PresFont.fntText);

        passwordPanel.setAlignmentX(Component.CENTER_ALIGNMENT);
        passwordPanel.setAlignmentY(Component.CENTER_ALIGNMENT);
        passwordLabel = new JLabel(bundle.getString("passwordTip"));
        passwordPanel.add(passwordLabel);
        passwordLabel.setFont(PresFont.fnt);
        passwordPanel.add(passwordField);
        idTextField.setPreferredSize(new Dimension(250,20));
        passwordField.setPreferredSize(new Dimension(250,20));
        passwordField.setFont(PresFont.password);

        AppTitle.setFont(PresFont.fntTitle);
        AppTitle.setBorder(new LineBorder(PresColor.NULL.value(),0));
        AppTitle.setBackground(PresColor.NULL.value());
        AppTitle.setAlignmentX(Component.CENTER_ALIGNMENT);
        commandInputBox = new JTextField(bundle.getString("inputCommands"));
        AppTitle.addActionListener(e->{
            count[0]++;
            if(count[0]>10&&count[0]<(today.getYear()-1911))commandInputBox.setText(String.valueOf(count[0]));
            if(count[0]==(today.getYear()-1911)){
                AppTitle.setForeground(PresColor.PURPLE.value());
                commandInputBox.setText(String.valueOf(count[0]));
                commandInputBox.setForeground(PresColor.PURPLE.value());
            }
        });

        GridBagConstraints gbc=new GridBagConstraints();
        gbc.gridx = 0;
        gbc.gridy = 0;
        gbc.weightx = 1.0;
        gbc.weighty = 1.0;
        gbc.anchor = GridBagConstraints.CENTER;
        gbc.fill = GridBagConstraints.NONE;

        inputPanel.add(inputArea,gbc);
        inputArea.add(AppTitle);
        inputArea.add(idPanel);
        inputArea.add(passwordPanel);

        // Register Button Paint
        registerButton = new JButton(bundle.getString("register"));
        registerButton.setFont(PresFont.fntBld);
        registerButton.setAlignmentX(Component.CENTER_ALIGNMENT);
        inputButtonPanel.add(registerButton);

        // Setting Button
        settingButton = new JButton(bundle.getString("settings"));
        settingButton.setFont(PresFont.fnt);
        settingButton.setAlignmentX(Component.CENTER_ALIGNMENT);
        settingButton.addActionListener(e->Load("general"));
        inputButtonPanel.add(settingButton);
        inputArea.add(inputButtonPanel);

        // Disconnect Button Paint
        DisconnectButton = new JButton(bundle.getString("disconnect"));
        DisconnectButton.setFont(PresFont.fntBld);
        accountPanel.add(DisconnectButton);

        //Interface Panel Layout
        OpPane.add(ItPane,BorderLayout.NORTH);// Action Panel
        ItPane.add(actionPanel,BorderLayout.CENTER);
        ItPane.add(buttonPanel,BorderLayout.SOUTH);
        ItPane.add(accountPanel, BorderLayout.NORTH);

        // TextArea at the Center
        add(inputPanel, BorderLayout.CENTER);
        TextPane.setVisible(false);
        idPanel.setVisible(true);
        TextPane.setLayout(new GridLayout(1,2));
        TextPane.add(OpPane);
        InfoPane.setLayout(new GridLayout(3,1));
        TextPane.add(InfoPane);

        //Console
        Console.setEditable(false); //Readonly
        scrollPane.setOpaque(true);
        scrollPane.getHorizontalScrollBar().setBackground(Console.getBackground());
        scrollPane.getHorizontalScrollBar().setForeground(new Color(0x555555));
        scrollPane.getVerticalScrollBar().setBackground(Console.getBackground());
        scrollPane.getVerticalScrollBar().setForeground(new Color(0x555555));
        OpPane.add(scrollPane,BorderLayout.CENTER);
        Console.setFont(PresFont.fntCons);
        Console.setBackground(PresColor.DARK.value());
        Console.setForeground(PresColor.LIGHT.value());
        Console.setVisible(true);

        // Overall Info & Filtered Info
        OverallInfo = new ButtonListPanel(bundle.getString("overall"),Selection.UNIQUE);
        InfoPane.add(OverallInfo);
        FilteredInfo = new ButtonListPanel(bundle.getString("filtered"),Selection.UNIQUE);
        InfoPane.add(FilteredInfo);

        roomList.addItemListener(e->{
            if(roomList.getSelectedItem()!=null) {
                OverallInfo.uniqueSelect((Integer) roomList.getSelectedItem());
                FilteredInfo.uniqueSelect((Integer) roomList.getSelectedItem());
            }
        });

        // Notification Center
        Notification.setEditable(false); //Readonly
        JScrollPane scrollPane3 =new JScrollPane(Notification);
        InfoPane.add(scrollPane3);
        Notification.setFont(PresFont.fntText);
        Notification.setVisible(true);
        TextPane.add(InfoPane);

        // Message
        Messenger.setEditable(true); // Readonly
        Messenger.getDocument().addDocumentListener(new DocumentListener() {
            @Override
            public void insertUpdate(DocumentEvent e) {
                SwingUtilities.invokeLater(() -> {
                    if(!Messenger.getText().isEmpty())Console.append(Messenger.getText()+"\n");
                    Notification.append(Messenger.getText());
                    Messenger.setText("");
                });
            }

            @Override
            public void removeUpdate(DocumentEvent e) {

            }

            @Override
            public void changedUpdate(DocumentEvent e) {

            }
        });


        // Clear Button
        clearButton = new JButton(bundle.getString("clearCons"));
        clearButton.setFont(PresFont.fntBld);
        clearButton.addActionListener(e -> {
            ConfirmDialog c=new ConfirmDialog(bundle.getString("clearConfirm"),400,100);
            c.setVisible(true);
            if(!c.isOK())return;
            Console.setText(""); // Clear
        });

        // Scan Button
        scanButton = new JButton(bundle.getString("scan"));
        scanButton.setFont(PresFont.fntBld);
        scanButton.addActionListener(e -> {
            Notification.setText("");
            try {
                scanning("NoMessage");
            } catch (MalformedURLException | RemoteException | NotBoundException ex) {
                throw new RuntimeException(ex);
            }
        });

        // Command Panel
        add(commandPanel, BorderLayout.SOUTH);
        commandPanel.setVisible(true);

        JPanel gap1=new JPanel();
        commandPanel.add(gap1,BorderLayout.WEST);
        gap1.setBackground(commandBack);
        JPanel goPane=new JPanel(new BorderLayout());
        commandPanel.add(goPane,BorderLayout.EAST);
        goPane.setBackground(commandBack);
        goPane.setMinimumSize(new Dimension(20,0));

        commandPanel.setBackground(commandBack);
        commandInputBox.setFont(PresFont.fntConsL);
        commandInputBox.setForeground(PresColor.GREY.value());
        commandInputBox.setBackground(commandBack);
        commandInputBox.setBorder(BorderFactory.createLineBorder(Color.BLACK,0));
        commandInputBox.setMinimumSize(new Dimension(0,50));
        commandInputBox.addKeyListener(new KeyAdapter() {
            @Override
            public void keyTyped(KeyEvent e) {
                super.keyTyped(e);
                if (e.getKeyChar() == KeyEvent.VK_ENTER) {
                    if(commandInputBox.getForeground()==commandFore||commandInputBox.getForeground()==PresColor.PINK.value()){
                        Console.append("\n>> "+commandInputBox.getText()+"\n");
                        conduct(commandInputBox.getText());
                        commandInputBox.setText("");
                    }
                }
            }

            @Override
            public void keyPressed(KeyEvent e) {
                super.keyPressed(e);
            }

            @Override
            public void keyReleased(KeyEvent e) {
                super.keyReleased(e);
            }
        });
        commandInputBox.getDocument().addDocumentListener(new DocumentListener() {
            @Override
            public void insertUpdate(DocumentEvent e) {
                if(commandInputBox.getText().contains("love"))commandInputBox.setForeground(PresColor.PINK.value());
                else{
                    if(commandInputBox.getText().equals(bundle.getString("inputCommands")))return;
                    if(!conductible(commandInputBox.getText()))commandInputBox.setForeground(PresColor.RED.value());
                    else commandInputBox.setForeground(commandFore);
                }
            }

            @Override
            public void removeUpdate(DocumentEvent e) {
                if(commandInputBox.getText().contains("love"))commandInputBox.setForeground(PresColor.PINK.value());
                else{
                    if(commandInputBox.getText().equals(bundle.getString("inputCommands")))return;
                    if(!conductible(commandInputBox.getText()))commandInputBox.setForeground(PresColor.RED.value());
                    else commandInputBox.setForeground(commandFore);
                }
            }

            @Override
            public void changedUpdate(DocumentEvent e) {
                if(commandInputBox.getText().contains("love"))commandInputBox.setForeground(PresColor.PINK.value());
                else{
                    if(commandInputBox.getText().equals(bundle.getString("inputCommands")))return;
                    if(!conductible(commandInputBox.getText()))commandInputBox.setForeground(PresColor.RED.value());
                    else commandInputBox.setForeground(commandFore);
                }

            }
        });
        commandPanel.add(commandInputBox,BorderLayout.CENTER);
        commandInputBox.setPreferredSize(new Dimension(0,32));
        commandInputBox.addFocusListener(new FocusAdapter() {
            final String hintText=bundle.getString("inputCommands");
            @Override
            public void focusLost(FocusEvent e) {
                super.focusLost(e);
                String temp = commandInputBox.getText();
                if(temp.isBlank()) {
                    commandInputBox.setForeground(PresColor.GREY.value());
                    commandInputBox.setText(hintText);
                }
            }

            @Override
            public void focusGained(FocusEvent e) {
                super.focusGained(e);
                String temp = commandInputBox.getText();
                if (temp.equals(hintText)&&commandInputBox.getForeground().equals(PresColor.GREY.value())) {
                    commandInputBox.setText("");
                    commandInputBox.setForeground(commandFore);
                }
            }
        });

    }

    protected abstract void help();
    protected abstract void about(boolean love);
    protected abstract void scanning(String Message)throws MalformedURLException, NotBoundException, RemoteException;
    protected abstract void clientRegister();
    protected abstract void clientDisconnect(boolean NeedConfirm);
    protected void switchLD() {
        try {
            LightDarkMode.switchMode();
            paintTheme();
        } catch (UnsupportedLookAndFeelException ex) {
            System.out.println(bundle.getString("switchLDFail"));
        } catch (MalformedURLException | NotBoundException | RemoteException ignored) {
        }
    }

    public Color getAccent(){
        return settings.getAccent();
    }

    protected void paintTheme() throws UnsupportedLookAndFeelException, MalformedURLException, NotBoundException, RemoteException {
        setLightDarkMode();
        FlatLaf.setGlobalExtraDefaults( Collections.singletonMap( "@accentColor", "#"+ColorDecode.toRRGGBB(getAccent())));
        scrollPane.getHorizontalScrollBar().setBackground(Console.getBackground());
        scrollPane.getVerticalScrollBar().setBackground(Console.getBackground());
        scrollPane.putClientProperty("ScrollBar.thumb",new Color(0x555555));
        SwingUtilities.updateComponentTreeUI(this);
        SwingUtilities.updateComponentTreeUI(settingFrame.getFrames()[0]);
        FlatLaf.updateUI();
        if (commandInputBox != null) {
            commandInputBox.setBackground(this.getBackground());
        }
        if(ID[0]>0) scanning("NoMessage");
    }

    protected static void setLightDarkMode() throws UnsupportedLookAndFeelException {
        UIManager.getLookAndFeelDefaults().clear();
        UIManager.setLookAndFeel(LightDarkMode.isDark()?new FlatDarkerLaf():new FlatLighterLaf());
        UIManager.put( "Component.focusWidth", 0 );
        UIManager.put( "ScrollBar.thumbArc", 999 );
        UIManager.put( "ScrollBar.thumbInsets", new Insets( 2, 2, 2, 2 ) );
    }

    // Customize OutputStream, let "print" family print to "JTextArea"
    protected static class JTextAreaOutputStream extends OutputStream {
        private final JTextArea textArea;

        public JTextAreaOutputStream(JTextArea textArea) {
            this.textArea = textArea;
        }

        @Override
        public void write(int b) {
            // Convert to char to print to "JTextArea"
            textArea.append(String.valueOf((char) b));
        }

        @Override
        public void write(byte[] b, int off, int len) {
            // append the String to "JTextArea"
            textArea.append(new String(b, off, len));
        }


    }
    @Override
    public void setLocale(String locale) {
        if(Objects.equals(locale, "default")) {
        setLocale(Locale.getDefault());
    }
    else  {
        setLocale(Locale.forLanguageTag(locale));
    }
    }
    @Override
    public int getID(){
        return ID[0];
    }
    @Override
    public void discFromSet(){
        clientDisconnect(true);
    }
    // Apply
    @Override
    public void Apply(){
        loc=settings.setting.getSetting("loc","127.0.0.1:1099");
        try {
            paintTheme();
            if(!settings.locT.getText().equals(settings.locForRestore)&&ID[0]>0) clientDisconnect(false);
        }
        catch (Exception ignored){}
    }
    @Override
    public void Load(String Home){
        settings.setVisible(true);
        settings.Load(Home);
        SwingUtilities.updateComponentTreeUI(settings);
    }
}
class settingFrame extends JFrame implements settable{
    private final settable Parent;
    final ResourceBundle bundle;
    private final GridBagLayout layout=new GridBagLayout();
    final JPanel container=new JPanel(layout);
    final JPanel buttonPanel=new JPanel(new FlowLayout(FlowLayout.RIGHT));
    final JPanel colorPanel=new JPanel(new FlowLayout(FlowLayout.LEFT));
    final JScrollPane settingPanel;
    final JButton OKButton;
    final JButton CancelButton;
    final JButton ApplyButton;
    final JButton RestoreLocButton;
    final JButton sDiscButton;
    final JButton changePass;
    final JList<String> options;
    final List<JPanel> panels=new ArrayList<>();
    final List<String> panelName=new ArrayList<>(List.of(new String[]{"general", "appearance", "account","snake"}));
    final List<String> localeName=new ArrayList<>(List.of(new String[]{"default", "zh-CN", "en-US"}));
    final JSONSettingsManager setting=new JSONSettingsManager();
    final JLabel info;
    final JLabel selectedColor;
    final JLabel localeChangeTip=new JLabel();
    final JCheckBox SavePass;

    String locForRestore;
    Color accent;
    final JComboBox<String> themeSelector=new JComboBox<>();
    final JComboBox<String> localeSelector=new JComboBox<>();
    JTextField locT=new JTextField(16);
    final MetroListPanel colorSel=new MetroListPanel(25,Selection.UNIQUE);
    boolean defaultLocale;
    boolean localeChangeNotify=false;

    settingFrame(settable Parent){
        LightDarkMode.setDark(setting.getSetting("theme","light").equals("dark"));
        this.Parent = Parent;
        setLocale(setting.getSetting("locale","default"));
        bundle=ResourceBundle.getBundle("sysmsg",getLocale());
        setTitle(bundle.getString("settings"));
        setSize(640,400);
        setLayout(new BorderLayout());
        setMinimumSize(getSize());
        setMaximumSize(getSize());
        setLocationRelativeTo(null);
        options = new JList<>(new String[]{
                bundle.getString("general"),
                bundle.getString("appearance"),
                bundle.getString("account"),
                bundle.getString("snakeGame")});
        options.setFont(PresFont.fnt);
        options.setFixedCellHeight(30);
        options.setMinimumSize(new Dimension(120,150));
        options.setBackground(getBackground());

        add(container,BorderLayout.CENTER);
        add(buttonPanel,BorderLayout.SOUTH);

        OKButton = new JButton(bundle.getString("ok"));
        OKButton.setFont(PresFont.fntBld);
        CancelButton = new JButton(bundle.getString("cancel"));
        CancelButton.setFont(PresFont.fnt);
        ApplyButton = new JButton(bundle.getString("apply"));
        ApplyButton.setFont(PresFont.fnt);
        buttonPanel.add(OKButton);
        buttonPanel.add(CancelButton);
        buttonPanel.add(ApplyButton);

        JLabel title;

        // General Settings
        JPanel General=new JPanel(new BorderLayout(0,10));
        JPanel GeneralCont=new JPanel(null);
        General.add(GeneralCont,BorderLayout.CENTER);
        panels.addLast(General);
        settingPanel=new JScrollPane(General);



        title=new JLabel(bundle.getString("general"));
        title.setFont(PresFont.fntBld);
        title.setAlignmentX(Component.LEFT_ALIGNMENT);
        General.add(new JPanel(new FlowLayout(FlowLayout.LEFT)).add(title),BorderLayout.NORTH);

        JPanel localeP=new JPanel(new FlowLayout(FlowLayout.LEFT));
        JLabel localeTip=new JLabel(bundle.getString("localeTip"));
        localeChangeTip.setVisible(false);
        localeChangeTip.setText(bundle.getString("localeChangeMessage"));
        localeChangeTip.setForeground(PresColor.WARNING.value());
        localeChangeTip.setFont(PresFont.fntText);
        localeTip.setFont(PresFont.fntText);
        localeP.add(localeTip);
        localeP.add(localeSelector);

        localeSelector.setFont(PresFont.fntText);
        localeSelector.setToolTipText(bundle.getString("selectTheme"));
        localeSelector.addItem(bundle.getString("systemDefault"));
        localeSelector.addItem("简体中文");
        localeSelector.addItem("English (US)");
        localeSelector.addActionListener(e->{
            Change();
            if(!getLocale().toLanguageTag().equals(localeName.get(localeSelector.getSelectedIndex()))||(localeSelector.getSelectedIndex()!=0&&defaultLocale)){
                localeChangeNotify=true;
                localeChangeTip.setVisible(true);
                localeChangeTip.setForeground(PresColor.WARNING.value());
            }
            else {
                localeChangeNotify=false;
                localeChangeTip.setVisible(false);
            }
        });
        GeneralCont.add(localeP);
        GeneralCont.add(localeChangeTip);
        localeP.setBounds(5,5,300,35);
        localeChangeTip.setBounds(5,45,400,25);



        // Appearance Settings
        JPanel Appearance=new JPanel(new BorderLayout(0,10));
        JPanel AppearanceCont=new JPanel(null);
        Appearance.add(AppearanceCont,BorderLayout.CENTER);
        panels.addLast(Appearance);

        title=new JLabel(bundle.getString("appearance"));
        title.setFont(PresFont.fntBld);
        title.setAlignmentX(Component.LEFT_ALIGNMENT);
        Appearance.add(new JPanel(new FlowLayout(FlowLayout.LEFT)).add(title),BorderLayout.NORTH);

        JPanel themeP=new JPanel(new FlowLayout(FlowLayout.LEFT));
        JLabel themeTip=new JLabel(bundle.getString("themeTip"));
        themeTip.setFont(PresFont.fntText);
        themeP.add(themeTip);
        themeP.add(themeSelector);

        themeSelector.setFont(PresFont.fntText);
        themeSelector.setToolTipText(bundle.getString("selectTheme"));
        themeSelector.addItem(bundle.getString("light"));
        themeSelector.addItem(bundle.getString("dark"));
        themeSelector.addItem(bundle.getString("auto")+"("+bundle.getString("comingSoon")+")");
        themeSelector.addActionListener(e->Change());
        AppearanceCont.add(themeP);
        themeP.setBounds(5,5,300,35);

        JLabel colorTip=new JLabel(bundle.getString("chooseColor")+":");
        colorTip.setFont(PresFont.fntText);
        AppearanceCont.add(colorTip);
        colorTip.setBounds(5,45,150,25);

        selectedColor = new JLabel(bundle.getString("nullS"));
        selectedColor.setFont(PresFont.fntText);
        selectedColor.setAlignmentX(Component.RIGHT_ALIGNMENT);
        AppearanceCont.add(selectedColor);
        selectedColor.setBounds(155,45,245,25);

        colorSel.add(1,"","",e->{
            accent=PresColor.RED.value();
            selectedColor.setText(bundle.getString("red"));
            selectedColor.setForeground(accent);
            Change();
            },PresColor.RED.value());
        colorSel.add(2,"","",e->{
            accent=PresColor.ORANGE.value();
            selectedColor.setText(bundle.getString("orange"));
            selectedColor.setForeground(accent);
            Change();
        },PresColor.ORANGE.value());
        colorSel.add(3,"","",e->{
            accent=PresColor.YELLOW.value();
            selectedColor.setText(bundle.getString("yellow"));
            selectedColor.setForeground(accent);
            Change();
        },PresColor.YELLOW.value());
        colorSel.add(4,"","",e-> {
            accent = PresColor.GREEN.value();
            selectedColor.setText(bundle.getString("green"));
            selectedColor.setForeground(accent);
            Change();
        },PresColor.GREEN.value());
        colorSel.add(5,"","",e-> {
            accent = PresColor.BLUE.value();
            selectedColor.setText(bundle.getString("blue"));
            selectedColor.setForeground(accent);
            Change();
        },PresColor.BLUE.value());
        colorSel.add(6,"","",e-> {
            accent = PresColor.PURPLE.value();
            selectedColor.setText(bundle.getString("purple"));
            selectedColor.setForeground(accent);
            Change();
        },PresColor.PURPLE.value());
        colorSel.add(7,"","",e-> {
            accent = PresColor.ROSE.value();
            selectedColor.setText(bundle.getString("rose"));
            selectedColor.setForeground(accent);
            Change();
        },PresColor.ROSE.value());
        colorSel.add(8,"","",e-> {
            accent = PresColor.PINK.value();
            selectedColor.setText(bundle.getString("pink"));
            selectedColor.setForeground(accent);
            Change();
        },PresColor.PINK.value());
        colorSel.add(9,"","",e-> {
            accent = PresColor.GREY.value();
            selectedColor.setText(bundle.getString("grey"));
            selectedColor.setForeground(accent);
            Change();
        },PresColor.GREY.value());
        colorSel.add(10,"","\uF53F",e-> {
            accent= Objects.requireNonNull(JColorChooser.showDialog(this, bundle.getString("chooseColor")+"...", accent));
            selectedColor.setText(bundle.getString("custom")+" (0x"+Integer.toHexString(accent.getRGB())+")");
            selectedColor.setForeground(accent);
            Change();
        },PresColor.NULL.value());
        colorSel.add(11,"","\uF715",e-> {
            accent=PresColor.FORE.value();
            selectedColor.setText(bundle.getString("nullS"));
            selectedColor.setForeground(accent);
            Change();
        },PresColor.NULL.value());

        AppearanceCont.add(colorSel);
        colorSel.setBounds(5,75,400,40);

        JPanel Account=new JPanel(new BorderLayout(0,10));
        JPanel AccountCont=new JPanel(null);
        Account.add(AccountCont,BorderLayout.CENTER);
        panels.addLast(Account);
        JPanel locP=new JPanel(new FlowLayout(FlowLayout.LEFT));
        JLabel locTip=new JLabel(bundle.getString("serverLocTip"));
        locTip.setFont(PresFont.fntText);
        JLabel invalidTip=new JLabel(bundle.getString("invalidLocTip"));
        invalidTip.setFont(PresFont.fntText);
        invalidTip.setForeground(PresColor.WARNING.value());
        invalidTip.setVisible(false);
        locP.add(locTip);
        locP.add(locT);
        locP.add(invalidTip);
        RestoreLocButton = new JButton(bundle.getString("restore"));
        locP.add(RestoreLocButton);

        locT.setFont(PresFont.fntText);
        locT.setToolTipText(bundle.getString("serverLocToolTip"));
        locT.addActionListener(e->Change());
        locT.getDocument().addDocumentListener(new DocumentListener() {
            public void update(){
                RestoreLocButton.setEnabled(!locT.getText().equals(locForRestore));
                if(timer.isRunning())timer.stop();
                Change();
            }
            CompletableFuture<Boolean> asyncLookup(String loc) {
                return CompletableFuture.supplyAsync(() -> {
                    try {
                        Naming.lookup("rmi://" + loc+ "/Remote0");
                       return true;
                    }
                    catch(Exception e1){
                        return false;
                    }
                });
            }
            final Timer timer=new Timer(500, e->{
                CompletableFuture<Boolean> future = asyncLookup(locT.getText());
                future.thenAccept(result -> {
                    if(result){
                        locT.setForeground(PresColor.FORE.value());
                        invalidTip.setVisible(false);
                    }
                    else{
                        locT.setForeground(PresColor.WARNING.value());
                        invalidTip.setForeground(PresColor.WARNING.value());
                        invalidTip.setVisible(true);
                    }
                });
            });
            public void test(){
                timer.start();
            }
            @Override
            public void insertUpdate(DocumentEvent e) {
                SwingUtilities.invokeLater(()->{
                    update();
                    test();
                });
            }

            @Override
            public void removeUpdate(DocumentEvent e) {
                SwingUtilities.invokeLater(()->{
                    update();
                    test();
                });
            }

            @Override
            public void changedUpdate(DocumentEvent e) {
                SwingUtilities.invokeLater(()->{
                    update();
                    test();
                });
            }
        });
        RestoreLocButton.setEnabled(false);
        RestoreLocButton.setFont(PresFont.fntText);
        RestoreLocButton.addActionListener(e->{
            RestoreLocButton.setEnabled(false);
            locT.setText(locForRestore);
        });
        title=new JLabel(bundle.getString("accountNConnection"));
        title.setFont(PresFont.fntBld);
        title.setAlignmentX(Component.LEFT_ALIGNMENT);
        Account.add(new JPanel(new FlowLayout(FlowLayout.LEFT)).add(title),BorderLayout.NORTH);
        AccountCont.add(locP);

        JSeparator separator=new JSeparator();
        AccountCont.add(separator);



        JPanel accountInfo=new JPanel(new FlowLayout(FlowLayout.LEFT));
        info = new JLabel(getID()>0?bundle.getString("registerToStart"): (MessageFormat.format(bundle.getString("registeredIdTip"),getID())));
        info.setFont(PresFont.fntText);
        sDiscButton = new JButton(bundle.getString("disconnect"));
        changePass = new JButton(bundle.getString("changePass"));
        SavePass = new JCheckBox(bundle.getString("doNotNeedPasswordAgain"));
        sDiscButton.setFont(PresFont.fntText);
        sDiscButton.setVisible(getID()>0);
        sDiscButton.addActionListener(e->{
            discFromSet();
            if(getID()>=0)return;
            sDiscButton.setVisible(false);
            changePass.setVisible(false);
            SavePass.setVisible(false);
            info.setText(bundle.getString("registerToStart"));
        });
        accountInfo.add(info);
        accountInfo.add(sDiscButton);
        AccountCont.add(accountInfo);

        JPanel accountMana=new JPanel(new FlowLayout(FlowLayout.LEFT));
        changePass.setVisible(getID()>0);
        changePass.setFont(PresFont.fntText);
        changePass.addActionListener(e->{

        });
        accountMana.add(changePass);
        AccountCont.add(accountMana);


        JPanel accountSet=new JPanel(new FlowLayout(FlowLayout.LEFT));
        SavePass.setVisible(getID()>0);
        SavePass.setFont(PresFont.fntText);
        accountSet.add(SavePass);
        AccountCont.add(accountSet);


        locP.setBounds(5,5,450,30);
        separator.setBounds(5,45,420,10);
        accountInfo.setBounds(5,55,300,30);
        accountMana.setBounds(5,85,300,30);
        accountSet.setBounds(5,115,420,30);


        OKButton.addActionListener(e->{
            if(!locT.getText().equals(locForRestore)&&getID()>0){
                ConfirmDialog confirm=new ConfirmDialog(bundle.getString("continueTitle"),bundle.getString("changeLocConfirm"),600,140);
                confirm.setVisible(true);
                if(!confirm.isOK()){
                    RestoreLocButton.doClick();
                    return;
                }
                sDiscButton.setVisible(false);
                changePass.setVisible(false);
                SavePass.setVisible(false);
                info.setText(bundle.getString("registerToStart"));
            }
            Apply();
            dispose();
        });
        ApplyButton.addActionListener(e-> {
            if(!locT.getText().equals(locForRestore)&&getID()>0){
                ConfirmDialog confirm=new ConfirmDialog(bundle.getString("continueTitle"),bundle.getString("changeLocConfirm"),600,140);
                confirm.setVisible(true);
                if(!confirm.isOK()){
                    RestoreLocButton.doClick();
                    return;
                }
                sDiscButton.setVisible(false);
                changePass.setVisible(false);
                SavePass.setVisible(false);
                info.setText(bundle.getString("registerToStart"));
            }
            Apply();
            locForRestore=locT.getText();
            RestoreLocButton.setEnabled(false);
        });
        CancelButton.addActionListener(e->dispose());

        GridBagConstraints s=new GridBagConstraints();

        s.fill=GridBagConstraints.VERTICAL;
        s.anchor= GridBagConstraints.WEST;
        s.weightx=0;
        s.weighty=1;
        s.insets=new Insets(10,0,10,10);
        options.setPreferredSize(new Dimension(150,400));
        layout.setConstraints(options,s);

        s.fill=GridBagConstraints.BOTH;
        s.anchor= GridBagConstraints.EAST;
        s.weightx=1;
        s.weighty=1;
        layout.setConstraints(settingPanel,s);

        container.add(options);
        container.add(settingPanel);
        options.addListSelectionListener(e->{
            if(options.getSelectedIndex()==3){
                options.setSelectedIndex(0);
                snakeGame sg=new snakeGame(getLocale());
                sg.setVisible(true);
                return;
            }
            settingPanel.setViewportView(panels.get(options.getSelectedIndex()));
            SwingUtilities.updateComponentTreeUI(settingPanel);
        });

        settingPanel.setBorder(new LineBorder(PresColor.BACK.value(),0));

        // Load Settings from the father
        Load("general");
    }

    @Override
    public void discFromSet(){
        Parent.discFromSet();
    }

    @Override
    public int getID() {
        if (Parent != null) {
            return Parent.getID();
        }
        else return -1;
    }

    @Override
    public void Apply(){

        // write to file
        setting.setSetting("loc",locT.getText());
        setting.setSetting("theme",  Objects.equals(themeSelector.getSelectedItem(), bundle.getString("auto"))?"auto":(Objects.equals(themeSelector.getSelectedItem(), bundle.getString("light"))?"light":"dark"));
        setting.setSetting("accentColor",ColorDecode.toAARRGGBB(accent));
        setting.setSetting("locale",localeName.get(localeSelector.getSelectedIndex()));
        setting.saveSettings();

        // update UI
        LightDarkMode.setDark(Objects.equals(themeSelector.getSelectedItem(),bundle.getString("dark")));
        FlatLaf.setGlobalExtraDefaults( Collections.singletonMap( "@accentColor", "#"+ColorDecode.toRRGGBB(accent)));
        SwingUtilities.updateComponentTreeUI(this);
        FlatLaf.updateUI();

        // apply to parent
        Parent.Apply();

        // update the buttons
        ApplyButton.setEnabled(false);
        CancelButton.setText(bundle.getString("close"));

        if(localeName.indexOf(setting.getSetting("locale","default"))!=localeSelector.getSelectedIndex()){
            if(localeChangeNotify){MessageBox m=new MessageBox(bundle.getString("continueTitle"),bundle.getString("localeChangeMessage"),400,120);
            localeChangeNotify=false;}
        }

        if(!getLocale().toLanguageTag().equals(localeName.get(localeSelector.getSelectedIndex()))||(localeSelector.getSelectedIndex()!=0&&defaultLocale)){
            localeChangeNotify=true;
            localeChangeTip.setVisible(true);
            localeChangeTip.setForeground(PresColor.WARNING.value());
            localeChangeTip.setText(bundle.getString("localeChangeMessage")+"  ->"+setting.getSetting("locale","default"));
        }
        else {
            localeChangeNotify=false;
            localeChangeTip.setVisible(false);
        }
    }

    @Override
    public void Load(String Home) {
        themeSelector.setSelectedItem(bundle.getString(LightDarkMode.isDark()?"dark":"light"));
        localeSelector.setSelectedIndex(defaultLocale?0:(localeName.indexOf(bundle.getLocale().toLanguageTag())));
        if(!getLocale().toLanguageTag().equals(localeName.get(localeSelector.getSelectedIndex()))||(localeSelector.getSelectedIndex()!=0&&defaultLocale)){
            localeChangeNotify=true;
            localeChangeTip.setVisible(true);
            localeChangeTip.setForeground(PresColor.WARNING.value());
            localeChangeTip.setText(bundle.getString("localeChangeMessage")+"  ->"+setting.getSetting("locale","default"));
        }
        else {
            localeChangeNotify=false;
            localeChangeTip.setVisible(false);
        }
        locForRestore=setting.getSetting("loc","127.0.0.1:1099");
        locT.setText(locForRestore);
        getRootPane().setDefaultButton(OKButton);
        ApplyButton.setEnabled(false);
        CancelButton.setText(bundle.getString("close"));
        options.setSelectedIndex(panelName.indexOf(Home));
        info.setText(getID()<=0?bundle.getString("registerToStart"):MessageFormat.format(bundle.getString("registeredIdTip"),getID()));
        sDiscButton.setVisible(getID()>0);
        changePass.setVisible(getID()>0);
        SavePass.setVisible(getID()>0);
        getAccentFromSet();
    }

    @Override
    public Color getAccent(){
        return accent;
    }

    @Override
    public void setLocale(String locale) {
        if(Objects.equals(locale, "default")) {
            defaultLocale=true;
            setLocale(Locale.getDefault());
        }
        else  {
            defaultLocale=false;
            setLocale(Locale.forLanguageTag(locale));
        }

    }

    private void getAccentFromSet() {
        String colorS=setting.getSetting("accentColor",Integer.toHexString(PresColor.FORE.value().getRGB()));
        int color=switch (colorS){
            case "ffff3b30","ffff453a"-> 1;
            case "ffff9500","ffff9f0a"-> 2;
            case "ffffcc00","ffffd60a"->3;
            case "ff34c759","ff30d158"->4;
            case "ff007aff","ff0a84ff"->5;
            case "ff660874","ff990cab"->6;
            case "ffd93379","ffe24880"->7;
            case "ffff69b4"->8;
            case "ff8e8e93"->9;
            case "ff060606","ffd8dae1"->11;
            default -> -1;};
        if(color<0)
        {
            try {
                accent = ColorDecode.fromAARRGGBB(colorS);
                selectedColor.setText(bundle.getString("custom")+" (0x" + colorS + ")");
                selectedColor.setForeground(accent);
            }
            catch(Exception e){
                colorSel.selectClick(11);
            }
        }
        else if(color==11)accent=PresColor.FORE.value();
        colorSel.selectClick(color);
    }


    private void Change(){
        ApplyButton.setEnabled(true);
        CancelButton.setText(bundle.getString("cancel"));
    }
}


@SuppressWarnings("ALL")
class snakeGame extends JFrame{
    static final int NORTH=0;
    static final int SOUTH=1;
    static final int WEST=2;
    static final int EAST=3;
    int score;
    final JPanel board=new JPanel(new FlowLayout());
    final JPanel container=new JPanel(new BorderLayout());
    final JLabel scoreL;
    final JLabel scoreN;
    final JLabel velTip;
    final JSpinner vel=new JSpinner();
    final JButton retry;
    final JButton resume;
    ResourceBundle bundle;

    snakeGame(Locale l){
        setLocale(l);
        bundle=ResourceBundle.getBundle("sysmsg",getLocale());
        setLayout(new BorderLayout());
        setSize(600,600);
        setLocationRelativeTo(null);
        setTitle("Snake Game - "+bundle.getString("scoreTip")+" 0");
        setBackground(new Color(0x1e1f22));
        add(container,BorderLayout.CENTER);
        final map[] m = {new map(50, 50)};
        m[0].setVisible(true);
        container.add(m[0],BorderLayout.CENTER);
        final snake[] s = {new snake(10, m[0], new location(0, 20, 50, 50), EAST)};
        m[0].addSnake(s[0]);
        board.setVisible(false);
        scoreL = new JLabel(bundle.getString("scoreTip")+" ");
        board.add(scoreL);
        scoreN = new JLabel("0");
        board.add(scoreN);
        velTip = new JLabel(" "+bundle.getString("veloTip"));
        board.add(velTip);
        board.add(vel);
        vel.setValue(10);
        retry = new JButton(bundle.getString("retry"));
        board.add(retry);
        resume = new JButton(bundle.getString("resume"));
        retry.addActionListener(e->{
            board.setVisible(false);
            m[0].destroy();
            container.removeAll();
            m[0] =new map(50,50);
            m[0].setVisible(true);
            s[0] =new snake((Integer)vel.getValue(), m[0], new location(0, 20, 50, 50),EAST);
            m[0].addSnake(s[0]);
            container.add(m[0]);
            score=0;
            scoreN.setText(String.valueOf(score));
            resume.setEnabled(true);
            container.requestFocusInWindow();
            setTitle("Snake Game - "+bundle.getString("scoreTip")+" "+score);
        });
        resume.addActionListener(e->{
            s[0].resume();
            board.setVisible(false);
            container.requestFocusInWindow();
        });
        container.requestFocusInWindow();
        container.setFocusable(true);
        container.addKeyListener(new KeyAdapter() {
            @Override
            public void keyTyped(KeyEvent e) {
                super.keyTyped(e);
                switch (e.getKeyChar()){
                    case  KeyEvent.VK_W,KeyEvent.VK_UP:{
                        s[0].face(NORTH);
                        break;
                    }
                    case  KeyEvent.VK_S,KeyEvent.VK_DOWN:{
                        s[0].face(SOUTH);
                        break;
                    }
                    case  KeyEvent.VK_A,KeyEvent.VK_LEFT:{
                        s[0].face(WEST);
                        break;
                    }
                    case  KeyEvent.VK_D,KeyEvent.VK_RIGHT:{
                        s[0].face(EAST);
                        break;
                    }
                    case KeyEvent.VK_SPACE:{
                        if(s[0].paused&&resume.isEnabled()){
                            s[0].resume();
                            board.setVisible(false);
                        }
                        else {
                            s[0].pause();
                            board.setVisible(true);
                            container.requestFocusInWindow();
                        }
                    }
                    default:break;
                }
            }

            @Override
            public void keyPressed(KeyEvent e) {
                super.keyPressed(e);
            }

            @Override
            public void keyReleased(KeyEvent e) {
                super.keyReleased(e);
            }
        });
        board.add(resume);
        add(board,BorderLayout.SOUTH);
    }
    snakeGame(){
        this(null);
    }
    static class location{
        private final int x,y;
        private final int xBound,yBound;
        location(int x,int y,int xBound,int yBound){
            this.xBound=xBound;
            this.yBound=yBound;
            this.x=(x+xBound) %xBound;
            this.y=(y+yBound)%yBound;
        }

        public int getX() {
            return x;
        }

        public int getY(){
            return y;
        }

        public int getXBound() {
            return xBound;
        }

        public int getYBound() {
            return yBound;
        }

        public location north(){
            return new location(x, y - 1, xBound, yBound);
        }
        public location south(){
            return new location(x, y + 1, xBound, yBound);
        }
        public location west(){
            return new location(x - 1, y, xBound, yBound);
        }
        public location east(){
            return new location(x + 1, y, xBound, yBound);
        }
        public location near(int facing){
            return switch (facing){
                case 0->north();
                case 1->south();
                case 2->west();
                case 3->east();
                default -> this;
            };
        }

    }
    class map extends JPanel implements drawable{
        private final ArrayList<snake> snakes=new ArrayList<>();
        private final int xBound, yBound;
        private location fruit;
        map(int xBound,int yBound){
            setBackground(new Color(0x1e1f22));
            this.yBound = yBound;
            this.xBound=xBound;
            setLayout(null);
            addFruit();
        }
        @SuppressWarnings("UnusedAssignment")
        public void destroy(){
            for(snake s: snakes) {
                s.destroy();
                s=null;
            }
            System.gc();
        }

        public void addSnake(snake s){
            snakes.addLast(s);
        }

        public int getYBound() {
            return yBound;
        }


        public int getXBound() {
            return xBound;
        }
        public void addFruit(){
            Random r=new Random(System.currentTimeMillis());
            fruit= new location(r.nextInt(0, xBound), r.nextInt(0, yBound), xBound, yBound);
        }

        @Override
        public void draw(){
            removeAll();
            int sWidth=getWidth()/xBound;
            int sHeight=getHeight()/yBound;
            for(snake s: snakes){
                boolean extend=false;
                if(s.body[s.head].getX()==fruit.getX()&&s.body[s.head].getY()==fruit.getY()){
                    s.extend();
                    addFruit();
                    score++;
                    scoreN.setText(String.valueOf(score));
                    setTitle("Snake Game - "+bundle.getString("scoreTip")+" "+score);
                }
                int corTail=(s.tail>s.head?0:100)+s.tail;
                boolean crashed=s.isCrashed();
                Color head=crashed?Color.GRAY:Color.RED;
                Color body=crashed?Color.DARK_GRAY:Color.ORANGE;
                for(int i=corTail;i>s.head;i--){
                    JPanel square = new JPanel();
                    square.setBackground(body);
                    square.setBounds(s.body[i%100].getX()*sWidth,s.body[i%100].getY()*sHeight,sWidth,sHeight);
                    add(square);
                    square.setVisible(true);
                }
                JPanel square = new JPanel();
                square.setBackground(head);
                square.setBounds(s.body[s.head].getX()*sWidth,s.body[s.head].getY()*sHeight,sWidth,sHeight);
                add(square);
                square.setVisible(true);
                if(crashed){
                    setTitle(getTitle()+" - "+bundle.getString("gameOver"));
                    board.setVisible(true);
                    resume.setEnabled(false);
                }
            }
            JPanel square = new JPanel();
            square.setBackground(Color.GREEN);
            square.setBounds(fruit.getX()*sWidth,fruit.getY()*sHeight,sWidth,sHeight);
            add(square);
            square.setVisible(true);
            SwingUtilities.updateComponentTreeUI(this);
        }
    }
    interface drawable{
        void draw();
    }
    class snake{
        snake(float velocity,map m,location sp,int facing){
            this.xBound=m.getXBound();
            this.yBound=m.getYBound();
            this.father=m;
            this.facing=facing;
            tail=2;
            body[0]= new location(sp.getX(), sp.getY(), xBound, yBound);
            body[1]=body[0].near(reverse(facing));
            body[2]=body[1].near(reverse(facing));
            Runnable move= this::move;
            service.scheduleAtFixedRate(move,0,(long)(1000/velocity), TimeUnit.MILLISECONDS);
        }
        ScheduledExecutorService service= Executors.newSingleThreadScheduledExecutor();
        private final int xBound,yBound;
        private int facing;
        private final int head=0;
        private int tail;
        private boolean crashed=false;
        private final drawable father;
        private final location[] body=new location[100];
        private boolean paused=false;
        public void move(){
            if(paused)return;
            int corTail=(tail>head?0:100)+tail;
            for(int i=corTail;i>head;i--){
                body[i%100]=body[(i-1)%100];
            }
            body[head]=body[head].near(facing);
            for(int i=corTail;i>head;i--){
                if(body[i%100].getX()==body[head].getX()&&body[i%100].getY()==body[head].getY()){
                    crashed=true;
                    break;
                }
            }
            father.draw();
            if(crashed)pause();
        }

        public void destroy(){
            this.service.close();
        }

        public boolean isCrashed() {
            return crashed;
        }

        public static int reverse(int facing){
            return switch (facing){
                case 0->1;
                case 1->0;
                case 2->3;
                default -> 2;
            };
        }
        public void pause(){
            this.paused=true;
        }
        public void resume(){
            this.paused=false;
        }
        public void extend(){
            location temp=body[tail];
            tail=(tail+1)%100;
            body[tail]=temp.near(0);
        }
        public location getHead(){
            return body[head];
        }
        public void face(int facing){
            this.facing=facing;
        }
    }
}

