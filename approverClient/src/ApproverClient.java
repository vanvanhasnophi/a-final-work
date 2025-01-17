import javax.swing.*;
import java.awt.*;
import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;
import java.io.IOException;
import java.io.PrintStream;
import java.net.MalformedURLException;
import java.rmi.Naming;
import java.rmi.NotBoundException;
import java.rmi.RemoteException;
import java.util.*;

class CheckItem{
    public final JCheckBox checkBx;
    public final int id;
    CheckItem(String Text,int id){
        this.checkBx=new JCheckBox(Text);
        checkBx.setFont(PresFont.fntText);
        this.id=id;
    }
}

@SuppressWarnings("FieldCanBeLocal")
public class ApproverClient extends ClientFrame{
    private final JPanel ApplierList;
    private final JButton checkButton;
    private final JButton ApproveButton=new JButton();
    private final JButton RejectButton=new JButton();
    private final JButton BackButton=new JButton();
    private final JPanel CheckPane;
    private final JComboBox<String> AppliersChoice=new JComboBox<>();
    private Approver check;
    private final int[] Count={0};
    private final HashMap<Integer,Approver> observers=new HashMap<>();
    private final JTextPane RoomL;
    private final int[] Focusing={-1};
    private HashMap<Integer, UserInfo> appliers=new HashMap<>();
    private final ArrayList<CheckItem> appliersCheck=new ArrayList<>();
    final ArrayList<String> ref=new ArrayList<>(Arrays.asList("connect","register","approve","reject","scan","disconnect","exit","check","clear",
            "?", "help", "hello", "bye", "nihao", "zaijian","love", "tell","about","light","dark"));

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
        super();
        // Title
        setTitle("RoomX - ApproverClient");

        // Exit Operation
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        addWindowListener(new ExWindowListener());

        // RoomList ComboBox Function
        roomList.addItemListener(e -> {
            try {
                if(roomList.getSelectedItem()!=null)selected.setText(observers.get(roomList.getSelectedItem()!=null?roomList.getSelectedItem():-1).ToString());
            } catch (RemoteException ex) {
                throw new RuntimeException(ex);
            }
        });

        // Register Button Function
        registerButton.addActionListener(e -> clientRegister());


        // CheckPane
        CheckPane=new JPanel();
        CheckPane.setLayout(new BorderLayout());
        CheckPane.setVisible(false);
        add(CheckPane,BorderLayout.EAST);

        // Room Label
        RoomL=new JTextPane();
        RoomL.setEditable(false);
        CheckPane.add(RoomL,BorderLayout.NORTH);

        // Decision Panel
        JPanel decisionPane=new JPanel();
        decisionPane.setLayout(new GridLayout(1,4));
        CheckPane.add(decisionPane,BorderLayout.SOUTH);

        // Appliers ComboBox
        AppliersChoice.setFont(PresFont.fntDisplay);
        decisionPane.add(AppliersChoice);


        // Applier List
        ApplierList=new JPanel();
        BoxLayout layout=new BoxLayout(ApplierList,BoxLayout.Y_AXIS);
        ApplierList.setLayout(layout);
        ApplierList.setVisible(true);
        ApplierList.setFont(PresFont.fntText);

