import com.formdev.flatlaf.FlatLightLaf;

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
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;

public abstract class ClientFrame extends JFrame implements Command,settable{
    protected final JMenuBar menu=new JMenuBar();
    protected final JTextField idTextField=new JTextField(22);
    protected final JPasswordField passwordField=new JPasswordField(22);
    protected final JTextField commandInputBox=new JTextField("Input commands...");
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
    protected final JButton registerButton=new JButton("Register");
    protected final JButton DisconnectButton=new JButton("Disconnect");
    protected final JButton clearButton=new JButton("Clear Console");
    protected final JButton scanButton=new JButton("Scan");
    protected final JButton settingButton=new JButton("Settings...");
    protected final JButton AppTitle=new JButton("RoomX");
    protected final JLabel selected=new JLabel("N/A");
    protected final JLabel idLabel=new JLabel("      id:");
    protected final JLabel passwordLabel=new JLabel("password:");
    protected final JLabel idLabelIn=new JLabel("Welcome back!");
    protected final JLabel RoomLoc=new JLabel("  Room Loc:");
    protected final JComboBox<Integer> roomList=new JComboBox<>();
    protected final JMenu MFile=new JMenu("<html><body><u>F</u>ile</body></html>");
    protected final JMenu MAccount =new JMenu("<html><body><u>A</u>ccount</body></html>");
    protected final JMenu MView=new JMenu("<html><body><u>V</u>iew</body></html>");
    protected final JMenu MHelp=new JMenu("<html><body><u>H</u>elp</body></html>");
    protected final ButtonListPanel OverallInfo=new ButtonListPanel("Overall:");
    protected final ButtonListPanel FilteredInfo=new ButtonListPanel("Filtered:");

    protected final String version=properties.version.description();

    protected final Color commandFore=PresColor.GREEN.value();
    protected final Color commandBack=this.getBackground();

    protected final int[] ID={-1};
    protected final int[] count={0};//死去的变量突然攻击我

    protected final JFrame ActionFrame=new JFrame();

    private final settingFrame settings =new settingFrame(this);
    protected String loc;

