import com.formdev.flatlaf.FlatLightLaf;

import javax.swing.*;
import java.awt.*;
import java.awt.event.*;
import java.io.IOException;
import java.io.OutputStream;
import java.io.PrintStream;
import java.net.MalformedURLException;
import java.rmi.Naming;
import java.rmi.NotBoundException;
import java.rmi.RemoteException;
import java.text.MessageFormat;
import java.util.*;

@SuppressWarnings("FieldCanBeLocal")
public class UserClient extends ClientFrame implements Command{
    private final JTextField crowdTextField;
    private final JButton applyButton;
    private final JButton cancelButton;
    private final JButton endOccuButton;
    private final JButton needRepairButton;
    private final JComboBox<String> filter;
    private final int[] Application={0};
    private final int[] Crowd={0};
    private User check=null;
    private final HashMap<Integer, IUser> observers=new HashMap<>();
    private final ArrayList<String> ref=new ArrayList<>(Arrays.asList(
            "connect", "register", "apply", "cancel", "endoccu", "report", "scan", "disconnect","clear",
            "exit", "?", "help", "hello", "bye", "nihao", "zaijian","love", "tell","about","light","dark"));

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
        // Title
        setTitle("RoomX - UserClient");

        // Exit Operation
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        addWindowListener(new ExWindowListener());

        Actions.setLayout(new GridLayout(1,4));

