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
public class UserClient extends JFrame implements Command{

    public void Scanning(String State) throws MalformedURLException, NotBoundException, RemoteException {
        RoomMonitorWithAppliers server;
        int count=0;
        int connect=0;
        Application[0]=0;
        if(!observers.isEmpty())observers.clear();
        roomList.removeAllItems();
        System.gc(); //Initialize the observers.
        OverallInfo.setText("");
        FilteredInfo.setText(!Objects.equals(filter.getSelectedItem(), "-Select filter-") ?"Filter: "+ filter.getSelectedItem()+"\n\n":"No filter.\n");
        if(ID[0]==-1){
            OverallInfo.append("No certification!!!\nInput correct id.\n");
            FilteredInfo.append("No certification!!!\nInput correct id.\n");
            new MessageBox("No certification!!! Input correct id.",400,100).setVisible(true);
            return;
        }
        for(int i=0;i<100;i++){
            try{
                count++;
                server = (RoomMonitorWithAppliers) Naming.lookup("rmi://127.0.0.1:1099/Remote" + (count));
                Application[0]+=server.Applying(ID[0])?1:0;
                connect++;
                if(server.Applying(ID[0])&&!Objects.requireNonNull(filter.getSelectedItem()).equals("-Select filter-"))OverallInfo.append("(Applying) ");
                OverallInfo.append("Location "+count+": "+server.ToString()+"\n");
                FilteredInfo.append(switch((String) Objects.requireNonNull(filter.getSelectedItem())){
                    case "Available"-> (!server.Applying(ID[0]))&&Objects.equals(server.StateStr(), "Empty, Clean") ?("Location "+count+": "+server.ToString()+"("+server.NumberOfAppliers()+" person(s) applying)\n"):"";
                    case "Applying"-> server.Applying(ID[0])?("Location "+count+": "+server.ToString()+"\n   ("+(server.NumberOfAppliers()-1-(server.StateStr().equals("Guest-Occupied")?1:0))+" person(s) applying besides you)\n"):"";
                    case "Occupying"->server.Occupying(ID[0])?("Location "+count+": "+server.ToString()+"\n"):"";
                    case "Occupied"->(!server.Occupying(ID[0]))&&server.StateStr().equals("Guest-Occupied")?((server.Applying(ID[0])?"(Applying) ":"")+"Location "+count+": "+server.ToString()+"\n"):"";
                    default -> "";
                });
                roomList.addItem(count);
                if(server.Applying(ID[0])||server.Occupying(ID[0])){
                    observers.put(count,new User(count-1,ID[0],server.getCrowdRemote(ID[0])));
                    server.FetchRemote(observers.get(count));
                }
            }catch (Exception ignored){
            }
        }
        if(!Objects.equals(State, "NoMessage")) {
            if (connect == 0) {
                OverallInfo.append("No remote rooms.\n\n");
                System.out.println("No remote rooms found.\n");
            } else {
                OverallInfo.append(connect + " rooms found above.\n\n");
                System.out.println("Scanning complete.\n" + connect + " rooms found.\n");
            }
        }
    }
    private final String version="1.2";

