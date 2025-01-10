import com.formdev.flatlaf.FlatLightLaf;

import javax.swing.*;
import javax.swing.event.DocumentEvent;
import javax.swing.event.DocumentListener;
import java.awt.*;
import java.awt.event.*;
import java.io.IOException;
import java.io.OutputStream;
import java.io.PrintStream;
import java.net.MalformedURLException;
import java.rmi.Naming;
import java.rmi.NotBoundException;
import java.rmi.RemoteException;
import java.util.*;

@SuppressWarnings("FieldCanBeLocal")
public class ApproverClient extends JFrame implements Command {

    // Default Fonts
    final Font fnt = new Font("微软雅黑", Font.PLAIN, 11);
    final Font fntBld = new Font("微软雅黑", Font.BOLD, 11);
    final Font fntCons = new Font("Consolas", Font.PLAIN, 12);
    final Font fntConsL = new Font("Consolas", Font.PLAIN, 14);


    public void Scanning() throws MalformedURLException, NotBoundException, RemoteException {
        RoomMonitorWithAppliers server;
        int count=0;
        int connect=0;
        if(!observers.isEmpty())observers.clear();
        roomList.removeAllItems();
        System.gc(); //Initialize the observers.
        OverallInfo.setText("");
        FilteredInfo.setText("Application(s):\n\n");
        if(ID[0]==-1){
            OverallInfo.append("No certification!!!\nInput correct id.\n");
            new MessageBox("No certification!!! Input correct id.",400,100).setVisible(true);
            return;
        }
        for(int i=0;i<100;i++){
            try{
                count++;
                server = (RoomMonitorWithAppliers) Naming.lookup("rmi://127.0.0.1:1099/Remote" + (count));
                connect++;
                OverallInfo.append("Location "+count+": "+server.ToString()+"\n");
                observers.put(count,new Approver(count-1,ID[0]));
                roomList.addItem(count);
                if(server.NumberOfAppliers()>0)if(server.StateStr().equals("Guest-Occupied"))FilteredInfo.append("Location "+count+": "+server.ToString()+"\n   (Occupied, "+(server.NumberOfAppliers()-1)+" person(s) applying besides current user)\n");
                    else FilteredInfo.append("Location "+count+": "+server.ToString()+"\n   ("+server.NumberOfAppliers()+" person(s) applying)\n");
            }catch (Exception ignored){
            }
        }
        if(connect==0){
            OverallInfo.append("No remote rooms.\n\n");
            System.out.println("No remote rooms found.\n");
        }
        else {
            OverallInfo.append(connect+" rooms found above.\n\n");
            System.out.println("Scanning complete.\n"+connect+" rooms found.\n");
        }
    }

    public void Check(int Focus) throws RemoteException {
        ApplierList.setText("\n");
        AppliersChoice.removeAllItems();
        if(!CheckPane.isVisible()) {
            CheckPane.setVisible(true);
        }
        Focusing[0]=Focus;
        RoomL.setText(" All appliers for room "+Focus+"\n"+observers.get(Focus).ToString());
        try {
            boolean exi=false;
            appliers=observers.get(Focus).ApplierList();
            for(Map.Entry<Integer, UserInfo>observer : appliers.entrySet()) {
                if(observers.get(Focus).Occupying(observer.getValue().getID())) ApplierList.append("(Occupying) ");
                ApplierList.append("Applier id: "+observer.getValue().getID()+" Crowd: "+observer.getValue().getCrowd()+"\n\n");
                AppliersChoice.addItem(observer.getValue().getID());
                exi=true;
            }
            if(!exi)throw new RuntimeException();
        } catch (Exception ex) {
            Notification.setText("");
            System.out.println("Cannot get applier list. \nCheck if there are any appliers.");
            ApplierList.setText("Cannot get applier list. Check if there are any appliers.");
            new MessageBox("Cannot get applier list. Check if there are any appliers.",400,100).setVisible(true);
        }
    }

    private final String version="1.2";