        // Decision Buttons
        ///JButton ApproveButton=new JButton();
        ///JButton RejectButton=new JButton();
        ///JButton BackButton=new JButton();
        decisionPane.add(ApproveButton);
        decisionPane.add(RejectButton);
        decisionPane.add(BackButton);
        ApproveButton.setVisible(true);
        RejectButton.setVisible(true);
        BackButton.setVisible(true);
        ApproveButton.setFont(PresFont.fntBld);
        RejectButton.setFont(PresFont.fntBld);
        BackButton.setFont(PresFont.fntBld);
        ApproveButton.setText("Approve");
        RejectButton.setText("Reject");
        BackButton.setText("Back");
        ApproveButton.addActionListener(e -> {
            try {
                if(AppliersChoice.getSelectedItem()==null)throw new NullPointerException();
                switch ((String)AppliersChoice.getSelectedItem()) {
                    case "Selected":{
                        int id=-1;
                        int count=0;
                        for (CheckItem checkItem : appliersCheck) {
                            if (checkItem.checkBx.isSelected()){
                                count++;
                                id=checkItem.id;
                                if(observers.get(Focusing[0]).getReserved()==id||observers.get(Focusing[0]).Occupying(id))throw new RuntimeException();
                            }
                        }
                        if(count>1) {
                            System.out.println("You can only approve 1 applier at a time.");
                            new MessageBox("You can only approve 1 applier at a time.", 400, 100).setVisible(true);
                        }
                        else if(id==-1)throw new NullPointerException(); else{
                            ConfirmDialog c = new ConfirmDialog("Approve applier #" + id + "'s application for room #" + Focusing[0] + "(aka " + observers.get(Focusing[0]).NameStr() + ")" + "?", 600, 100);
                            c.setVisible(true);
                            if (!c.isOK()) return;
                            observers.get(Focusing[0]).Approve(id);
                        }
                        break;
                    }
                    case "All":{
                        System.out.println("You can only approve 1 applier at a time.");
                        new MessageBox("You can only approve 1 applier at a time.",400,100).setVisible(true);
                        break;
                    }
                    case "N/A":{
                        System.out.println("No appliers to approve.");
                        new MessageBox("No appliers to approve.",320,100).setVisible(true);
                        break;
                    }
                    default: {
                        int i = Integer.parseInt((String) AppliersChoice.getSelectedItem());
                        try {
                            ConfirmDialog c = new ConfirmDialog("Approve applier #" + i + "'s application for room #" + Focusing[0] + "(aka " + observers.get(Focusing[0]).NameStr() + ")" + "?", 400, 100);
                            c.setVisible(true);
                            if (!c.isOK()) return;
                            int suc = observers.get(Focusing[0]).Approve(i);
                            Messenger.setText("");
                            if (suc == 0) throw new RuntimeException();
                            System.out.println("Approval success!");
                        } catch (Exception ex) {
                            Messenger.setText("");
                            System.out.println("Failed to approve, try again later.");
                        }
                    }
                }
                // check and scan again
                try{
                    check(Focusing[0]);
                    scanning("NoMessage");}
                catch(Exception ignored){}
            }
            catch (Exception ex){
                Messenger.setText("");
                System.out.println("Failed to approve, try again later.");
                new MessageBox("Failed to approve, try again later.",400,100).setVisible(true);
            }
        });
        RejectButton.addActionListener(e -> {
            try {
                if (AppliersChoice.getSelectedItem() == null) throw new NullPointerException();
                switch ((String) AppliersChoice.getSelectedItem()) {
                    case "Selected": {
                        ConfirmDialog c = new ConfirmDialog("Reject selected appliers' applications for room #" + Focusing[0] + "(aka " + observers.get(Focusing[0]).NameStr() + ")" + "?", 400, 100);
                        c.setVisible(true);
                        if (!c.isOK()) return;
                        int id;
                        for (CheckItem checkItem : appliersCheck) {
                            if (checkItem.checkBx.isSelected()) {
                                id = checkItem.id;
                                try {
                                    if (observers.get(Focusing[0]).Occupying(id)) throw new RuntimeException();
                                    observers.get(Focusing[0]).Reject(id);
                                } catch (Exception ex1) {
                                    System.out.println("Failed to reject applier #" + id + ".");
                                }
                            }
                        }
                        break;
                    }//case
                    case "All": {
                        ConfirmDialog c = new ConfirmDialog("Reject all appliers' applications for room #" + Focusing[0] + "(aka " + observers.get(Focusing[0]).NameStr() + ")" + "?", 400, 100);
                        c.setVisible(true);
                        if (!c.isOK()) return;
                        int id;
                        for (CheckItem checkItem : appliersCheck) {
                            id = checkItem.id;
                            try {
                                if (observers.get(Focusing[0]).Occupying(id)) throw new RuntimeException();
                                observers.get(Focusing[0]).Reject(id);
                            } catch (Exception ex1) {
                                System.out.println("Failed to reject applier #" + id + ".");
                            }
                        }
                        break;
                    }//case
                    case "N/A": {
                        System.out.println("No appliers to reject.");
                        new MessageBox("No appliers to reject.", 320, 100).setVisible(true);
                        break;
                    }//case
                    default: {
                        int i = Integer.parseInt((String) AppliersChoice.getSelectedItem());
                        try {
                            ConfirmDialog c = new ConfirmDialog("Reject applier #" + i + "'s application for room #" + Focusing[0] + "(aka" + observers.get(Focusing[0]).NameStr() + ")" + "?", 600, 100);
                            c.setVisible(true);
                            if (!c.isOK()) return;
                            int suc = observers.get(Focusing[0]).Reject(i);
                            Messenger.setText("");
                            if (suc == 0) throw new RuntimeException();
                            System.out.println("Rejection success!");
                            Notification.setText("");
                        } catch (Exception ex) {
                            Messenger.setText("");
                            System.out.println("Failed to reject, try again later.");
                            new MessageBox("Failed to reject, try again later.", 400, 100).setVisible(true);
                        }
                    }//default
                }//switch
                // Check and scan Again
                try {
                    check(Focusing[0]);
                    scanning("NoMessage");} catch (Exception ignored) {}
            }//try
            catch(Exception ex1){
                Messenger.setText("");
                System.out.println("Failed to reject, try again later.");
            }//catch
        });
        BackButton.addActionListener(e -> {
            if(CheckPane.isVisible()) {
                CheckPane.setVisible(false);}
        });