        // RoomList ComboBox Function
        roomList.addItemListener(new ItemListener() {
            @Override
            public void itemStateChanged(ItemEvent e) {
                try {
                    if(roomList.getSelectedItem()!=null){
                        RoomMonitorWithAppliers server = (RoomMonitorWithAppliers) Naming.lookup("rmi://"+loc+"/Remote" + roomList.getSelectedItem());
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

        JLabel CrowdTip=new JLabel("  Crowd:");
        CrowdTip.setFont(PresFont.fntDisplay);
        ChooseARoom.add(CrowdTip);

        // Crowd TextField
        crowdTextField = new JTextField(3);
        ChooseARoom.add(crowdTextField);
        crowdTextField.setFont(PresFont.fntText);


        // Register Button Function
        registerButton.addActionListener(e -> clientRegister());

        // Disconnect Button Function
        DisconnectButton.addActionListener(e -> clientDisconnect(true));

        // Clear Button
        buttonPanel.add(clearButton);

        // Filter ComboBox
        filter=new JComboBox<>(new String[]{"-"+bundle.getString("selectFilter")+"-",bundle.getString("applying"),bundle.getString("occupying"),bundle.getString("available"),bundle.getString("occupied")});
        filter.setFont(PresFont.fntText);
        buttonPanel.add(filter);
        filter.addItemListener(e -> {
            try {
                scanning("NoMessage");
            } catch (MalformedURLException | NotBoundException | RemoteException ignored) {
            }
        });

        // Scan Button
        scanButton.addActionListener(e -> {
            Notification.setText("");
            try {
                scanning("");
            } catch (MalformedURLException | RemoteException | NotBoundException ex) {
                throw new RuntimeException(ex);
            }
        });
        buttonPanel.add(scanButton);


        // Apply Button
        applyButton = new JButton(bundle.getString("applyRoom"));
        applyButton.setFont(PresFont.fntBld);
        applyButton.addActionListener(e -> {
            try {
                Crowd[0] = Integer.parseInt(crowdTextField.getText().trim());
                if(roomList.getSelectedItem()==null)throw new RuntimeException();
                int i=(int)roomList.getSelectedItem();
                apply(i,ID[0], Crowd[0]);
            }catch (NumberFormatException ex1){
                System.out.println(bundle.getString("illegalCrowdTip"));
                new MessageBox(bundle.getString("illegalCrowdTip"),400,100).setVisible(true);
            }catch(Exception ex3){
                System.out.println(bundle.getString("applyFail"));
                new MessageBox(bundle.getString("applyFail"),400,100).setVisible(true);
            }
        });
        Actions.add(applyButton);

        // Cancel Button
        cancelButton = new JButton(bundle.getString("cancelRoom"));
        cancelButton.setFont(PresFont.fntBld);
        cancelButton.addActionListener(e -> {
            try{
                if(roomList.getSelectedItem()!=null) cancel((int)roomList.getSelectedItem());
                else throw new RuntimeException();
            }
            catch(Exception e1){
                System.out.println(bundle.getString("cancelFail"));
                new MessageBox(bundle.getString("cancelFail"),600,120).setVisible(true);
            }
        });
        Actions.add(cancelButton);

        // End Occupying Button
        endOccuButton = new JButton(bundle.getString("endOccu"));
        endOccuButton.setFont(PresFont.fntBld);
        endOccuButton.addActionListener(e -> {
            Notification.setText("");
            try {
                ConfirmDialog c=new ConfirmDialog("End occupying Room #"+roomList.getSelectedItem()+"?\nRoom info: "+selected.getText()+"\nThe room will be cleaned before it's available again.",600,160);
                c.setVisible(true);
                if(!c.isOK())return;
                if(roomList.getSelectedItem()==null)throw new RuntimeException();
                observers.get((int)roomList.getSelectedItem()).EndOccupying(ID[0]);
                observers.remove((int)roomList.getSelectedItem());
                scanning("NoMessage");
                new MessageBox(bundle.getString("endOccuSuc"),400,100).setVisible(true);
            } catch (Exception ex) {
                System.out.println(bundle.getString("endOccuFail"));
                new MessageBox(bundle.getString("endOccuFail"),400,100).setVisible(true);
            }
        });
        Actions.add(endOccuButton);

        // NeedRepair Button
        needRepairButton = new JButton(bundle.getString("repReport"));
        needRepairButton.setFont(PresFont.fntBld);
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
                System.out.println(bundle.getString("repReportSuc"));
            } catch (Exception ex) {
                System.out.println(bundle.getString("repReportFail"));
            }
        });
        Actions.add(needRepairButton);


        // Redirect "System.out" to "TextArea"
        System.setOut(new PrintStream(new JTextAreaOutputStream(Messenger)));

        // themed-paint
        try{
            paintTheme();}
        catch (Exception e){
            System.out.println(bundle.getString("setThemeFail"));
        }
    }

    @Override
    public void scanning(String State) throws MalformedURLException, NotBoundException, RemoteException {
        RoomMonitorWithAppliers server;
        int count=0;
        int connect=0;
        Application[0]=0;
        if(!observers.isEmpty())observers.clear();
        roomList.removeAllItems();
        System.gc(); //Initialize the observers.
        OverallInfo.clear();
        FilteredInfo.clear();
        FilteredInfo.setTitle(filter.getSelectedIndex()!=0?bundle.getString("filterTip")+" "+ filter.getSelectedItem():bundle.getString("noFilter"));
        if(ID[0]==-1){
            OverallInfo.add(-1,"null",bundle.getString("noCertification"),e->{});
            FilteredInfo.add(-1,"null",bundle.getString("noCertification"),e->{});
            new MessageBox(bundle.getString("noCertification"),400,100).setVisible(true);
            return;
        }
        for(int i=0;i<100;i++){
            try{
                count++;
                int finalCount=count;
                server = (RoomMonitorWithAppliers) Naming.lookup("rmi://"+loc+"/Remote" + (count));
                connect++;
                boolean applying=server.Applying(ID[0]),
                        occupying=server.Occupying(ID[0]),
                        occupied=server.StateStr().equals("Guest-Occupied")&&!occupying,
                        available=server.StateStr().equals("Empty, Clean")&&!applying;
                Application[0]+=applying?1:0;
                String info="Location "+count+": "+server.NameStr()+"\n"+
                        "Capacity: "+server.Capacity()+"("+server.TypeStr()+")\n"+
                        "State: "+server.StateStr()+"  "+(occupying?"Occupying, ":"")+(applying||occupying?((server.NumberOfAppliers()-1)+" appliers besides you"):"");
                if(occupying) {
                    OverallInfo.add(count,"Occupying",MessageFormat.format(bundle.getString("itemInfo"),count,server.NameStr(),server.TypeStr())+")", e->{
                        try{
                            roomList.setSelectedItem(finalCount);
                            new MessageBox(info,600,140).setVisible(true);
                            FilteredInfo.uniqueSelect(finalCount);
                        }catch(Exception ignored){}
                    });
                }
                else if(applying) {
                    OverallInfo.add(count,server.getReserved() == ID[0] ? "Reserved" : "Applying",MessageFormat.format(bundle.getString("itemInfo"),count,server.NameStr(),server.TypeStr())+")", e-> {
                        try {
                            roomList.setSelectedItem(finalCount);
                            new MessageBox(info, 600, 140).setVisible(true);
                            FilteredInfo.uniqueSelect(finalCount);
                        } catch (Exception ignored) {
                        }
                    });
                }
                else{
                    OverallInfo.add(count,"",MessageFormat.format(bundle.getString("itemInfo"),count,server.NameStr(),server.TypeStr())+")", e-> {
                        try {
                            roomList.setSelectedItem(finalCount);
                            new MessageBox(info, 600, 140).setVisible(true);
                            FilteredInfo.uniqueSelect(finalCount);
                        } catch (Exception ignored) {
                        }
                    });
                }
                switch(filter.getSelectedIndex()){
                    case 3:{
                        if(available){
                            FilteredInfo.add(count,"", MessageFormat.format(bundle.getString("itemInfo"),count,server.NameStr(),server.TypeStr())+")", e-> {
                                try {
                                    roomList.setSelectedItem(finalCount);
                                    new MessageBox(info, 600, 140).setVisible(true);
                                    OverallInfo.uniqueSelect(finalCount);
                                } catch (Exception ignored) {
                                }
                            });
                        }
                        break;
                    }
                    case 2:{
                        if(occupying){
                            FilteredInfo.add(count,"",MessageFormat.format(bundle.getString("itemInfo"),count,server.NameStr(),server.TypeStr())+")", e-> {
                                try {
                                    roomList.setSelectedItem(finalCount);
                                    new MessageBox(info, 600, 140).setVisible(true);
                                    OverallInfo.uniqueSelect(finalCount);
                                } catch (Exception ignored) {
                                }
                            });
                        }
                        break;
                    }
                    case 4:{
                        if(occupied){
                            FilteredInfo.add(count,"",MessageFormat.format(bundle.getString("itemInfo"),count,server.NameStr(),server.TypeStr())+")", e-> {
                                try {
                                    roomList.setSelectedItem(finalCount);
                                    new MessageBox(info, 600, 140).setVisible(true);
                                    OverallInfo.uniqueSelect(finalCount);
                                } catch (Exception ignored) {
                                }
                            });
                        }
                        break;
                    }
                    case 1:{
                        if(applying){
                            FilteredInfo.add(count,"",MessageFormat.format(bundle.getString("itemInfo"),count,server.NameStr(),server.TypeStr())+")", e-> {
                                try {
                                    roomList.setSelectedItem(finalCount);
                                    new MessageBox(info, 600, 140).setVisible(true);
                                    OverallInfo.uniqueSelect(finalCount);
                                } catch (Exception ignored) {
                                }
                            });
                        }
                        break;
                    }
                    default:{
                    }
                }
                roomList.addItem(count);
                if(applying||occupying){
                    observers.put(count,new User(count-1,ID[0],server.getCrowdRemote(ID[0]),loc));
                    server.FetchRemote(observers.get(count));
                }
            }catch (Exception ignored){
            }
        }
        if(!Objects.equals(State, "NoMessage")) {
            if (connect == 0) {
                OverallInfo.add(count,"null",bundle.getString("noRooms"), e-> {});
                System.out.println("No remote rooms found.\n");
            } else {
                OverallInfo.setTitle("Overall: "+connect+" rooms");
                System.out.println("Scanning complete.\n" + connect + " rooms found.\n");
            }
        }
    }

    @Override
    protected void clientRegister() {
        Notification.setText("");
        if(!observers.isEmpty()){
            observers.clear();
        }
        try {
            ID[0] = Integer.parseInt(idTextField.getText().trim());
            if(ID[0]<=0)throw new NumberFormatException();
            check=new User("rmi://"+loc+"/Remote0",ID[0]);
            if(check.isDup())throw new DuplicationException("id already exist.");
            Messenger.append("Confirmed id: " + ID[0] + "\n");
            idTextField.setEditable(false);
            actionPanel.setVisible(true);
            scanning("");
            idLabelIn.setText("Welcome back, User #"+ID[0]+"!");
            TextPane.setVisible(true);
            inputPanel.setVisible(false);
            add(TextPane, BorderLayout.CENTER);
            menu.setVisible(true);
            SwingUtilities.updateComponentTreeUI(TextPane);
        } catch (NumberFormatException ex1) {
            Messenger.append("Illegal id.\n");
            new MessageBox("Illegal id.",400,100).setVisible(true);
            ID[0]=-1;
        }
        catch(NotBoundException | IOException ex2){
            ID[0]=-1;
            Messenger.append("Failed to connect to the remote server.\n");
            new MessageBox("Connection Failed","Failed to connect to the remote server.",400,100,"Connection Settings...",e->Load("Account")).setVisible(true);
        }
        catch(DuplicationException ex3){
            Messenger.append("id already exist.");
            new MessageBox("Id already exist.",400,100).setVisible(true);
            ID[0]=-1;
            check=null;
        }
    }

    @Override
    protected void clientDisconnect(boolean NeedConfirm) {
        Notification.setText("");
        try {
            if(NeedConfirm) {
                ConfirmDialog c = new ConfirmDialog("Disconnect " + ID[0] + " from the server?", 400, 100);
                c.setVisible(true);
                if (!c.isOK()) return;
            }
            scanning("NoMessage");
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
            idTextField.setEditable(true);
            Messenger.setText("Disconnected from the server.\n");
            OverallInfo.clear();
            FilteredInfo.clear();
            OverallInfo.setTitle("Overall:");
            FilteredInfo.setTitle("Filtered:");
            actionPanel.setVisible(false);
            TextPane.setVisible(false);
            inputPanel.setVisible(true);
            add(inputPanel,BorderLayout.CENTER);
            menu.setVisible(false);
            SwingUtilities.updateComponentTreeUI(inputPanel);
        } catch (Exception ex) {
            Messenger.setText("Failed to disconnect, try again later.");
            new MessageBox("Failed to disconnect, try again later.",400,100).setVisible(true);
        }
    }

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
                clientRegister();
                break;
            }
            case "report":{
                int RoomID=-1;
                if(ID[0]==-1){
                    System.out.println(bundle.getString("needRegister"));
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
                        System.out.println(bundle.getString("repReportSuc"));
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
                    System.out.println(bundle.getString("repReportFail"));
                }
                break;
            }
            case "cancel":{
                int RoomID;
                if(ID[0]==-1){
                    System.out.println(bundle.getString("needRegister"));
                    break;
                }
                try {
                    try {
                        if (com[1].equals("this") || com[1].equals("~") || com[1].equals("-") || com[1].equals("room") || com[1].isBlank()) throw new ArrayIndexOutOfBoundsException();
                        else RoomID = Integer.parseInt(com[1].trim());
                        Notification.setText("");
                        if(observers.get(RoomID)!=null)
                            if (roomList.getSelectedItem() != null) cancel(RoomID);
                        else throw new NumberFormatException();
                        else throw new RuntimeException();
                    }
                    catch (ArrayIndexOutOfBoundsException e1){
                        if (roomList.getSelectedItem() != null) RoomID = (int) roomList.getSelectedItem();
                        else throw new NumberFormatException();
                        Notification.setText("");
                        if(observers.get(RoomID)!=null) cancel((int) roomList.getSelectedItem());else throw new RuntimeException();
                    }
                    catch(NumberFormatException e){
                        System.out.println("Input correct room ID.");
                    }
                    catch (Exception e1) {
                        System.out.println(bundle.getString("cancelFail"));
                        new MessageBox(bundle.getString("cancelFail"), 600, 120).setVisible(true);
                    }

                }catch(Exception e2){
                    System.out.println(bundle.getString("cancelFail"));
                    new MessageBox(bundle.getString("cancelFail"), 600, 120).setVisible(true);
                }
                break;
            }
            case "apply":{
                int RoomID;
                int crowd=-1;
                if(ID[0]==-1){
                    System.out.println(bundle.getString("needRegister"));
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
                        Naming.lookup("rmi://"+loc+"/Remote" + RoomID);
                        apply(RoomID,ID[0],crowd);
                    }
                    catch (ArrayIndexOutOfBoundsException e1){
                        if (roomList.getSelectedItem() != null) RoomID = (int) roomList.getSelectedItem();
                        else throw new NumberFormatException();
                        Notification.setText("");
                        Naming.lookup("rmi://"+loc+"/Remote" + RoomID);
                        apply((int) roomList.getSelectedItem(),ID[0],crowd);
                    }
                    catch(NumberFormatException ex){
                        System.out.println("Input correct room ID.");
                    }
                    catch (IllegalCrowdException ex1){
                        System.out.println(bundle.getString("illegalCrowdTip"));

                    }catch(Exception ex3){
                        System.out.println(bundle.getString("applyFail"));
                        new MessageBox(bundle.getString("applyFail"),400,100).setVisible(true);
                    }

                }catch(Exception ex3){
                    System.out.println(bundle.getString("applyFail"));
                    new MessageBox(bundle.getString("applyFail"),400,100).setVisible(true);
                }
                break;
            }
            case "endoccu":{
                int RoomID;
                if(ID[0]==-1){
                    System.out.println(bundle.getString("needRegister"));
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
                                "nofilter","0"->"noFilter"
                                "applying","1"->"Applying"
                                "occupying","2"->"Occupying"
                                "available","3"-> "Available"
                                "occupied","4"->"Occupied\"""");
                        else filter.setSelectedIndex(switch (com[1]){
                            case "applying","1"->1;
                            case "occupying","2"->2;
                            case "available","3"->3;
                            case "occupied","4"->4;
                            default -> 0;
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
                    System.out.println(bundle.getString("needRegister"));
                    break;
                }
                clientDisconnect(true);
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
                about(com.length>=2&&com[1].equals("love"));
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
                            RoomMonitor server=(RoomMonitor) Naming.lookup("rmi://"+loc+"/Remote0");
                            server.Tells();
                        } catch (NotBoundException | MalformedURLException | RemoteException ignored) {
                        }
                    }
                }
                break;
            }
            case "light":{
                if(LightDarkMode.isDark())switchLD();else System.out.println("Already using light theme!");
                break;
            }
            case "dark":{
                if(!LightDarkMode.isDark())switchLD();else System.out.println("Already using dark theme!");
                break;
            }
            default:{
                System.out.println("Incorrect command.");
            }
        }
    }

    private void apply(int roomId, int id, int crowd) {
        Notification.setText("");
        try {
            ConfirmDialog c=new ConfirmDialog("You are applying Room #"+roomList.getSelectedItem()+"\nRoom info: "+selected.getText()+"\nContinue?",640,160);
            c.setVisible(true);
            if(!c.isOK()) return;
            if(Application[0]>=5)throw new TooManyApplicationsException();
            RoomMonitor server=(RoomMonitor) Naming.lookup("rmi://"+loc+"/Remote"+roomId);
            if(crowd<=0||crowd>server.Capacity())throw new IllegalCrowdException();
            observers.put(roomId,new User(roomId-1,id,crowd,loc));
            Application[0]++;
            scanning("NoMessage");
            new MessageBox("Application submitted.",400,100).setVisible(true);
        } catch (IllegalCrowdException ex1){
            System.out.println(bundle.getString("illegalCrowdTip"));
            new MessageBox(bundle.getString("illegalCrowdTip"),400,100).setVisible(true);
        }catch (TooManyApplicationsException ex2){
            System.out.println("You have reached the bound of your quota for applications, scan or wait a while.");
            new MessageBox("You have reached the bound of your quota for applications. \nScan or wait a while.",600,100).setVisible(true);
        }catch(AlreadyAppliedException exx){
            System.out.println("You have already applied for this room.");
            new MessageBox("You have already applied for this room.",400,100).setVisible(true);
        }catch(Exception ex3){
            System.out.println(bundle.getString("applyFail"));
            new MessageBox(bundle.getString("applyFail"),400,100).setVisible(true);
        }
    }

    private void cancel(int RoomID) {
        Notification.setText("");
        try {
            if(observers.get(RoomID)==null)throw new NullPointerException();
            RoomMonitor server=(RoomMonitor) Naming.lookup("rmi://"+loc+"/Remote"+RoomID);
            ConfirmDialog c=new ConfirmDialog("Cancel your application for Room #"+RoomID+" ?\nRoom info: "+server.ToString(),640,140);
            c.setVisible(true);
            if(!c.isOK()) return;
            observers.get(RoomID).userCancel(ID[0]);
            observers.remove(RoomID);
            Application[0]--;
            scanning("NoMessage");
            System.out.println("Application canceled.");
            new MessageBox("Application canceled.",400,100).setVisible(true);
        } catch (NotBoundException ex) {
            System.out.println("Application canceled, but an exception occurs when scanning.");
            new MessageBox("Application canceled, but an exception occurs when scanning.",400,100).setVisible(true);
        }catch (Exception ex) {
            System.out.println(bundle.getString("cancelFail"));
            new MessageBox(bundle.getString("cancelFail"),600,120).setVisible(true);
        }

    }

    @Override
    protected void help(){
        new MessageBox("Command Help","""
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
                light/dark   (set light/dark theme)
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
                light/dark   (set light/dark theme)
                "this", "~", "-", "room" represents for the room you are choosing.
                you can omit the last parameter to auto-fill.""");
    }

    @Override
    protected void about(boolean love) {
        new MessageBox("About",(love?"Love is invaluable.\n\n":"")+"RoomX (User Client)\nversion "+version+"\n(C)Vincent C. All rights reserved.",400,240).setVisible(true);
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