    private final JTextField idTextField;
    private final JTextField commandInputBox=new JTextField("Input commands...");
    private final JTextArea Messenger;
    private final JTextArea Console;
    private final JTextArea Notification;
    private final JTextArea OverallInfo;
    private final JTextArea FilteredInfo;
    private final JTextArea ApplierList;
    private final JButton registerButton;
    private final JButton DisconnectButton;
    private final JButton clearButton;
    private final JButton scanButton;
    private final JButton checkButton;
    private final JPanel ItPane;
    private final JPanel CheckPane;
    private final JComboBox<Integer> roomList=new JComboBox<>();
    private final JComboBox<Integer> AppliersChoice;
    private final int[] ID={-1};
    private Approver check;
    private final int[] Count={0};
    private final HashMap<Integer,Approver> observers=new HashMap<>();
    private final JLabel selected=new JLabel("N/A");
    private final JTextPane RoomL;
    private final int[] Focusing={-1};
    private final Color commandFore=new Color(0x449911);
    private final Color commandBack=this.getBackground();
    private final Color commandLostFocus=new Color(0x555555);
    private final Color love=new Color(0xff69b4);
    private HashMap<Integer, UserInfo> appliers=new HashMap<>();
    final ArrayList<String> ref=new ArrayList<>(Arrays.asList("connect","register","approve","reject","scan","disconnect","exit","check","clear",
            "?", "help", "hello", "bye", "nihao", "zaijian","love", "tell","about"));


    @Override
    public boolean conductible(String command) {
        String[] com=command.split("\\s+");
        return ref.contains(com[0]);
    }