        // ApplierList add to CheckPane
        CheckPane.add(ApplierList,BorderLayout.CENTER);

        // Disconnect Button Function
        DisconnectButton.addActionListener(e -> clientDisconnect(true));

        // Button Panel Paint
        buttonPanel.add(clearButton);
        buttonPanel.add(scanButton);


        // Check Button
        checkButton = new JButton("Check...");
        checkButton.setFont(PresFont.fntBld);
        checkButton.addActionListener(e -> {
            Notification.setText("");
            Focusing[0]=(int) (roomList.getSelectedItem()!=null?roomList.getSelectedItem():-1);
            try {
                check(Focusing[0]);
            } catch (RemoteException ex) {
                throw new RuntimeException(ex);
            }
        });
        Actions.add(checkButton);


        // Redirect "System.out" to "TextArea"
        System.setOut(new PrintStream(new JTextAreaOutputStream(Messenger)));

        // themed-paint
        try{
            paintTheme();}
        catch (Exception e){
            System.out.println("Failed to set theme.");
        }
    }

    public void setComBoDefault() {
        AppliersChoice.setSelectedItem("Selected");
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
                try{if(com[1]!=null) idTextField.setText(com[1]);}catch(Exception ignored){}
                clientRegister();
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
                    check(Focusing[0]);
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
                    check(Focusing[0]);
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
                        check(RoomID);
                    }
                    catch(NumberFormatException e){
                        System.out.println("Input correct room ID.");
                    }
                    catch (ArrayIndexOutOfBoundsException e1){
                        if (roomList.getSelectedItem() != null) RoomID = (int) roomList.getSelectedItem();
                        else throw new NumberFormatException();
                        Notification.setText("");
                        check(RoomID);
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

    @Override
    protected void scanning(String State) throws MalformedURLException, NotBoundException, RemoteException {
        RoomMonitorWithAppliers server;
        int count=0;
        int connect=0;
        if(!observers.isEmpty())observers.clear();
        roomList.removeAllItems();
        System.gc(); //Initialize the observers.
        OverallInfo.clear();
        FilteredInfo.clear();
        SwingUtilities.updateComponentTreeUI(OverallInfo);
        SwingUtilities.updateComponentTreeUI(FilteredInfo);
        FilteredInfo.setTitle("Application(s):");
        int n;
        if(ID[0]==-1){
            OverallInfo.add(-1,"null","No certification!!!\nInput correct id.\n",e->{});
            FilteredInfo.add(-1,"null","No certification!!!\nInput correct id.\n",e->{});
            new MessageBox("No certification!!! Input correct id.",400,100).setVisible(true);
            return;
        }
        for(int i=0;i<100;i++){
            try{
                count++;
                server = (RoomMonitorWithAppliers) Naming.lookup("rmi://"+loc+"/Remote" + (count));
                connect++;
                n=server.NumberOfAppliers();
                String info="Location "+count+": "+server.NameStr()+"\n"+
                        "Capacity: "+server.Capacity()+"("+server.TypeStr()+")\n"+
                        "State: "+server.StateStr()+"  "+server.NumberOfAppliers()+" appliers";
                int finalCount = count;
                OverallInfo.add(count,n>0?"NotExecuted":"","Location "+count+": "+server.NameStr()+"("+server.StateStr()+")", e->{
                    try{
                        roomList.setSelectedItem(finalCount);
                        new MessageBox("Properties of room loc "+finalCount,info,600,140,"Check...",e1-> CheckPane.setVisible(true)).setVisible(true);
                        if(CheckPane.isVisible()) check(finalCount);
                    }catch(Exception ignored){}
                });
                observers.put(count,new Approver(loc,count-1,ID[0]));
                roomList.addItem(count);
                if(server.NumberOfAppliers()>0){
                    if(server.StateStr().equals("Guest-Occupied"))FilteredInfo.add(count,"","Location "+count+": "+server.NameStr()+"("+server.StateStr()+", "+server.NumberOfAppliers()+" appliers)", e->{
                        try{
                            roomList.setSelectedItem(finalCount);
                            check(finalCount);
                        }catch(Exception ignored){}
                    });else FilteredInfo.add(count,"NotExecuted","Location "+count+": "+server.NameStr()+"("+server.StateStr()+", "+server.NumberOfAppliers()+" appliers)", e->{
                        try{
                            roomList.setSelectedItem(finalCount);
                            check(finalCount);
                        }catch(Exception ignored){}
                    });
                }
            }catch (Exception ignored){
            }
        }
        if(connect==0){
            OverallInfo.setTitle("Overall:");
            OverallInfo.add(-1,"","No remote rooms.",e->{});
            System.out.println("No remote rooms found.\n");
        }
        else {
            OverallInfo.setTitle("Overall: "+connect+" rooms");
            System.out.println("Scanning complete.\n"+connect+" rooms found.\n");
        }
    }

    public void check(int Focus) throws RemoteException {
        if(!appliersCheck.isEmpty())appliersCheck.clear();
        ApplierList.removeAll();
        SwingUtilities.updateComponentTreeUI(ApplierList);
        AppliersChoice.removeAllItems();
        if(!CheckPane.isVisible()) {
            CheckPane.setVisible(true);
        }
        Focusing[0]=Focus;
        RoomL.setText(" All appliers for room loc "+Focus+"\n"+observers.get(Focus).ToString());
        try {
            boolean exi=false;
            appliers=observers.get(Focus).ApplierList();
            for(Map.Entry<Integer, UserInfo>observer : appliers.entrySet()) {
                String curInfo="";
                if(observers.get(Focus).Occupying(observer.getValue().getID())) curInfo="(Occupying) ";
                else if(observers.get(Focus).getReserved()==(observer.getValue().getID())) curInfo="(Reserved) ";
                curInfo=curInfo+"Applier id: "+observer.getValue().getID()+" Crowd: "+observer.getValue().getCrowd();
                CheckItem ele=new CheckItem(curInfo,observer.getValue().getID());
                ApplierList.add(ele.checkBx);
                appliersCheck.addLast(ele);
                ele.checkBx.addActionListener(e -> {
                    try{
                        setComBoDefault();
                    }
                    catch (Exception ignored){}
                });
                AppliersChoice.addItem(String.valueOf(observer.getValue().getID()));
                exi=true;
            }
            ApproveButton.setEnabled(!observers.get(Focus).isReserved()&&exi);
            RejectButton.setEnabled(RejectButton.isEnabled()&&exi);
            if(!exi)throw new RuntimeException();
            AppliersChoice.addItem("Selected");
            AppliersChoice.addItem("All");
        } catch (Exception ex) {
            Notification.setText("");
            System.out.println("Cannot get applier list. \nCheck if there are any appliers.");
            ApplierList.removeAll();
            AppliersChoice.addItem("N/A");
            new MessageBox("Cannot get applier list. Check if there are any appliers.",400,140).setVisible(true);
        }
    }

    @Override
    protected void clientRegister(){
        Notification.setText("");
        try {
            ID[0] = Integer.parseInt(idTextField.getText().trim());
            if(ID[0]<=0)throw new NumberFormatException();
            check=new Approver("rmi://"+loc+"/Remote0",ID[0]);
            if(check.isDup())throw new DuplicationException("id already exist.");
            Messenger.append("Confirmed id: " + ID[0] + "\n");
            idTextField.setEditable(false);
            idTextField.setVisible(false);
            actionPanel.setVisible(true);
            idLabelIn.setText("Welcome back, Approver #"+ID[0]+"!");
            TextPane.setVisible(true);
            inputPanel.setVisible(false);
            add(TextPane, BorderLayout.CENTER);
            menu.setVisible(true);
            SwingUtilities.updateComponentTreeUI(TextPane);
            scanning("NoMessage");
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
        try {
            if (NeedConfirm) {
                ConfirmDialog c = new ConfirmDialog("Disconnect " + ID[0] + " from the server?", 400, 100);
                c.setVisible(true);
                if (!c.isOK()) return;
            }
            Notification.setText("");
            check.Disconnect();
            if (!observers.isEmpty()) {
                for (Map.Entry<Integer, Approver> observer : observers.entrySet()) observer.getValue().Disconnect();
                observers.clear();
            }
            idTextField.setText(String.valueOf(ID[0]));
            ID[0] = -1;
            Console.setText("");
            FilteredInfo.clear();
            idTextField.setEditable(true);
            idTextField.setVisible(true);
            Messenger.setText("Disconnected from the server.\n");
            OverallInfo.clear();
            actionPanel.setVisible(false);
            if (CheckPane.isVisible()) {
                CheckPane.setVisible(false);
            }
            OverallInfo.setTitle("Overall:");
            TextPane.setVisible(false);
            inputPanel.setVisible(true);
            add(inputPanel,BorderLayout.CENTER);
            menu.setVisible(false);
            SwingUtilities.updateComponentTreeUI(inputPanel);
        }
        catch (RemoteException ex) {
            new MessageBox("Failed to disconnect, try again later.",400,100).setVisible(true);
            throw new RuntimeException(ex);
        }
    }

    @Override
    protected void help(){
        new MessageBox("Command Help","""
                register/connect <your id>   (register as <id>)
                disconnect   (disconnect current user from server)
                scan   (refresh the room list)
                clear   (clear the console)
                approve <room id> <applier id>   (approve an applier's request)
                reject <room id> <applier id>   (reject an applier's request)
                check <room id>   (check the applier list of a room)
                exit   (close the client)
                help(or ?)   (show help, like this)
                light/dark   (set light/dark theme)
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
                light/dark   (set light/dark theme)
                "this", "~", "-", "room" represents for the room you are choosing.
                """);
    }

    @Override
    protected void about(boolean love) {
        new MessageBox("About",(love?"Love is invaluable.\n\n":"")+"RoomX (Approver Client)\nversion "+version+"\n(C)Vincent C. All rights reserved.",400,240).setVisible(true);
    }

    public static void main(String[] args) {

        ///Optional, if not work, delete it and its dependency.
        try {
            setLightDarkMode();
        } catch( Exception ex ) {
            System.err.println( "Failed to initialize LaF" );
        }

        // Safely Run
        SwingUtilities.invokeLater(() -> new ApproverClient().setVisible(true));
    }
}