    ClientFrame(){
        LightDarkMode.setDark(settings.setting.getSetting("theme","light").equals("dark"));
        loc=settings.setting.getSetting("loc","127.0.0.1:1099");
        menu.setVisible(false);

        count[0]=0;
        LocalDate today=LocalDate.now();
        if(today.getMonthValue()==4&&today.getDayOfMonth()==26) count[0]=9999;
        try {
            paintLD();
        } catch (UnsupportedLookAndFeelException e) {
            System.err.println("Failed to initialize flatLaf.");
        } catch (MalformedURLException | NotBoundException | RemoteException ignored) {
        }
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
        RoomLoc.setFont(PresFont.fntDisplay.fontName());
        ChooseARoom.add(RoomLoc);

        RoomNameL.setLayout(new FlowLayout(FlowLayout.CENTER));
        actionPanel.add(RoomNameL,BorderLayout.CENTER);

        Actions.setLayout(new FlowLayout());
        actionPanel.add(Actions,BorderLayout.SOUTH);

        // RoomList ComboBox Paint
        ChooseARoom.add(roomList);
        roomList.setEnabled(true);
        roomList.setFont(PresFont.fntText.fontName());
        roomList.setVisible(true);

        /// File Menu
        MFile.setMnemonic(KeyEvent.VK_F);//设置快速访问符
        JMenuItem item;

        // Settings
        item=new JMenuItem("<html><body><u>S</u>ettings</body></html>",KeyEvent.VK_S);
        item.setAccelerator(KeyStroke.getKeyStroke(KeyEvent.VK_S,InputEvent.ALT_DOWN_MASK));
        item.addActionListener(e-> {
            settings.setVisible(true);
            SwingUtilities.updateComponentTreeUI(settings);
            settings.Load("General");
        });
        MFile.add(item);

        MFile.addSeparator();// Separator---------------------------------------------

        // Exit
        item=new JMenuItem("<html><body><u>E</u>xit</body></html>",KeyEvent.VK_E);
        item.setAccelerator(KeyStroke.getKeyStroke(KeyEvent.VK_F4,InputEvent.ALT_DOWN_MASK));
        item.addActionListener(e->dispose());
        MFile.add(item);

        menu.add(MFile);
        /// End File Menu

        /// Account Menu
        MAccount.setMnemonic(KeyEvent.VK_A);

        // Account Settings
        item=new JMenuItem("<html><body>Account <u>S</u>ettings...</body></html>",KeyEvent.VK_S);
        item.addActionListener(e->{
            settings.setVisible(true);
            SwingUtilities.updateComponentTreeUI(settings);
            settings.Load("Account");
        });
        MAccount.add(item);
        MAccount.addSeparator();// Separator---------------------------------------------
        // Disconnect
        item=new JMenuItem("<html><body><u>D</u>isconnect</body></html>",KeyEvent.VK_D);
        JMenuItem finalItem1 = item;
        item.addActionListener(e->{
            if(ID[0]>0) clientDisconnect(true);
        });
        MAccount.add(item);


        menu.add(MAccount);
        /// End Account Menu


        /// View Menu
        MView.setMnemonic(KeyEvent.VK_V);
        // Show/Hide Command
        item=new JMenuItem(commandPanel.isVisible()?"<html><body>Hide <u>C</u>ommand</body></html>":"<html><body>Show <u>C</u>ommand</body></html>",KeyEvent.VK_C);
        item.setAccelerator(KeyStroke.getKeyStroke(KeyEvent.VK_C, InputEvent.ALT_DOWN_MASK));
        JMenuItem finalItem2 = item;
        item.addActionListener(e->{
            commandPanel.setVisible(!commandPanel.isVisible());
            finalItem2.setText(commandPanel.isVisible()?"<html><body>Hide <u>C</u>ommand</body></html>":"<html><body>Show <u>C</u>ommand</body></html>");
        });
        MView.add(item);

        /* Light/Dark Mode
        item=new JMenuItem("<html><body>Light/Dark <u>M</u>ode</body></html>",KeyEvent.VK_M);
        item.addActionListener(e->switchLD());
        MView.add(item);*/
        menu.add(MView);
        /// End View Menu

        /// Help Menu
        MHelp.setMnemonic(KeyEvent.VK_H);

        // Command Help
        item=new JMenuItem("<html><body><u>C</u>ommand Help...</body></html>",KeyEvent.VK_C);
        item.setAccelerator(KeyStroke.getKeyStroke(KeyEvent.VK_M, InputEvent.ALT_DOWN_MASK));
        item.addActionListener(e->{
            commandPanel.setVisible(true);
            finalItem2.setText(commandPanel.isVisible()?"<html><body>Hide <u>C</u>ommand</body></html>":"<html><body>Show <u>C</u>ommand</body></html>");
            help();
        });
        MHelp.add(item);

        MHelp.addSeparator();// Separator---------------------------------------------

        // About
        item=new JMenuItem("<html><body><u>A</u>bout</body></html>",KeyEvent.VK_A);
        item.setAccelerator(KeyStroke.getKeyStroke(KeyEvent.VK_A,InputEvent.ALT_DOWN_MASK));
        item.addActionListener(e->about(false));
        MHelp.add(item);

        menu.add(MHelp);
        /// End Help Menu

        setJMenuBar(menu);

        // Selected Label
        selected.setFont(PresFont.fntDisplay.fontName());
        RoomNameL.add(selected);
        selected.setVisible(true);

        // Input Panel & Account Panel
        BoxLayout layoutI=new BoxLayout(inputArea,BoxLayout.Y_AXIS);
        inputArea.setLayout(layoutI);

        idPanel.setAlignmentX(Component.CENTER_ALIGNMENT);
        idPanel.setAlignmentY(Component.CENTER_ALIGNMENT);
        idPanel.add(idLabel);
        accountPanel.add(idLabelIn);
        idLabel.setFont(PresFont.fntBld.fontName());
        idLabelIn.setFont(PresFont.fntDisplay.fontName());

        idPanel.add(idTextField);
        idTextField.setFont(PresFont.fntText.fontName());

        passwordPanel.setAlignmentX(Component.CENTER_ALIGNMENT);
        passwordPanel.setAlignmentY(Component.CENTER_ALIGNMENT);
        passwordPanel.add(passwordLabel);
        passwordLabel.setFont(PresFont.fntBld.fontName());
        passwordPanel.add(passwordField);
        passwordField.setFont(PresFont.fntText.fontName());

        AppTitle.setFont(PresFont.fntTitle.fontName());
        AppTitle.setBorder(new LineBorder(PresColor.NULL.value(),0));
        AppTitle.setBackground(PresColor.NULL.value());
        AppTitle.setAlignmentX(Component.CENTER_ALIGNMENT);
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
        registerButton.setFont(PresFont.fntBld.fontName());
        registerButton.setAlignmentX(Component.CENTER_ALIGNMENT);
        inputButtonPanel.add(registerButton);

        // Setting Button
        settingButton.setFont(PresFont.fnt.fontName());
        settingButton.setAlignmentX(Component.CENTER_ALIGNMENT);
        settingButton.addActionListener(e->{
            settings.setVisible(true);
            SwingUtilities.updateComponentTreeUI(settings);
            settings.Load("General");
        });
        inputButtonPanel.add(settingButton);
        inputArea.add(inputButtonPanel);

        // Disconnect Button Paint
        DisconnectButton.setFont(PresFont.fntBld.fontName());
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
        Console.setFont(PresFont.fntCons.fontName());
        Console.setBackground(PresColor.DARK.value());
        Console.setForeground(PresColor.LIGHT.value());
        Console.append("Input your id.\n");
        Console.setVisible(true);

        // Overall Info & Filtered Info
        InfoPane.add(OverallInfo);
        InfoPane.add(FilteredInfo);

        // Notification Center
        Notification.setEditable(false); //Readonly
        JScrollPane scrollPane3 =new JScrollPane(Notification);
        InfoPane.add(scrollPane3);
        Notification.setFont(PresFont.fntText.fontName());
        Notification.append("Input your id.\n");
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
        clearButton.setFont(PresFont.fntBld.fontName());
        clearButton.addActionListener(e -> {
            ConfirmDialog c=new ConfirmDialog("Clear the console?",400,100);
            c.setVisible(true);
            if(!c.isOK())return;
            Console.setText(""); // Clear
        });

        // Scan Button
        scanButton.setFont(PresFont.fntBld.fontName());
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
        JPanel gap2=new JPanel();
        commandPanel.add(gap2,BorderLayout.NORTH);
        gap2.setBackground(commandBack);
        gap2.setMaximumSize(new Dimension(0,1));
        JPanel goPane=new JPanel(new BorderLayout());
        commandPanel.add(goPane,BorderLayout.EAST);
        goPane.setBackground(commandBack);
        goPane.setMinimumSize(new Dimension(20,0));

        commandPanel.setBackground(commandBack);
        commandInputBox.setFont(PresFont.fntConsL.fontName());
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
                    if(commandInputBox.getText().equals("Input commands..."))return;
                    if(!conductible(commandInputBox.getText()))commandInputBox.setForeground(PresColor.RED.value());
                    else commandInputBox.setForeground(commandFore);
                }
            }

            @Override
            public void removeUpdate(DocumentEvent e) {
                if(commandInputBox.getText().contains("love"))commandInputBox.setForeground(PresColor.PINK.value());
                else{
                    if(commandInputBox.getText().equals("Input commands..."))return;
                    if(!conductible(commandInputBox.getText()))commandInputBox.setForeground(PresColor.RED.value());
                    else commandInputBox.setForeground(commandFore);
                }
            }

            @Override
            public void changedUpdate(DocumentEvent e) {
                if(commandInputBox.getText().contains("love"))commandInputBox.setForeground(PresColor.PINK.value());
                else{
                    if(commandInputBox.getText().equals("Input commands..."))return;
                    if(!conductible(commandInputBox.getText()))commandInputBox.setForeground(PresColor.RED.value());
                    else commandInputBox.setForeground(commandFore);
                }

            }
        });
        commandPanel.add(commandInputBox,BorderLayout.CENTER);
        commandInputBox.addFocusListener(new FocusAdapter() {
            final String hintText="Input commands...";
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
                if (temp.equals(hintText)) {
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
            paintLD();
        } catch (UnsupportedLookAndFeelException ex) {
            System.out.println("switch failed!");
        } catch (MalformedURLException | NotBoundException | RemoteException ignored) {
        }
    }

    protected void paintLD() throws UnsupportedLookAndFeelException, MalformedURLException, NotBoundException, RemoteException {
        setLightDarkMode();
        revalidate();
        repaint();
        scrollPane.getHorizontalScrollBar().setBackground(Console.getBackground());
        scrollPane.getVerticalScrollBar().setBackground(Console.getBackground());
        scrollPane.putClientProperty("ScrollBar.thumb",new Color(0x555555));
        SwingUtilities.updateComponentTreeUI(this);
        SwingUtilities.updateComponentTreeUI(settingFrame.getFrames()[0]);
        commandInputBox.setBackground(this.getBackground());
        if(ID[0]>0) scanning("NoMessage");
    }

    protected static void setLightDarkMode() throws UnsupportedLookAndFeelException {
        UIManager.getLookAndFeelDefaults().clear();
        UIManager.setLookAndFeel(LightDarkMode.isDark()?new FlatDarkerLaf():new FlatLightLaf());
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

    // Apply
    @Override
    public void Apply(){
        loc=settings.setting.getSetting("loc","127.0.0.1:1099");
        try {
            paintLD();
            if(!settings.locT.getText().equals(settings.locForRestore)&&ID[0]>0) clientDisconnect(false);
        }
        catch (Exception ignored){}
    }
    @Override
    public void Load(String Home){

    }
}
class settingFrame extends JFrame implements settable{
    private final settable Father;

    private final GridBagLayout layout=new GridBagLayout();
    final JPanel container=new JPanel(layout);
    final JPanel buttonPanel=new JPanel(new FlowLayout(FlowLayout.RIGHT));
    final JScrollPane settingPanel;
    final JButton OKButton=new JButton("OK");
    final JButton CancelButton=new JButton("Cancel");
    final JButton ApplyButton=new JButton("Apply");
    final JButton RestoreLocButton=new JButton("Restore");
    final JList<String> options=new JList<>(new String[]{"General","Appearance","Account"});
    final HashMap<String,JPanel> panels=new HashMap<>();
    final JSONSettingsManager setting=new JSONSettingsManager();

    String locForRestore;
    final JComboBox<String> themeSelector=new JComboBox<>();
    JTextField locT=new JTextField(20);

    settingFrame(settable Father){
        this.Father=Father;

        setTitle("Settings");
        setSize(600,400);
        setLayout(new BorderLayout());
        setMinimumSize(getSize());
        setMaximumSize(getSize());
        setLocationRelativeTo(null);
        options.setFont(PresFont.fnt.fontName());

        add(container,BorderLayout.CENTER);
        add(buttonPanel,BorderLayout.SOUTH);

        OKButton.setFont(PresFont.fntBld.fontName());
        CancelButton.setFont(PresFont.fnt.fontName());
        ApplyButton.setFont(PresFont.fnt.fontName());
        buttonPanel.add(OKButton);
        buttonPanel.add(CancelButton);
        buttonPanel.add(ApplyButton);

        JLabel title;

        // General Settings
        JPanel General=new JPanel();
        BoxLayout layout1=new BoxLayout(General,BoxLayout.Y_AXIS);
        General.setLayout(layout1);
        panels.put("General",General);
        settingPanel=new JScrollPane(General);



        title=new JLabel("General");
        title.setFont(PresFont.fntBldDisplay.fontName());
        title.setAlignmentX(Component.LEFT_ALIGNMENT);
        General.add(new JPanel(new FlowLayout(FlowLayout.LEFT)).add(title));


        // Appearance Settings
        JPanel Appearance=new JPanel();
        layout1=new BoxLayout(Appearance,BoxLayout.Y_AXIS);
        Appearance.setLayout(layout1);
        panels.put("Appearance",Appearance);

        title=new JLabel("Appearance");
        title.setFont(PresFont.fntBldDisplay.fontName());
        title.setAlignmentX(Component.LEFT_ALIGNMENT);
        Appearance.add(new JPanel(new FlowLayout(FlowLayout.LEFT)).add(title));

        JPanel themeP=new JPanel(new FlowLayout(FlowLayout.LEFT));
        JLabel themeTip=new JLabel("theme:");
        themeTip.setFont(PresFont.fnt.fontName());
        themeP.add(themeTip);
        themeP.add(themeSelector);

        themeSelector.setFont(PresFont.fntText.fontName());
        themeSelector.setToolTipText("select theme");
        themeSelector.addItem("light");
        themeSelector.addItem("dark");
        themeSelector.addActionListener(e->Change());
        Appearance.add(themeP);


        JPanel Account=new JPanel();
        layout1=new BoxLayout(Account,BoxLayout.Y_AXIS);
        Account.setLayout(layout1);
        panels.put("Account",Account);
        JPanel locP=new JPanel(new FlowLayout(FlowLayout.LEFT));
        JLabel locTip=new JLabel("server loc:");
        locTip.setFont(PresFont.fnt.fontName());
        JLabel invalidTip=new JLabel("Invalid location.");
        invalidTip.setFont(PresFont.fntText.fontName());
        invalidTip.setForeground(PresColor.WARNING.value());
        invalidTip.setVisible(false);
        locP.add(locTip);
        locP.add(locT);
        locP.add(invalidTip);
        locP.add(RestoreLocButton);

        locT.setFont(PresFont.fntText.fontName());
        locT.setToolTipText("server location on the internet");
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
        RestoreLocButton.setFont(PresFont.fnt.fontName());
        RestoreLocButton.addActionListener(e->{
            RestoreLocButton.setEnabled(false);
            locT.setText(locForRestore);
        });
        title=new JLabel("Account & Connection");
        title.setFont(PresFont.fntBldDisplay.fontName());
        title.setAlignmentX(Component.LEFT_ALIGNMENT);
        Account.add(new JPanel(new FlowLayout(FlowLayout.LEFT)).add(title));
        Account.add(locP);

        OKButton.addActionListener(e->{
            if(!locT.getText().equals(locForRestore)){
                ConfirmDialog confirm=new ConfirmDialog("Continue?","Changing server location will disconnect current account.\nContinue?\nChoose \"Cancel\" to restore the loc.",600,140);
                confirm.setVisible(true);
                if(!confirm.isOK()){
                    RestoreLocButton.doClick();
                    return;
                }
            }
            Apply();
            dispose();
        });
        ApplyButton.addActionListener(e-> {
            if(!locT.getText().equals(locForRestore)){
                ConfirmDialog confirm=new ConfirmDialog("Continue?","Changing server location will disconnect current account.\nContinue?\nChoose \"Cancel\" to restore the loc.",600,140);
                confirm.setVisible(true);
                if(!confirm.isOK()){
                    RestoreLocButton.doClick();
                    return;
                }
            }
            Apply();
        });
        CancelButton.addActionListener(e->dispose());

        GridBagConstraints s=new GridBagConstraints();

        s.fill=GridBagConstraints.VERTICAL;
        s.anchor= GridBagConstraints.WEST;
        s.weightx=0;
        s.weighty=1;
        s.insets=new Insets(10,10,10,10);
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
            settingPanel.setViewportView(panels.get(options.getSelectedValue()));
            SwingUtilities.updateComponentTreeUI(settingPanel);
        });

        settingPanel.setBorder(new LineBorder(PresColor.BACK.value(),0));

        // Load Settings from the father
        Load("General");
    }

    @Override
    public void Apply(){
        LightDarkMode.setDark(Objects.equals(themeSelector.getSelectedItem(), "dark"));
        setting.setSetting("loc",locT.getText());
        setting.setSetting("theme", (String) themeSelector.getSelectedItem());
        setting.saveSettings();
        Father.Apply();
        //
        ApplyButton.setEnabled(false);
        CancelButton.setText("Close");
        SwingUtilities.updateComponentTreeUI(this);
    }

    @Override
    public void Load(String Home) {
        themeSelector.setSelectedItem(LightDarkMode.isDark()?"dark":"light");
        locForRestore=setting.getSetting("loc","127.0.0.1:1099");
        locT.setText(locForRestore);
        getRootPane().setDefaultButton(OKButton);
        ApplyButton.setEnabled(false);
        CancelButton.setText("Close");
        options.setSelectedValue(Home,true);
    }


    private void Change(){
        ApplyButton.setEnabled(true);
        CancelButton.setText("Cancel");
    }
}