    @Override
    public void conduct(String command) {
        String[] com=command.split("\\s+");
        switch (com[0]){
            case "connect","register":{
                if(ID[0]!=-1){
                    System.out.println("Disconnect current user first, please.");
                    break;
                }
                if(com[1]!=null) idTextField.setText(com[1]);
                registerButton.doClick();
                break;
            }
            case "approve":{
                if(ID[0]==-1){
                    System.out.println("Please register first.");
                    break;
                }
                int RoomID;
                int UserID;
                try{
                    if(com[1].equals("this")||com[1].equals("~")||com[1].equals("-")||com[1].equals("room"))RoomID=Focusing[0];
                    else RoomID = Integer.parseInt(com[1].trim());
                    if(!observers.get(RoomID).StateStr().equals("Empty, Clean"))throw new RuntimeException();
                    UserID = Integer.parseInt(com[2].trim());
                    if(UserID<=0)throw new NumberFormatException();
                    Focusing[0]=RoomID;
                    observers.get(RoomID).Approve(UserID);
                    Check(Focusing[0]);
                } catch (NumberFormatException|ArrayIndexOutOfBoundsException e){
                    System.out.println("Illegal room ID or user ID.");
                } catch (Exception e) {
                    System.out.println("Failed to approve, check if the status is correct.");
                }
                break;
            }
            case "reject":{
                if(ID[0]==-1){
                    System.out.println("Please register first.");
                    break;
                }
                int RoomID;
                int UserID;
                try{
                    if(com[1].equals("this")||com[1].equals("~")||com[1].equals("-")||com[1].equals("room"))RoomID=Focusing[0];
                    else RoomID = Integer.parseInt(com[1].trim());
                    if(observers.get(RoomID).StateStr().equals("Guest-Occupied"))throw new RuntimeException();
                    if(com[2].equals("all")){
                        appliers=observers.get(RoomID).ApplierList();
                        for(Map.Entry<Integer,UserInfo> applier:appliers.entrySet()) observers.get(RoomID).Reject(applier.getValue().getID());
                    }
                    else {
                        UserID = Integer.parseInt(com[2].trim());
                        if(UserID<=0)throw new NumberFormatException();
                        observers.get(RoomID).Reject(UserID);
                    }
                    if(roomList.getSelectedItem()!=null)Focusing[0]=Focusing[0]<=0?(int)roomList.getSelectedItem():Focusing[0];
                    System.out.println("Rejecting success.");
                    Check(Focusing[0]);
                } catch (NumberFormatException|ArrayIndexOutOfBoundsException e){
                    System.out.println("Illegal room ID or user ID.");
                } catch (Exception e) {
                    System.out.println("Failed to reject, check if the status is correct.");
                }
                break;
            }
            case "check":{
                int RoomID;
                if(ID[0]==-1){
                    System.out.println("Please register first.");
                    break;
                }
                try{
                    try {
                        if (com[1].equals("this") || com[1].equals("~") || com[1].equals("-") || com[1].equals("room") || com[1].isBlank())
                            if (roomList.getSelectedItem() != null) RoomID = (int) roomList.getSelectedItem();
                            else throw new NumberFormatException();
                        else RoomID = Integer.parseInt(com[1].trim());
                        Notification.setText("");
                        Focusing[0]=RoomID;
                        Check(RoomID);
                    }
                    catch(NumberFormatException e){
                        System.out.println("Input correct room ID.");
                    }
                    catch (ArrayIndexOutOfBoundsException e1){
                        if (roomList.getSelectedItem() != null) RoomID = (int) roomList.getSelectedItem();
                        else throw new NumberFormatException();
                        Notification.setText("");
                        Check(RoomID);
                    }}
                catch (RemoteException e1){
                    System.out.println("Failed to get applier list from server.");
                }
                break;
            }
            case "clear":{
                clearButton.doClick();
                break;
            }
            case "scan":{
                scanButton.doClick();
                break;
            }
            case "disconnect":{
                if(ID[0]==-1){
                    System.out.println("Please register first.");
                    break;
                }
                DisconnectButton.doClick();
                break;
            }
            case "exit","bye","zaijian":{
                dispose();
                break;
            }
            case "help","?":{
                help();
                break;
            }
            case "about":{
                if(com.length>=2&&com[1].equals("love")){
                    new MessageBox("Love is invaluable.\n\nRoom Management System (Approver Client)\nversion "+version+"\n(C)Vincent C. All rights reserved.",400,240).setVisible(true);
                }
                else new MessageBox("Room Management System (Approver Client)\nversion "+version+"\n(C)Vincent C. All rights reserved.",400,240).setVisible(true);
                break;
            }
            case "nihao":{
                System.out.println("""
                        Ni hao ya, chi le ma?\
                        
                        Jin tian guo de zen yang, you mei you kai xin de shier?\
                        
                        You fan xin shi ye bie men zai xin li bianer, shu ru "tell" gao su wo ba!""");
                break;
            }
            case "hello":{
                System.out.println("""
                        Hi there, how's it going?\
                        
                        Is there something exciting?\
                        
                        Or something bothering you? Tell me with "tell"!""");
                break;
            }
            case "love":{
                new MessageBox("""
                        我们始终相信，爱可以改变世界。
                        去爱你所爱的人，也尝试去爱你想爱的人。
                        We always believe that, love has the power changing the world.
                        Go and love who you love, and try to love who you want to love.""",500,160).setVisible(true);
                break;
            }
            case "tell":{
                if((com.length>=3&&com[1].equals("about")&&com[2].equals("love"))||(com.length>=2&&com[1].equals("love"))){
                    new MessageBox("爱之花盛开的地方，生命便能欣欣向荣。\nWhere the flower of love blooms, life can thrive.\n    --Vincent Van Gogh",400,140).setVisible(true);
                }
                else{
                System.out.println("""
                        Yes, I'm listening to you.\
                        
                        Yet I'm not able to talking to you in this version,\
                        
                        I'm glad you use /tell to pour sth out to me.\
                        
                        The content you just told me will not be sent to the server.""");
                ConfirmDialog c=new ConfirmDialog("听着呢。\n虽然我还没有和你对话的能力，\n但是很高兴有你这样使用/tell说点什么的人。\n刚才的对话内容不会上传到服务器。\n不过计数器会记录一次，如果你不介意的话，就按下OK吧",400,240);
                c.setVisible(true);
                if(c.isOK()){
                    try {
                        RoomMonitor server=(RoomMonitor) Naming.lookup("rmi://127.0.0.1:1099/Remote0");
                        server.Tells();
                    } catch (NotBoundException | MalformedURLException | RemoteException ignored) {
                    }
                }
                }
                break;
            }
            default:{
                System.out.println("Incorrect command.");
            }
        }
    }