    private final JTextField idTextField;
    private final JTextField crowdTextField;
    private final JTextArea Messenger;
    private final JTextArea Console;
    private final JTextArea Notification;
    private final JTextArea OverallInfo;
    private final JTextArea FilteredInfo;
    private final JButton registerButton;
    private final JButton DisconnectButton;
    private final JButton clearButton;
    private final JButton scanButton;
    private final JButton applyButton;
    private final JButton cancelButton;
    private final JButton endOccuButton;
    private final JButton needRepairButton;
    private final JPanel ItPane;
    private final JComboBox<Integer> roomList=new JComboBox<>();
    private final JComboBox<String> filter;
    private final int[] Application={0};
    private final int[] ID={-1};
    private final int[] Crowd={0};
    private User check=null;
    private final HashMap<Integer, IUser> observers=new HashMap<>();
    private final JLabel selected=new JLabel("N/A");
    private final Color commandFore=new Color(0x449911);
    private final Color commandBack=this.getBackground();
    private final Color commandLostFocus=new Color(0x555555);
    private final Color love=new Color(0xFF69B4);
    private final ArrayList<String> ref=new ArrayList<>(Arrays.asList(
            "connect", "register", "apply", "cancel", "endoccu", "report", "scan", "disconnect","clear",
            "exit", "?", "help", "hello", "bye", "nihao", "zaijian","love", "tell","about"));


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
            case "report":{
                int RoomID=-1;
                if(ID[0]==-1){
                    System.out.println("Please register first.");
                    break;
                }
                try{
                    try {
                        if(com.length<2){
                            if (roomList.getSelectedItem() != null) RoomID = (int) roomList.getSelectedItem();
                        }
                        else if (com[1].equals("this") || com[1].equals("~") || com[1].equals("-") || com[1].equals("room") || com[1].isBlank())
                            if (roomList.getSelectedItem() != null) RoomID = (int) roomList.getSelectedItem();
                            else throw new NumberFormatException();
                        else RoomID = Integer.parseInt(com[1].trim());
                        Notification.setText("");
                        if(observers.get(RoomID)!=null)observers.get(RoomID).RepairReportU(ID[0]);else throw new RuntimeException();
                        System.out.println("Repair reported.");
                    }
                    catch(NumberFormatException e){
                        System.out.println("Input correct room ID.");
                    }
                    catch (ArrayIndexOutOfBoundsException e1){
                        if (roomList.getSelectedItem() != null) RoomID = (int) roomList.getSelectedItem();
                        else throw new NumberFormatException();
                        Notification.setText("");
                        if(observers.get(RoomID)!=null)observers.get(RoomID).RepairReportU(ID[0]);else throw new RuntimeException();
                    }
                }catch (Exception e) {
                    System.out.println("Failed to report repair.");
                }
                break;
            }
            case "cancel":{
                int RoomID;
                if(ID[0]==-1){
                    System.out.println("Please register first.");
                    break;
                }
                try {
                    try {
                        if (com[1].equals("this") || com[1].equals("~") || com[1].equals("-") || com[1].equals("room") || com[1].isBlank()) throw new ArrayIndexOutOfBoundsException();
                        else RoomID = Integer.parseInt(com[1].trim());
                        Notification.setText("");
                        if(observers.get(RoomID)!=null)
                            if (roomList.getSelectedItem() != null) Cancel(RoomID);
                        else throw new NumberFormatException();
                        else throw new RuntimeException();
                    }
                    catch (ArrayIndexOutOfBoundsException e1){
                        if (roomList.getSelectedItem() != null) RoomID = (int) roomList.getSelectedItem();
                        else throw new NumberFormatException();
                        Notification.setText("");
                        if(observers.get(RoomID)!=null)Cancel((int) roomList.getSelectedItem());else throw new RuntimeException();
                    }
                    catch(NumberFormatException e){
                        System.out.println("Input correct room ID.");
                    }
                    catch (Exception e1) {
                        System.out.println("Failed to cancel application, check if you are applying this room.\nif you are occupying, the occupation is ended.");
                        new MessageBox("Failed to cancel application, check if you are applying this room.\nif you are occupying, the occupation is ended.", 600, 120).setVisible(true);
                    }

                }catch(Exception e2){
                    System.out.println("Failed to cancel application, check if you are applying this room.\nif you are occupying, the occupation is ended.");
                    new MessageBox("Failed to cancel application, check if you are applying this room.\nif you are occupying, the occupation is ended.", 600, 120).setVisible(true);
                }
                break;
            }
            case "apply":{
                int RoomID;
                int crowd=-1;
                if(ID[0]==-1){
                    System.out.println("Please register first.");
                    break;
                }
                try {
                    try {
                        try{
                        if(com.length<3)  crowd=Integer.parseInt(crowdTextField.getText().trim());
                        else crowd=Integer.parseInt(com[2].trim());
                        if(crowd<=0)throw new NumberFormatException();
                        }catch(NumberFormatException e){
                            System.out.println("Input correct crowd number.");
                            crowd=-1;
                        }
                        if (com[1].equals("this") || com[1].equals("~") || com[1].equals("-") || com[1].equals("room")) throw new ArrayIndexOutOfBoundsException();
                        else RoomID = Integer.parseInt(com[1].trim());
                        Notification.setText("");
                        Naming.lookup("rmi://127.0.0.1:1099/Remote" + RoomID);
                        Apply(RoomID,ID[0],crowd);
                    }
                    catch (ArrayIndexOutOfBoundsException e1){
                        if (roomList.getSelectedItem() != null) RoomID = (int) roomList.getSelectedItem();
                        else throw new NumberFormatException();
                        Notification.setText("");
                        Naming.lookup("rmi://127.0.0.1:1099/Remote" + RoomID);
                        Apply((int) roomList.getSelectedItem(),ID[0],crowd);
                    }
                    catch(NumberFormatException ex){
                        System.out.println("Input correct room ID.");
                    }
                    catch (IllegalCrowdException ex1){
                        System.out.println("Illegal number of people.");

                    }catch(Exception ex3){
                        System.out.println("Failed to submit application, try again later.");
                        new MessageBox("Failed to submit application, try again later.",400,100).setVisible(true);
                    }

                }catch(Exception ex3){
                    System.out.println("Failed to submit application, try again later.");
                    new MessageBox("Failed to submit application, try again later.",400,100).setVisible(true);
                }
                break;
            }
            case "endoccu":{
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
                        if(observers.get(RoomID)!=null)observers.get(RoomID).EndOccupying(ID[0]);else throw new RuntimeException();
                    }
                    catch(NumberFormatException e){
                        System.out.println("Input correct room ID.");
                    }
                    catch (ArrayIndexOutOfBoundsException e1){
                        if (roomList.getSelectedItem() != null) RoomID = (int) roomList.getSelectedItem();
                        else throw new NumberFormatException();
                        Notification.setText("");
                        if(observers.get(RoomID)!=null)observers.get(RoomID).EndOccupying(ID[0]);else throw new RuntimeException();
                    }
                }catch (Exception e) {
                    System.out.println("Failed to end occupying.");
                }
                break;
            }
            case "clear":{
                clearButton.doClick();
                break;
            }
            case "scan":{
                try{
                    if(com.length>1){
                        if (Objects.equals(com[1], "?")) System.out.println("""
                                help for scan:
                                "nofilter","0"->"No filter"
                                "applying","1"->"Applying"
                                "occupying","2"->"Occupying"
                                "available","3"-> "Available"
                                "occupied","4"->"Occupied\"""");
                        else filter.setSelectedItem(switch (com[1]){
                            case "nofilter","0"->"-Select filter-";
                            case "applying","1"->"Applying";
                            case "occupying","2"->"Occupying";
                            case "available","3"-> "Available";
                            case "occupied","4"->"Occupied";
                            default -> new RuntimeException();
                        });
                    }
                    scanButton.doClick();
                }catch(Exception e){
                    System.out.println("Input correct filter");
                }
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
                    new MessageBox("Love is invaluable.\n\nRoom Management System (User Client)\nversion "+version+"\n(C)Vincent C. All rights reserved.",400,240).setVisible(true);
                }
                else new MessageBox("Room Management System (User Client)\nversion "+version+"\n(C)Vincent C. All rights reserved.",400,240).setVisible(true);
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



    private class ExWindowListener extends WindowAdapter{
        @Override
        public void windowClosing(WindowEvent e) {
            super.windowClosing(e);
            try {
                if(check!=null)check.DisconnectFromHello();
                System.exit(0);
            } catch (Exception ex) {
                System.exit(-1);
            }
        }

    }

    public UserClient() {
        // Default Fonts
        Font fnt = new Font("微软雅黑", Font.PLAIN, 11);
        Font fntBld = new Font("微软雅黑", Font.BOLD, 11);
        Font fntCons = new Font("Consolas", Font.PLAIN, 12);
        Font fntConsL = new Font("Consolas", Font.PLAIN, 14);
        // Title
        setTitle("UserClient");

        // Size of the form
        setSize(960, 540);
        setMinimumSize(new Dimension(960,540));
        this.setLocationRelativeTo(null);

        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        addWindowListener(new ExWindowListener());

        // Overall Layout
        setLayout(new BorderLayout());

        // Button Panel
        JPanel buttonPanel = new JPanel();
        buttonPanel.setLayout(new GridLayout(1,3));

        // Action Panel
        JPanel actionPanel=new JPanel();
        actionPanel.setLayout(new GridLayout(3,1));
        actionPanel.setVisible(false);

        JPanel ChooseARoom=new JPanel();
        ChooseARoom.setLayout(new FlowLayout(FlowLayout.CENTER));
        actionPanel.add(ChooseARoom);
        ChooseARoom.add(new JLabel("Room Loc:"));

        JPanel RoomNameL=new JPanel();
        RoomNameL.setLayout(new FlowLayout(FlowLayout.CENTER));
        actionPanel.add(RoomNameL);

        JPanel Actions=new JPanel();
        Actions.setLayout(new GridLayout(1,4));
        actionPanel.add(Actions);

        // RoomList ComboBox
        ChooseARoom.add(roomList);
        roomList.setEnabled(true);
        roomList.setFont(fnt);
        roomList.setVisible(true);
        roomList.addItemListener(new ItemListener() {
            @Override
            public void itemStateChanged(ItemEvent e) {
                try {
                    if(roomList.getSelectedItem()!=null){
                        RoomMonitorWithAppliers server = (RoomMonitorWithAppliers) Naming.lookup("rmi://127.0.0.1:1099/Remote" + roomList.getSelectedItem());
                        selected.setText(server.ToString());
                        applyButton.setEnabled(!server.Applying(ID[0]) && !server.Occupying(ID[0]));
                        cancelButton.setEnabled(!applyButton.isEnabled());
                        endOccuButton.setEnabled(server.Occupying(ID[0]));
                        needRepairButton.setEnabled(!Objects.equals(server.StateStr(), "Needs Repairing"));
                    }
                } catch (Exception ex) {
                    throw new RuntimeException(ex);
                }
            }
        });

        ChooseARoom.add(new JLabel("  Crowd:"));

        // Crowd TextField
        crowdTextField = new JTextField(3);
        ChooseARoom.add(crowdTextField);
        crowdTextField.setFont(fnt);

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

        // Register Button
        registerButton = new JButton("Register");
        registerButton.setFont(fntBld);
        inputPanel.add(registerButton);
        registerButton.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                Notification.setText("");
                if(!observers.isEmpty()){
                    observers.clear();
                }
                try {
                    ID[0] = Integer.parseInt(idTextField.getText().trim());
                    if(ID[0]<=0)throw new NumberFormatException();
                    check=new User("rmi://127.0.0.1:1099/Remote0",ID[0]);
                    if(check.isDup())throw new DuplicationException("id already exist.");
                    Messenger.append("Confirmed id: " + ID[0] + "\n");
                    registerButton.setVisible(false);
                    idTextField.setEditable(false);
                    DisconnectButton.setVisible(true);
                    actionPanel.setVisible(true);
                    Scanning("");
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

        // Disconnect Button
        DisconnectButton = new JButton("Disconnect");
        DisconnectButton.setFont(fntBld);
        inputPanel.add(DisconnectButton);
        DisconnectButton.setVisible(false);
        DisconnectButton.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                Notification.setText("");
                try {
                    ConfirmDialog c=new ConfirmDialog("Disconnect "+ID[0]+" from the server?",400,100);
                    c.setVisible(true);
                    if(!c.isOK())return;
                    Scanning("NoMessage");
                    check.DisconnectFromHello();
                    if(!observers.isEmpty()){
                        for(Map.Entry<Integer, IUser> observer:observers.entrySet()){
                            observer.getValue().userDisconnect(ID[0]);
                        }
                        observers.clear();
                    }
                    Application[0]=0;
                    idTextField.setText(String.valueOf(ID[0]));
                    ID[0]=-1;
                    crowdTextField.setText("");
                    Console.setText("");
                    FilteredInfo.setText("");
                    DisconnectButton.setVisible(false);
                    registerButton.setVisible(true);
                    idTextField.setEditable(true);
                    Messenger.setText("Disconnected from the server.\n");
                    OverallInfo.setText("");
                    actionPanel.setVisible(false);
                } catch (Exception ex) {
                    Messenger.setText("Failed to disconnect, try again later.");
                    new MessageBox("Failed to disconnect, try again later.",400,100).setVisible(true);
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
        JTextField commandInputBox=new JTextField("Input commands...");
        commandInputBox.setFont(fntConsL);
        commandInputBox.setForeground(commandLostFocus);
        commandInputBox.setBackground(commandBack);
        commandInputBox.setBorder(BorderFactory.createLineBorder(Color.BLACK,0));
        commandInputBox.setMinimumSize(new Dimension(0,50));commandInputBox.addKeyListener(new KeyAdapter() {
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
        Console.setBorder(BorderFactory.createLineBorder(Color.BLACK,0));
        Console.setBackground(new Color(0x181818));
        Console.setForeground(new Color(0xe0e0e0));
        Console.append("Input your id.\n");
        Console.setVisible(true);

        // OverallInfo
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


        // Message
        Messenger = new JTextArea("");
        Messenger.setEditable(true); // Readonly
        Messenger.getDocument().addDocumentListener(new DocumentListener() {
            @Override
            public void insertUpdate(DocumentEvent e) {
                try {
                    if(ID[0]!=-1)Scanning("NoMessage");
                }
                catch(Exception ignored){
                }
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

        // Filter ComboBox
        filter=new JComboBox<>(new String[]{"-Select filter-","Applying","Occupying","Available","Occupied"});
        filter.setFont(fnt);
        buttonPanel.add(filter);
        filter.addItemListener(e -> {
            try {
                Scanning("NoMessage");
            } catch (MalformedURLException | NotBoundException | RemoteException ignored) {
            }
        });

        // Scan Button
        scanButton=new JButton("Scan");
        scanButton.setFont(fntBld);
        scanButton.addActionListener(e -> {
            Notification.setText("");
            try {
                Scanning("");
            } catch (MalformedURLException | RemoteException | NotBoundException ex) {
                throw new RuntimeException(ex);
            }
        });
        buttonPanel.add(scanButton);


        // Apply Button
        applyButton = new JButton("Apply");
        applyButton.setFont(fntBld);
        applyButton.addActionListener(e -> {
            try {
                Crowd[0] = Integer.parseInt(crowdTextField.getText().trim());
                if(roomList.getSelectedItem()==null)throw new RuntimeException();
                int i=(int)roomList.getSelectedItem();
                Apply(i,ID[0], Crowd[0]);
            }catch (NumberFormatException ex1){
                System.out.println("Illegal number of people.");
                new MessageBox("Illegal number of people.",400,100).setVisible(true);
            }catch(Exception ex3){
                System.out.println("Failed to submit application, try again later.");
                new MessageBox("Failed to submit application, try again later.",400,100).setVisible(true);
            }
        });
        Actions.add(applyButton);

        // Cancel Button
        cancelButton = new JButton("Cancel");
        cancelButton.setFont(fntBld);
        cancelButton.addActionListener(e -> {
            try{
            if(roomList.getSelectedItem()!=null) Cancel((int)roomList.getSelectedItem());
            else throw new RuntimeException();
            }
            catch(Exception e1){
                System.out.println("Failed to cancel application, check if you are applying this room.\nif you are occupying, the occupation is ended.");
                new MessageBox("Failed to cancel application, check if you are applying this room.\nif you are occupying, the occupation is ended.",600,120).setVisible(true);
            }
        });
        Actions.add(cancelButton);

        // End Occupying Button
        endOccuButton = new JButton("End Occupying");
        endOccuButton.setFont(fntBld);
        endOccuButton.addActionListener(e -> {
            Notification.setText("");
            try {
                ConfirmDialog c=new ConfirmDialog("End occupying Room #"+roomList.getSelectedItem()+"?\nRoom info: "+selected.getText()+"\nThe room will be cleaned before it's available again.",600,160);
                c.setVisible(true);
                if(!c.isOK())return;
                if(roomList.getSelectedItem()==null)throw new RuntimeException();
                observers.get((int)roomList.getSelectedItem()).EndOccupying(ID[0]);
                observers.remove((int)roomList.getSelectedItem());
                Scanning("NoMessage");
                new MessageBox("Ended Occupying.",400,100).setVisible(true);
            } catch (Exception ex) {
                System.out.println("Failed to end occupying, contact the supporters.");
                new MessageBox("Failed to end occupying, contact the supporters.",400,100).setVisible(true);
            }
        });
        Actions.add(endOccuButton);

        // NeedRepair Button
        needRepairButton = new JButton("Repair Report");
        needRepairButton.setFont(fntBld);
        needRepairButton.addActionListener(e -> {
            Notification.setText("");
            try {
                ConfirmDialog c=new ConfirmDialog("Report repair for Room #"+roomList.getSelectedItem()+"?\nRoom info: "+selected.getText(),600,140);
                c.setVisible(true);
                if(!c.isOK())return;
                if(roomList.getSelectedItem()!=null)
                    if(observers.get((int)roomList.getSelectedItem())!=null)
                        observers.get((int)roomList.getSelectedItem()).RepairReportU(ID[0]);
                else throw new NullPointerException();
                else throw new NullPointerException();
                System.out.println("Repair reported.");
            } catch (Exception ex) {
                System.out.println("Repair reporting failed.");
            }
        });
        Actions.add(needRepairButton);


        // Redirect "System.out" to "TextArea"
        System.setOut(new PrintStream(new JTextAreaOutputStream(Messenger)));
    }

    private void Apply(int roomId,int id,int crowd) {
        Notification.setText("");
        try {
            ConfirmDialog c=new ConfirmDialog("You are applying Room #"+roomList.getSelectedItem()+"\nRoom info: "+selected.getText()+"\nContinue?",600,160);
            c.setVisible(true);
            if(!c.isOK()) return;
            if(Application[0]>=5)throw new TooManyApplicationsException();
            RoomMonitor server=(RoomMonitor) Naming.lookup("rmi://127.0.0.1:1099/Remote"+roomId);
            if(crowd<=0||crowd>server.Capacity())throw new IllegalCrowdException();
            observers.put(roomId,new User(roomId-1,id,crowd));
            Application[0]++;
            Scanning("NoMessage");
            new MessageBox("Application submitted.",400,100).setVisible(true);
        } catch (IllegalCrowdException ex1){
            System.out.println("Illegal number of people.");
            new MessageBox("Illegal number of people.",400,100).setVisible(true);
        }catch (TooManyApplicationsException ex2){
            System.out.println("You have reached the bound of your quota for applications, scan or wait a while.");
            new MessageBox("You have reached the bound of your quota for applications. \nScan or wait a while.",600,100).setVisible(true);
        }catch(AlreadyAppliedException exx){
            System.out.println("You have already applied for this room.");
            new MessageBox("You have already applied for this room.",400,100).setVisible(true);
        }catch(Exception ex3){
            System.out.println("Failed to submit application, try again later.");
            new MessageBox("Failed to submit application, try again later.",400,100).setVisible(true);
        }
    }

    private void Cancel(int RoomID) {
        Notification.setText("");
        try {
            if(observers.get(RoomID)==null)throw new NullPointerException();
            RoomMonitor server=(RoomMonitor) Naming.lookup("rmi://127.0.0.1:1099/Remote"+RoomID);
            ConfirmDialog c=new ConfirmDialog("Cancel your application for Room #"+RoomID+" ?\nRoom info: "+server.ToString(),600,140);
            c.setVisible(true);
            if(!c.isOK()) return;
            observers.get(RoomID).userCancel(ID[0]);
            observers.remove(RoomID);
            Application[0]--;
            Scanning("NoMessage");
            System.out.println("Application canceled.");
            new MessageBox("Application canceled.",400,100).setVisible(true);
        } catch (NotBoundException ex) {
            System.out.println("Application canceled, but an exception occurs when scanning.");
            new MessageBox("Application canceled, but an exception occurs when scanning.",400,100).setVisible(true);
        }catch (Exception ex) {
            System.out.println("Failed to cancel application, check if you are applying this room.\nif you are occupying, the occupation is ended.");
            new MessageBox("Failed to cancel application, check if you are applying this room.\nif you are occupying, the occupation is ended.",600,120).setVisible(true);
        }

    }
    private void help(){
        new MessageBox("""
                register/connect <your id>   (register as <id>)
                disconnect   (disconnect current user from server)
                scan <filter>   (refresh the room list, input "scan ?" for more info)
                clear   (clear the console)
                apply <room id> <number of crowd>   (apply for a room)
                cancel <room id>   (cancel your application for a room)
                endoccu <room id>   (end occupying a room, usually after using)
                report <room id>   (report a room for repairing)
                exit   (close the client)
                help(or ?)   (show help, like this)
                "this", "~", "-", "room" represents for the room you are choosing.
                you can omit the last parameter to auto-fill.""",500,300).setVisible(true);
        System.out.println("""
                Help:
                register/connect <your id>   (register as <id>)
                disconnect   (disconnect current user from server)
                scan <filter>   (refresh the room list, input "scan ?" for more info)
                clear   (clear the console)
                apply <room id> <number of crowd>   (apply for a room)
                cancel <room id>   (cancel your application for a room)
                endoccu <room id>   (end occupying a room, usually after using)
                report <room id>   (report a room for repairing)
                exit   (close the client)
                help(or ?)   (show help, like this)
                "this", "~", "-", "room" represents for the room you are choosing.
                you can omit the last parameter to auto-fill.""");
    }


    public static void main(String[] args) {
        System.setProperty("sun.rmi.transport.tcp.responseTimeout", "7000");

        ///Optional, if not work, delete it and its dependency.
        try {
        UIManager.setLookAndFeel( new FlatLightLaf());
        } catch( Exception ex ) {
            System.err.println( "Failed to initialize LaF" );
        }


        // Safely Run
        SwingUtilities.invokeLater(() -> new UserClient().setVisible(true));
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


