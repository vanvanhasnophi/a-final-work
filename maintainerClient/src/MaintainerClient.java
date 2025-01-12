import com.formdev.flatlaf.FlatLightLaf;
import javax.swing.*;
import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;
import java.io.IOException;
import java.io.OutputStream;
import java.io.PrintStream;
import java.net.MalformedURLException;
import java.rmi.Naming;
import java.rmi.NotBoundException;
import java.rmi.RemoteException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

@SuppressWarnings("FieldCanBeLocal")
public class MaintainerClient extends ClientFrame implements Command {

    public void Scanning(String State) throws MalformedURLException, NotBoundException, RemoteException {
        RoomMonitor server;
        int count=0;
        int connect=0;
        observers=new HashMap<>();
        roomList.removeAllItems();
        System.gc(); //Initialize the observers.
        OverallInfo.clear();
        FilteredInfo.clear();
        FilteredInfo.setTitle("To be repaired:");
        if(ID[0]==-1){
            OverallInfo.add(-1,"null","No certification!!! Input correct id.",e->{});
            FilteredInfo.add(-1,"null","No certification!!! Input correct id.",e->{});
            new MessageBox("No certification!!! Input correct id.",400,100).setVisible(true);
            return;
        }
        for(int i=0;i<100;i++){
            try{
                count++;
                server = (RoomMonitor) Naming.lookup("rmi://127.0.0.1:1099/Remote" + (count));
                connect++;
                String info="Location "+count+": "+server.NameStr()+"\n"+
                        "Capacity: "+server.Capacity()+"("+server.TypeStr()+")\n"+
                        "State: "+server.StateStr();
                int finalCount = count;
                OverallInfo.add(count,server.StateStr().equals("Needs Repairing")?"NotExecuted":"","Location "+count+": "+server.NameStr()+"("+server.StateStr()+")", e->{
                    try{
                        roomList.setSelectedItem(finalCount);
                        new MessageBox(info,600,140).setVisible(true);
                    }catch(Exception ignored){}
                });
                observers.put(count,new Maintainer(count-1,ID[0]));
                roomList.addItem(count);
                if(server.StateStr().equals("Needs Repairing"))FilteredInfo.add(count,"","Location "+count+": "+server.NameStr(), e->{
                    try{
                        roomList.setSelectedItem(finalCount);
                        new MessageBox(info,600,140).setVisible(true);
                    }catch(Exception ignored){}
                });
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

    private final String version=properties.version.description();
    private final JButton repairButton;
    private Maintainer check;
    private final int[] Count={0};
    private HashMap<Integer,Maintainer> observers=new HashMap<>();
    final ArrayList<String> ref=new ArrayList<>(Arrays.asList("connect","register","repair","scan","disconnect","clear",
            "exit", "?", "help", "hello", "bye", "nihao", "zaijian","love", "tell","about","light","dark"));


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
            case "repair":{
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
                        if(observers.get(RoomID)!=null)observers.get(RoomID).RepairComplete(ID[0]);else throw new RuntimeException();
                        System.out.println("Repair complete.");
                    }
                    catch(NumberFormatException e){
                        System.out.println("Input correct room ID.");
                    }
                    catch (ArrayIndexOutOfBoundsException e1){
                        if (roomList.getSelectedItem() != null) RoomID = (int) roomList.getSelectedItem();
                        else throw new NumberFormatException();
                        Notification.setText("");
                        if(observers.get(RoomID)!=null)observers.get(RoomID).RepairComplete(ID[0]);else throw new RuntimeException();
                    }
                }catch (Exception e) {
                    System.out.println("Failed to set status.");
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
                            RoomMonitor server=(RoomMonitor) Naming.lookup("rmi://127.0.0.1:1099/Remote0");
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

    private class ExWindowListener extends WindowAdapter {
        @Override
        public void windowClosing(WindowEvent e) {
            super.windowClosing(e);
            try {
                if(check!=null)check.Disconnect();
                if(!observers.isEmpty())for(Map.Entry<Integer,Maintainer> observer: observers.entrySet()) observer.getValue().Disconnect();
                System.exit(0);
            } catch (Exception ex) {
                System.exit(-1);
            }
        }

    }

    public MaintainerClient() {
        // Title
        setTitle("RoomX - MaintainerClient");

        // Exit Operation
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        addWindowListener(new ExWindowListener());

        // RoomList ComboBox Function
        roomList.addItemListener(e -> {
            try {
                if(roomList.getSelectedItem()!=null)selected.setText(observers.get((int)roomList.getSelectedItem()).ToString());
            } catch (RemoteException ex) {
                throw new RuntimeException(ex);
            }
        });


        // Register Button Function
        registerButton.addActionListener(e -> {
            Notification.setText("");
            try {
                ID[0] = Integer.parseInt(idTextField.getText().trim());
                if(ID[0]<=0)throw new NumberFormatException();
                check=new Maintainer("rmi://127.0.0.1:1099/Remote0",ID[0]);
                if(check.isDup())throw new DuplicationException("id already exist.");
                Messenger.append("Confirmed id: " + ID[0] + "\n");
                registerButton.setVisible(false);
                idTextField.setEditable(false);
                DisconnectButton.setVisible(true);
                actionPanel.setVisible(true);
                Scanning("");
            }catch (NumberFormatException ex1) {
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
        });

        // Disconnect Button Function
        DisconnectButton.addActionListener(e -> {
            Notification.setText("");
            try {
                ConfirmDialog c=new ConfirmDialog("Disconnect "+ID[0]+" from the server?",400,100);
                c.setVisible(true);
                if(!c.isOK())return;
                check.Disconnect();
                if(!observers.isEmpty()){
                    for(Map.Entry<Integer,Maintainer> observer: observers.entrySet()) observer.getValue().Disconnect();
                    observers.clear();
                }
                idTextField.setText(String.valueOf(ID[0]));
                ID[0]=-1;
                Console.setText("");
                FilteredInfo.clear();
                DisconnectButton.setVisible(false);
                registerButton.setVisible(true);
                idTextField.setEditable(true);
                Messenger.setText("Disconnected from the server.\n");
                OverallInfo.clear();
                OverallInfo.setTitle("Overall:");
                actionPanel.setVisible(false);
            } catch (RemoteException ex) {
                new MessageBox("Failed to disconnect, try again later.",400,100).setVisible(true);
                throw new RuntimeException(ex);
            }
        });

        // Repair Button
        repairButton = new JButton("Repair");
        repairButton.setFont(PresFont.fntBld.fontName());
        repairButton.addActionListener(e -> {
            Notification.setText("");
            try {
                ConfirmDialog c=new ConfirmDialog("Is repair of Room #"+roomList.getSelectedItem()+" completed?",400,100);
                c.setVisible(true);
                if(!c.isOK())return;
                if(roomList.getSelectedItem()!=null)observers.get((int)roomList.getSelectedItem()).RepairComplete(ID[0]);
                System.out.println("Repair complete.");
                new MessageBox("Completed repair for room #"+roomList.getSelectedItem()+".",400,100).setVisible(true);
            } catch (IOException | ClassNotFoundException ex) {
                System.out.println("Failed to set status of room #"+roomList.getSelectedItem()+".");
                new MessageBox("Failed to set status of room #"+roomList.getSelectedItem()+".",400,100).setVisible(true);
            }
        });
        Actions.add(repairButton);


        // Redirect "System.out" to "TextArea"
        System.setOut(new PrintStream(new JTextAreaOutputStream(Messenger)));
    }

    protected void help(){
        new MessageBox("""
                register/connect <your id>   (register as <id>)
                disconnect   (disconnect current user from server)
                scan   (refresh the room list)
                clear   (clear the console)
                repair <room id>   (end repairing status of a room)
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
                repair <room id>   (end repairing status of a room)
                exit   (close the client)
                help(or ?)   (show help, like this)
                light/dark   (set light/dark theme)
                "this", "~", "-", "room" represents for the room you are choosing.
                """);
    }

    protected void about(boolean love) {
        new MessageBox((love?"Love is invaluable.\n\n":"")+"RoomX (Maintainer Client)\nversion "+version+"\n(C)Vincent C. All rights reserved.",400,240).setVisible(true);
    }

    public static void main(String[] args) {


        ///Optional, if not work, delete it and its dependency.
        try {
            UIManager.setLookAndFeel( new FlatLightLaf() );
        } catch( Exception ex ) {
            System.err.println( "Failed to initialize LaF" );
        }

        // Safely Run
        SwingUtilities.invokeLater(() -> new MaintainerClient().setVisible(true));
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