    private class ExWindowListener extends WindowAdapter {
        @Override
        public void windowClosing(WindowEvent e) {
            super.windowClosing(e);
            try {
                if(check!=null)check.Disconnect();
                if(!observers.isEmpty())for(Map.Entry<Integer,Approver> observer: observers.entrySet()) observer.getValue().Disconnect();
                System.exit(0);
            } catch (Exception ex) {
                System.exit(-1);
            }
        }

    }

    public ApproverClient() {
        // Title
        setTitle("ApproverClient");

        // Size of the form
        setSize(960, 540);
        setMinimumSize(new Dimension(960,540));
        this.setLocationRelativeTo(null);

        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        addWindowListener(new ExWindowListener());

        // Overall Layout
        setLayout(new BorderLayout());

        // Command Panel
        JPanel commandPanel=new JPanel(new BorderLayout(5,5));
        add(commandPanel, BorderLayout.SOUTH);

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
        commandInputBox.setFont(fntConsL);
        commandInputBox.setForeground(commandLostFocus);
        commandInputBox.setBackground(commandBack);
        commandInputBox.setBorder(BorderFactory.createLineBorder(Color.BLACK,0));
        commandInputBox.setMinimumSize(new Dimension(0,50));
        commandInputBox.addKeyListener(new KeyAdapter() {
            @Override
            public void keyTyped(KeyEvent e) {
                super.keyTyped(e);
                if (e.getKeyChar() == KeyEvent.VK_ENTER) {
                    if(commandInputBox.getForeground()==commandFore||commandInputBox.getForeground()==love){
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
                if(commandInputBox.getText().contains("love"))commandInputBox.setForeground(love);
                else{
                    if(commandInputBox.getText().equals("Input commands..."))return;
                    if(!conductible(commandInputBox.getText()))commandInputBox.setForeground(Color.RED);
                    else commandInputBox.setForeground(commandFore);
                }
            }

            @Override
            public void removeUpdate(DocumentEvent e) {
                if(commandInputBox.getText().contains("love"))commandInputBox.setForeground(love);
                else{
                    if(commandInputBox.getText().equals("Input commands..."))return;
                    if(!conductible(commandInputBox.getText()))commandInputBox.setForeground(Color.RED);
                    else commandInputBox.setForeground(commandFore);
                }
            }

            @Override
            public void changedUpdate(DocumentEvent e) {
                if(commandInputBox.getText().contains("love"))commandInputBox.setForeground(love);
                else{
                    if(commandInputBox.getText().equals("Input commands..."))return;
                    if(!conductible(commandInputBox.getText()))commandInputBox.setForeground(Color.RED);
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
                    commandInputBox.setForeground(commandLostFocus);
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

        // Button Panel
        JPanel buttonPanel = new JPanel();
        buttonPanel.setLayout(new GridLayout(1,3));

        // Action Panel
        JPanel actionPanel=new JPanel();
        actionPanel.setLayout(new BorderLayout());
        actionPanel.setVisible(false);

        JPanel ChooseARoom=new JPanel();
        ChooseARoom.setLayout(new FlowLayout(FlowLayout.CENTER));
        actionPanel.add(ChooseARoom,BorderLayout.NORTH);
        ChooseARoom.add(new JLabel("Room Loc:"));

        JPanel RoomNameL=new JPanel();
        RoomNameL.setLayout(new FlowLayout(FlowLayout.CENTER));
        actionPanel.add(RoomNameL,BorderLayout.CENTER);

        JPanel Actions=new JPanel();
        Actions.setLayout(new FlowLayout());
        actionPanel.add(Actions,BorderLayout.SOUTH);

        // RoomList ComboBox
        ChooseARoom.add(roomList);
        roomList.setEnabled(true);
        roomList.setFont(fnt);
        roomList.setVisible(true);
        roomList.addItemListener(e -> {
            try {
                if(roomList.getSelectedItem()!=null)selected.setText(observers.get(roomList.getSelectedItem()!=null?roomList.getSelectedItem():-1).ToString());
            } catch (RemoteException ex) {
                throw new RuntimeException(ex);
            }
        });

        // Selected Label
        RoomNameL.add(selected);
        selected.setVisible(true);

        // Input Panel
        JPanel inputPanel = new JPanel();
        inputPanel.setLayout(new FlowLayout());

        JLabel idLabel = new JLabel("id:");
        inputPanel.add(idLabel);
        idLabel.setFont(fntBld);


        idTextField = new JTextField(20);
        inputPanel.add(idTextField);
        idTextField.setFont(fnt);

        add(inputPanel, BorderLayout.NORTH);

        // Register Button
        registerButton = new JButton("Register");
        registerButton.setFont(fntBld);
        inputPanel.add(registerButton);
        registerButton.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                Notification.setText("");
                try {
                    ID[0] = Integer.parseInt(idTextField.getText().trim());
                    if(ID[0]<=0)throw new NumberFormatException();
                    check=new Approver("rmi://127.0.0.1:1099/Remote0",ID[0]);
                    if(check.isDup())throw new DuplicationException("id already exist.");
                    Messenger.append("Confirmed id: " + ID[0] + "\n");
                    registerButton.setVisible(false);
                    idTextField.setEditable(false);
                    idTextField.setVisible(false);
                    idLabel.setText("ID: "+ID[0]);
                    DisconnectButton.setVisible(true);
                    actionPanel.setVisible(true);
                    Scanning();
                } catch (NumberFormatException ex1) {
                    Messenger.append("Illegal id.\n");
                    new MessageBox("Illegal id.",400,100).setVisible(true);
                    ID[0]=-1;
                }
                catch(NotBoundException | IOException ex2){
                    Messenger.append("Failed to connect to the remote server.\n");
                    new MessageBox("Failed to connect to the remote server.",400,100).setVisible(true);
                    ID[0]=-1;
                }
                catch(DuplicationException ex3){
                    Messenger.append("id already exist.");
                    new MessageBox("Id already exist.",400,100).setVisible(true);
                    ID[0]=-1;
                    check=null;
                }
            }
        });


        // TextArea at the Center
        JPanel TextPane=new JPanel();
        add(TextPane, BorderLayout.CENTER);
        TextPane.setLayout(new GridLayout(1,2));
        JPanel OpPane=new JPanel();
        OpPane.setLayout(new BorderLayout());
        TextPane.add(OpPane);
        JPanel InfoPane=new JPanel();
        InfoPane.setLayout(new GridLayout(3,1));
        TextPane.add(InfoPane);



        //Interface Panel
        ItPane=new JPanel();
        ItPane.setLayout(new BorderLayout());
        OpPane.add(ItPane,BorderLayout.NORTH);// Action Panel
        ItPane.add(actionPanel,BorderLayout.CENTER);
        ItPane.add(buttonPanel,BorderLayout.SOUTH);
        ItPane.add(inputPanel, BorderLayout.NORTH);


        //Console
        Console= new JTextArea();
        Console.setEditable(false); //Readonly
        JScrollPane scrollPane =new JScrollPane(Console);
        OpPane.add(scrollPane,BorderLayout.CENTER);
        Console.setFont(fntCons);
        Console.setBackground(new Color(0x181818));
        Console.setForeground(new Color(0xe0e0e0));
        Console.append("Input your id.\n");
        Console.setVisible(true);

        // Overall Info
        OverallInfo = new JTextArea();
        OverallInfo.setEditable(false); // Readonly
        JScrollPane scrollPane1 = new JScrollPane(OverallInfo);
        InfoPane.add(scrollPane1);
        OverallInfo.setFont(fnt);

        // Filtered Info
        FilteredInfo=new JTextArea();
        FilteredInfo.setEditable(false); //Readonly
        JScrollPane scrollPane2=new JScrollPane(FilteredInfo);
        InfoPane.add(scrollPane2);
        FilteredInfo.setFont(fnt);


        // Notification Center
        Notification = new JTextArea();
        Notification.setEditable(false); //Readonly
        JScrollPane scrollPane3 =new JScrollPane(Notification);
        InfoPane.add(scrollPane3);
        Notification.setFont(fnt);
        Notification.append("Input your id.\n");
        Notification.setVisible(true);
        TextPane.add(InfoPane);

        // Message
        Messenger = new JTextArea("");
        Messenger.setEditable(true); // Readonly
        Messenger.getDocument().addDocumentListener(new DocumentListener() {
            @Override
            public void insertUpdate(DocumentEvent e) {
                SwingUtilities.invokeLater(() -> {
                    Console.append(Messenger.getText()+"\n");
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

        // CheckPane
        CheckPane=new JPanel();
        CheckPane.setLayout(new BorderLayout());
        CheckPane.setVisible(false);
        add(CheckPane,BorderLayout.EAST);
        // Room Label
        RoomL=new JTextPane();
        RoomL.setEditable(false);
        RoomL.setFont(new Font("微软雅黑",Font.BOLD,12));
        CheckPane.add(RoomL,BorderLayout.NORTH);

        // Decision Panel
        JPanel decisionPane=new JPanel();
        decisionPane.setLayout(new GridLayout(1,4));
        CheckPane.add(decisionPane,BorderLayout.SOUTH);

        // Appliers ComboBox
        AppliersChoice=new JComboBox<>();
        decisionPane.add(AppliersChoice);


        // Applier List
        ApplierList=new JTextArea();
        ApplierList.setEditable(false);
        ApplierList.setFont(fnt);

        // Decision Buttons
        JButton ApproveButton=new JButton();
        JButton RejectButton=new JButton();
        JButton BackButton=new JButton();
        decisionPane.add(ApproveButton);
        decisionPane.add(RejectButton);
        decisionPane.add(BackButton);
        ApproveButton.setVisible(true);
        RejectButton.setVisible(true);
        BackButton.setVisible(true);
        ApproveButton.setFont(fntBld);
        RejectButton.setFont(fntBld);
        BackButton.setFont(fntBld);
        ApproveButton.setText("Approve");
        RejectButton.setText("Reject");
        BackButton.setText("Back");
        ApproveButton.addActionListener(e -> {
            if(AppliersChoice.getSelectedItem()!=null) {
                int i=(int)AppliersChoice.getSelectedItem();
                try {
                    ConfirmDialog c=new ConfirmDialog("Approve applier #"+i+"'s application for room #"+Focusing[0]+"(aka "+observers.get(Focusing[0]).NameStr()+")"+"?",400,100);
                    c.setVisible(true);
                    if(!c.isOK())return;
                    int suc=observers.get(Focusing[0]).Approve(i);
                    Messenger.setText("");
                    if(suc==0)throw new RuntimeException();
                    System.out.println("Approval success!");

                    if (CheckPane.isVisible()) {
                        CheckPane.setVisible(false);
                    }
                    ApplierList.setText("");
                } catch (Exception ex) {
                    Messenger.setText("");
                    System.out.println("Failed to approve, try again later.");
                }
            }
            else {
                Messenger.setText("");
                System.out.println("Failed to approve, try again later.");
                new MessageBox("Failed to approve, try again later.",400,100).setVisible(true);
            }
        });
        RejectButton.addActionListener(e -> {
            if(AppliersChoice.getSelectedItem()!=null) {
                int i=(int)AppliersChoice.getSelectedItem();
                try {
                    ConfirmDialog c=new ConfirmDialog("Reject applier #"+i+"'s application for room #"+Focusing[0]+"(aka"+observers.get(Focusing[0]).NameStr()+")"+"?",400,100);
                    c.setVisible(true);
                    if(!c.isOK())return;
                    int suc=observers.get(Focusing[0]).Reject(i);
                    Messenger.setText("");
                    if(suc==0)throw new RuntimeException();
                    System.out.println("Rejection success!");
                    Notification.setText("");

                    // Check Again
                    Check(Focusing[0]);
                } catch (Exception ex) {
                    Messenger.setText("");
                    System.out.println("Failed to reject, try again later.");
                    new MessageBox("Failed to reject, try again later.",400,100).setVisible(true);
                }
            }
            else {
                Messenger.setText("");
                System.out.println("Failed to reject, try again later.");
            }
        });
        BackButton.addActionListener(e -> {
            if(CheckPane.isVisible()) {
                CheckPane.setVisible(false);}
        });


        CheckPane.add(ApplierList,BorderLayout.CENTER);

        // Disconnect Button
        DisconnectButton = new JButton("Disconnect");
        DisconnectButton.setFont(fntBld);
        inputPanel.add(DisconnectButton);
        DisconnectButton.setVisible(false);
        DisconnectButton.addActionListener(e -> {
            Notification.setText("");
            try {
                ConfirmDialog c=new ConfirmDialog("Disconnect "+ID[0]+" from the server?",400,100);
                c.setVisible(true);
                if(!c.isOK())return;
                check.Disconnect();
                if(!observers.isEmpty()){
                    for(Map.Entry<Integer,Approver> observer: observers.entrySet()) observer.getValue().Disconnect();
                    observers.clear();
                }
                idTextField.setText(String.valueOf(ID[0]));
                ID[0]=-1;
                Console.setText("");
                FilteredInfo.setText("");
                DisconnectButton.setVisible(false);
                registerButton.setVisible(true);
                idTextField.setEditable(true);
                idTextField.setVisible(true);
                idLabel.setText("ID:");
                Messenger.setText("Disconnected from the server.\n");
                OverallInfo.setText("");
                actionPanel.setVisible(false);
                if(CheckPane.isVisible()) {
                    CheckPane.setVisible(false);}
            } catch (RemoteException ex) {
                new MessageBox("Failed to disconnect, try again later.",400,100).setVisible(true);
                throw new RuntimeException(ex);
            }
        });


        // Clear Button
        clearButton = new JButton("Clear Console");
        clearButton.setFont(fntBld);
        clearButton.addActionListener(e -> {
            ConfirmDialog c=new ConfirmDialog("Clear the console?",400,100);
            c.setVisible(true);
            if(!c.isOK())return;
            Console.setText(""); // Clear
        });
        buttonPanel.add(clearButton);

        // Scan Button
        scanButton=new JButton("Scan");
        scanButton.setFont(fntBld);
        scanButton.addActionListener(e -> {
            Notification.setText("");
            try {
                Scanning();
            } catch (MalformedURLException | RemoteException | NotBoundException ex) {
                throw new RuntimeException(ex);
            }
        });
        buttonPanel.add(scanButton);


        // Check Button
        checkButton = new JButton("Check...");
        checkButton.setFont(fntBld);
        checkButton.addActionListener(e -> {
            Notification.setText("");
            Focusing[0]=(int) (roomList.getSelectedItem()!=null?roomList.getSelectedItem():-1);
            try {
                Check(Focusing[0]);
            } catch (RemoteException ex) {
                throw new RuntimeException(ex);
            }
        });
        Actions.add(checkButton);


        // Redirect "System.out" to "TextArea"
        System.setOut(new PrintStream(new JTextAreaOutputStream(Messenger)));
    }

    private void help(){
        new MessageBox("""
                register/connect <your id>   (register as <id>)
                disconnect   (disconnect current user from server)
                scan   (refresh the room list)
                clear   (clear the console)
                approve <room id> <applier id>   (approve an applier's request)
                reject <room id> <applier id>   (reject an applier's request)
                check <room id>   (check the applier list of a room)
                exit   (close the client)
                help(or ?)   (show help, like this)
                "this", "~", "-", "room" represents for the room you are choosing.
                """,500,300).setVisible(true);
        System.out.println("""
                Help:
                register/connect <your id>   (register as <id>)
                disconnect   (disconnect current user from server)
                scan   (refresh the room list)
                clear   (clear the console)
                approve <room id> <applier id>   (approve an applier's request)
                reject <room id> <applier id>   (reject an applier's request)
                check <room id>   (check the applier list of a room)
                exit   (close the client)
                help(or ?)   (show help, like this)
                "this", "~", "-", "room" represents for the room you are choosing.
                """);
    }


    public static void main(String[] args) {


        ///Optional, if not work, delete it and its dependency.
        try {
            UIManager.setLookAndFeel( new FlatLightLaf() );
        } catch( Exception ex ) {
            System.err.println( "Failed to initialize LaF" );
        }

        // Safely Run
        SwingUtilities.invokeLater(() -> new ApproverClient().setVisible(true));
    }

    // Customize OutputStream, let "print" family print to "JTextArea"
    private static class JTextAreaOutputStream extends OutputStream {
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

}
