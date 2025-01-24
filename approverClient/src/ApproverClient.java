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
import java.text.MessageFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

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
    private final JFrame checkFrame;
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
        setTitle("RoomX - "+bundle.getString("approverClient"));

        // Exit Operation
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        addWindowListener(new ExWindowListener());

        // RoomList ComboBox Function
        roomList.addItemListener(e -> {
            try {
                if(roomList.getSelectedItem()!=null){
                    selected.setText(observers.get(roomList.getSelectedItem()!=null?roomList.getSelectedItem():-1).ToString());
                    selected.setToolTipText(selected.getText());
                }
            } catch (RemoteException ex) {
                throw new RuntimeException(ex);
            }
        });


        // Register Button Function
        registerButton.addActionListener(e -> clientRegister());

        // checkFrame
        checkFrame=new JFrame(bundle.getString("check"));
        checkFrame.setSize(500,500);
        checkFrame.setLocationRelativeTo(null);

        // CheckPane
        CheckPane=new JPanel();
        CheckPane.setLayout(new BorderLayout());

        // Room Label
        RoomL=new JTextPane();
        RoomL.setEditable(false);
        RoomL.setFont(PresFont.fnt);
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
        ApproveButton.setText(bundle.getString("approve"));
        RejectButton.setText(bundle.getString("reject"));
        BackButton.setText(bundle.getString("back"));
        ApproveButton.addActionListener(e -> {
            try {
                if(AppliersChoice.getSelectedItem()==null)throw new NullPointerException();
                if(AppliersChoice.getSelectedItem().equals(bundle.getString("selected"))) {
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
                            System.out.println(bundle.getString("youCanOnlyApproveOne"));
                            new MessageBox(bundle.getString("youCanOnlyApproveOne"), 400, 100).setVisible(true);
                        }
                        else if(id==-1)throw new NullPointerException(); else{
                            ConfirmDialog c = new ConfirmDialog(bundle.getString("continueTitle"),MessageFormat.format(bundle.getString("approveSpecConfirm"),id,Focusing[0],observers.get(Focusing[0]).NameStr()), 600, 100);
                            c.setVisible(true);
                            if (!c.isOK()) return;
                            observers.get(Focusing[0]).Approve(id);
                        }
                    }
                    else if(AppliersChoice.getSelectedItem().equals(bundle.getString("all"))){
                        System.out.println(bundle.getString("youCanOnlyApproveOne"));
                        new MessageBox(bundle.getString("youCanOnlyApproveOne"),400,100).setVisible(true);
                    }
                    else if(AppliersChoice.getSelectedItem().equals(bundle.getString("NA"))){
                        System.out.println(bundle.getString("noApplier2Approve"));
                        new MessageBox(bundle.getString("noApplier2Approve"),320,100).setVisible(true);
                        
                    }
                    else {
                        int i = Integer.parseInt((String) AppliersChoice.getSelectedItem());
                        try {
                            ConfirmDialog c = new ConfirmDialog(bundle.getString("continueTitle"),MessageFormat.format(bundle.getString("approveSpecConfirm"),i,Focusing[0],observers.get(Focusing[0]).NameStr()), 600, 100);
                            c.setVisible(true);
                            if (!c.isOK()) return;
                            int suc = observers.get(Focusing[0]).Approve(i);
                            Messenger.setText("");
                            if (suc == 0) throw new RuntimeException();
                            System.out.println(bundle.getString("approvalSuc"));
                        } catch (Exception ex) {
                            Messenger.setText("");
                            System.out.println(bundle.getString("approvalFail"));
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
                System.out.println(bundle.getString("approvalFail"));
                new MessageBox(bundle.getString("approvalFail"),400,100).setVisible(true);
            }
        });
        RejectButton.addActionListener(e -> {
            try {
                if (AppliersChoice.getSelectedItem() == null) throw new NullPointerException();
                if(AppliersChoice.getSelectedItem().equals(bundle.getString("selected"))) {
                        ConfirmDialog c = new ConfirmDialog(bundle.getString("continueTitle"),MessageFormat.format(bundle.getString("rejectSelectedConfirm"),Focusing[0],observers.get(Focusing[0]).NameStr()), 600, 100);
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
                                    System.out.println(MessageFormat.format(bundle.getString("rejectSpecFail"),id));
                                }
                            }
                        }
                        
                    }
                    else if(AppliersChoice.getSelectedItem().equals(bundle.getString("all"))) {
                        ConfirmDialog c = new ConfirmDialog(bundle.getString("continueTitle"),MessageFormat.format(bundle.getString("rejectAllConfirm"),Focusing[0],observers.get(Focusing[0]).NameStr()), 600, 100);
                        c.setVisible(true);
                        if (!c.isOK()) return;
                        int id;
                        for (CheckItem checkItem : appliersCheck) {
                            id = checkItem.id;
                            try {
                                if (observers.get(Focusing[0]).Occupying(id)) throw new RuntimeException();
                                observers.get(Focusing[0]).Reject(id);
                            } catch (Exception ex1) {
                                System.out.println(MessageFormat.format(bundle.getString("rejectSpecFail"),id));
                            }
                        }
                    }
                    else if(AppliersChoice.getSelectedItem().equals(bundle.getString("NA"))){
                        System.out.println(bundle.getString("noApplier2Reject"));
                        new MessageBox(bundle.getString("noApplier2Reject"), 320, 100).setVisible(true);
                    }
                    else {
                        int i = Integer.parseInt((String) AppliersChoice.getSelectedItem());
                        try {
                            ConfirmDialog c = new ConfirmDialog(bundle.getString("continueTitle"),MessageFormat.format(bundle.getString("rejectSpecConfirm"),i,Focusing[0],observers.get(Focusing[0]).NameStr()), 600, 100);
                            c.setVisible(true);
                            if (!c.isOK()) return;
                            int suc = observers.get(Focusing[0]).Reject(i);
                            Messenger.setText("");
                            if (suc == 0) throw new RuntimeException();
                            System.out.println(bundle.getString("rejectSuc"));
                            Notification.setText("");
                        } catch (Exception ex) {
                            Messenger.setText("");
                            System.out.println(bundle.getString("rejectFail"));
                            new MessageBox(bundle.getString("rejectFail"), 400, 100).setVisible(true);
                        }
                    }//default
                // Check and scan Again
                try {
                    check(Focusing[0]);
                    scanning("NoMessage");} catch (Exception ignored) {}
            }//try
            catch(Exception ex1){
                Messenger.setText("");
                System.out.println(bundle.getString("rejectFail"));
            }//catch
        });
        BackButton.addActionListener(e -> checkFrame.dispose());

        // ApplierList add to CheckPane
        CheckPane.add(ApplierList,BorderLayout.CENTER);
        checkFrame.setLayout(new BorderLayout());
        checkFrame.add(CheckPane,BorderLayout.CENTER);

        // Disconnect Button Function
        DisconnectButton.addActionListener(e -> clientDisconnect(true));

        // Button Panel Paint
        buttonPanel.add(clearButton);
        buttonPanel.add(scanButton);


        // Check Button
        checkButton = new JButton(bundle.getString("check")+"...");
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
            System.out.println(bundle.getString("setThemeFail"));
        }
    }

    public void setComBoDefault() {
        AppliersChoice.setSelectedItem(bundle.getString("selected"));
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
                    System.out.println(bundle.getString("needDisconnect"));
                    break;
                }
                try{if(com[1]!=null) idTextField.setText(com[1]);}catch(Exception ignored){}
                clientRegister();
                break;
            }
            case "approve":{
                if(ID[0]==-1){
                    System.out.println(bundle.getString("needRegister"));
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
                    System.out.println(bundle.getString("illegalRoomNUserID"));
                } catch (Exception e) {
                    System.out.println(bundle.getString("approvalFail"));
                }
                break;
            }
            case "reject":{
                if(ID[0]==-1){
                    System.out.println(bundle.getString("needRegister"));
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
                    System.out.println(bundle.getString("rejectSuc"));
                    check(Focusing[0]);
                } catch (NumberFormatException|ArrayIndexOutOfBoundsException e){
                    System.out.println(bundle.getString("illegalRoomNUserID"));
                } catch (Exception e) {
                    System.out.println(bundle.getString("rejectFail"));
                }
                break;
            }
            case "check":{
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
                        Focusing[0]=RoomID;
                        check(RoomID);
                    }
                    catch(NumberFormatException e){
                        System.out.println(bundle.getString("roomIDIncorrect"));
                    }
                    catch (ArrayIndexOutOfBoundsException e1){
                        if (roomList.getSelectedItem() != null) RoomID = (int) roomList.getSelectedItem();
                        else throw new NumberFormatException();
                        Notification.setText("");
                        check(RoomID);
                    }}
                catch (RemoteException e1){
                    System.out.println(bundle.getString("noApplierList"));
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
                System.out.println(bundle.getString("nihao"));
                break;
            }
            case "hello":{
                System.out.println(bundle.getString("hello"));
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
                    System.out.println(bundle.getString("tell"));
                    ConfirmDialog c=new ConfirmDialog(bundle.getString("message"),bundle.getString("tell"),480,240);
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
                if(LightDarkMode.isDark())switchLD();else System.out.println(MessageFormat.format(bundle.getString("alreadyUsingTheme"),bundle.getString("light")));
                break;
            }
            case "dark":{
                if(!LightDarkMode.isDark())switchLD();else System.out.println(MessageFormat.format(bundle.getString("alreadyUsingTheme"),bundle.getString("dark")));
                break;
            }
            default:{
                System.out.println(bundle.getString("incorrectCommand"));
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
        FilteredInfo.setTitle(bundle.getString("applicationTip"));
        int n;
        if(ID[0]==-1){
            OverallInfo.add(-1,"null",bundle.getString("noCertification"),e->{});
            FilteredInfo.add(-1,"null",bundle.getString("noCertification"),e->{});
            new MessageBox(bundle.getString("noCertification"),400,100).setVisible(true);
            return;
        }
        for(int i=0;i<100;i++){
            try{
                count++;
                server = (RoomMonitorWithAppliers) Naming.lookup("rmi://"+loc+"/Remote" + (count));
                connect++;
                n=server.NumberOfAppliers();
                String info=MessageFormat.format(bundle.getString("richInfo"),count,server.NameStr(),server.Capacity(),server.TypeStr(),server.StateStr())+", "+MessageFormat.format(bundle.getString("applierNumberA"),server.NumberOfAppliers());
                int finalCount = count;
                OverallInfo.add(count,n>0?"NotExecuted":"",MessageFormat.format(bundle.getString("itemInfo"),count,server.NameStr(),server.TypeStr())+")", e->{
                    try{
                        roomList.setSelectedItem(finalCount);
                        new MessageBox(MessageFormat.format(bundle.getString("richInfoTitle"),finalCount),info,600,140,"Check...",e1-> checkFrame.setVisible(true)).setVisible(true);
                        if(checkFrame.isVisible()) check(finalCount);
                        FilteredInfo.uniqueSelect(finalCount);
                    }catch(Exception ignored){}
                });
                observers.put(count,new Approver(loc,count-1,ID[0]));
                roomList.addItem(count);
                if(server.NumberOfAppliers()>0){
                    if(server.StateStr().equals("Guest-Occupied"))FilteredInfo.add(count,"",MessageFormat.format(bundle.getString("itemInfo"),count,server.NameStr(),server.TypeStr())+", "+MessageFormat.format(bundle.getString("applierNumberA"),server.NumberOfAppliers())+")", e->{
                        try{
                            roomList.setSelectedItem(finalCount);
                            check(finalCount);
                            OverallInfo.uniqueSelect(finalCount);
                        }catch(Exception ignored){}
                    });else FilteredInfo.add(count,"NotExecuted",MessageFormat.format(bundle.getString("itemInfo"),count,server.NameStr(),server.TypeStr())+", "+MessageFormat.format(bundle.getString("applierNumberA"),server.NumberOfAppliers())+")", e->{
                        try{
                            roomList.setSelectedItem(finalCount);
                            check(finalCount);
                            OverallInfo.uniqueSelect(finalCount);
                        }catch(Exception ignored){}
                    });
                }
            }catch (Exception ignored){
            }
        }
        if(connect==0){
            OverallInfo.setTitle(bundle.getString("overall"));
            OverallInfo.add(-1,"",bundle.getString("noRooms"),e->{});
            System.out.println(bundle.getString("noRooms"));
        }
        else {
            OverallInfo.setTitle(MessageFormat.format(bundle.getString("overallWithNum"),connect));
            System.out.println(MessageFormat.format(bundle.getString("foundRooms"),connect));
        }
    }

    public void check(int Focus) throws RemoteException {
        if(!appliersCheck.isEmpty())appliersCheck.clear();
        ApplierList.removeAll();
        SwingUtilities.updateComponentTreeUI(ApplierList);
        AppliersChoice.removeAllItems();
        if(!checkFrame.isVisible()) {
            checkFrame.setVisible(true);
        }
        Focusing[0]=Focus;
        RoomL.setText(MessageFormat.format(bundle.getString("allAppliers"),Focus)+"\n"+observers.get(Focus).ToString());
        try {
            boolean exi=false;
            appliers=observers.get(Focus).ApplierList();
            for(Map.Entry<Integer, UserInfo>observer : appliers.entrySet()) {
                String curInfo="";
                if(observers.get(Focus).Occupying(observer.getValue().getID())) curInfo="("+bundle.getString("occupying")+") ";
                else if(observers.get(Focus).getReserved()==(observer.getValue().getID())) curInfo="("+bundle.getString("reserved")+") ";
                curInfo=curInfo+MessageFormat.format(bundle.getString("applierInfo"),observer.getValue().getID(),observer.getValue().getCrowd());
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
            AppliersChoice.addItem(bundle.getString("selected"));
            AppliersChoice.addItem(bundle.getString("all"));
        } catch (Exception ex) {
            Notification.setText("");
            System.out.println(bundle.getString("emptyApplierList"));
            ApplierList.removeAll();
            AppliersChoice.addItem(bundle.getString("NA"));
            new MessageBox(bundle.getString("emptyApplierList"),400,140).setVisible(true);
        }
    }

    @Override
    protected void clientRegister(){
        Notification.setText("");
        try {
            ID[0] = Integer.parseInt(idTextField.getText().trim());
            if(ID[0]<=0)throw new NumberFormatException();
            check=new Approver("rmi://"+loc+"/Remote0",ID[0]);
            if(check.isDup())throw new DuplicationException(bundle.getString("idCollide"));
            Messenger.append(MessageFormat.format(bundle.getString("registeredIdTip"),ID[0])+"\n");
            idTextField.setEditable(false);
            idTextField.setVisible(false);
            actionPanel.setVisible(true);
            idLabelIn.setText(MessageFormat.format(bundle.getString("greeting"),bundle.getString("approver"),ID[0]));
            TextPane.setVisible(true);
            inputPanel.setVisible(false);
            add(TextPane, BorderLayout.CENTER);
            menu.setVisible(true);
            SwingUtilities.updateComponentTreeUI(TextPane);
            scanning("NoMessage");
        } catch (NumberFormatException ex1) {
            Messenger.append(bundle.getString("illegalId"));
            new MessageBox(bundle.getString("illegalId"),400,100).setVisible(true);
            ID[0]=-1;
        }
        catch(NotBoundException | IOException ex2){
            ID[0]=-1;
            Messenger.append(bundle.getString("connectFail"));
            new MessageBox(bundle.getString("connectFailTitle"),bundle.getString("connectFail"),400,100,"Connection Settings...",e->Load("Account")).setVisible(true);
        }
        catch(DuplicationException ex3){
            Messenger.append(bundle.getString("idCollide"));
            new MessageBox(bundle.getString("idCollide"),400,100).setVisible(true);
            ID[0]=-1;
            check=null;
        }
    }

    @Override
    protected void clientDisconnect(boolean NeedConfirm) {
        try {
            if (NeedConfirm) {
                ConfirmDialog c = new ConfirmDialog(bundle.getString("continueTitle"),MessageFormat.format(bundle.getString("disconnectConfirm"),ID[0]), 400, 100);
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
            Messenger.setText(bundle.getString("disconnectSuc"));
            OverallInfo.clear();
            actionPanel.setVisible(false);
            if (checkFrame.isVisible()) {
                checkFrame.dispose();
            }
            OverallInfo.setTitle(bundle.getString("overall"));
            TextPane.setVisible(false);
            inputPanel.setVisible(true);
            add(inputPanel,BorderLayout.CENTER);
            menu.setVisible(false);
            SwingUtilities.updateComponentTreeUI(inputPanel);
        }
        catch (RemoteException ex) {
            new MessageBox(bundle.getString("disconnectFail"),400,100).setVisible(true);
            throw new RuntimeException(ex);
        }
    }

    @Override
    protected void help(){
        new MessageBox(bundle.getString("commandHelpTitle"),bundle.getString("helpTextA"),500,300).setVisible(true);
        System.out.println(bundle.getString("helpTip")+"\n"+bundle.getString("helpTextA"));
    }

    @Override
    protected void about(boolean love) {
        new MessageBox(bundle.getString("about"),(love?(bundle.getString("loveInvaluable")+"\n\n"):"")+MessageFormat.format(bundle.getString("aboutText"),bundle.getString("approverClient"),version),400,240).setVisible(true);
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
