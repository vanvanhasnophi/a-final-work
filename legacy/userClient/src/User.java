import java.io.IOException;
import java.net.MalformedURLException;
import java.rmi.AlreadyBoundException;
import java.rmi.Naming;
import java.rmi.NotBoundException;
import java.rmi.RemoteException;

public class User extends RoomStub implements IUser {
    private final int ID;
    private final int crowd;
    private RoomUsable serverU;

    /**Is duplicated*/
    private boolean dup;

    public boolean isDup() {
        return dup;
    }

    public void Apply() throws IOException, ClassNotFoundException, AlreadyAppliedException {
        serverU.userApply(this);
        System.out.println("Your application for room "+server.NameStr()+" is submitted.");
    }

    public void Connect() throws IOException, ClassNotFoundException, AlreadyAppliedException {
        serverU.userApply(this);
    }

    public void FetchRemote(IUser applier) {
    }

    @Deprecated
    public int getReserved() throws RemoteException {
        return 0;
    }

    public boolean isInReserved() throws RemoteException {
        return server.getReserved()==ID;
    }

    public void FetchRemote()throws IOException,ClassNotFoundException{
        server.FetchRemote(this);
    }


    User(int i,int ID,int crowd) throws RemoteException, AlreadyBoundException {
        this("rmi://127.0.0.1:1099/Remote" + (i + 1),ID,crowd);
    }

    User(int i,int ID,int crowd,String loc)throws RemoteException,AlreadyBoundException{
        this("rmi://"+loc+"/Remote" + (i + 1),ID,crowd);
    }

    User(String name,int ID,int crowd) throws RemoteException, AlreadyBoundException {
        super(name);
        this.ID=ID;
        this.crowd=crowd;
        try {
            this.serverU = (RoomUsable) Naming.lookup(name);
            dup=Check(ID,"User");
            if(!dup)Apply();
        }
        catch(AlreadyAppliedException e1){
            throw new AlreadyBoundException();
        }
        catch (Exception e){
            System.out.println("ERROR: Submission failed. Can not connect to the remote server.");
            throw new RemoteException();
        }
    }


    User(int i,int ID) throws RemoteException, MalformedURLException, NotBoundException {
        this("rmi://127.0.0.1:1099/Remote" + (i + 1),ID);
    }

    User(int i,int ID,String loc) throws RemoteException, MalformedURLException, NotBoundException {
        this("rmi://"+loc+"/Remote" + (i + 1),ID);
    }

    User(String name,int ID) throws MalformedURLException, NotBoundException, RemoteException {
        super(name);
        this.ID=ID;
        this.crowd=1;
        try {
            this.serverU = (RoomUsable) Naming.lookup(name);
            dup=Check(ID,"User");
            if(!dup)Connect();
        }
        catch (Exception e){
            System.out.println("ERROR: Can not connect to the remote server.");
            throw new RemoteException();
        }
    }


    @Override
    public void Reconnect(int i) throws IOException, NotBoundException, AlreadyBoundException, ClassNotFoundException {
        Reconnect("rmi://127.0.0.1:1099/Remote"+(i+1));
    }

    @Override
    public void Reconnect(String name) throws IOException, NotBoundException, ClassNotFoundException, AlreadyBoundException {
        super.Reconnect(name);
        try {
            this.serverU = (RoomUsable) Naming.lookup(name);
            dup=Check(ID,"User");
            if(!dup)Apply();
        }
        catch(AlreadyAppliedException e1){
            throw new AlreadyBoundException();
        }
        catch (Exception e){
            System.out.println("ERROR: Submission failed. Can not connect to the remote server.");
            throw new RemoteException();
        }
    }
    @Override
    public void Reconnect(String loc,int i) throws IOException, NotBoundException, AlreadyBoundException, ClassNotFoundException {
        Reconnect("rmi://"+loc+"/Remote"+(i+1));
    }

    /**get UserID*/
    public int getID() throws RemoteException {
        return ID;
    }

    /**get the Number of the crowd*/
    public int getCrowd() {
        return crowd;
    }

    /**Operations*/

    //just for communication to remote obj, not use
    public void userApply(IUser applier) throws AlreadyAppliedException {}

    @Override
    public void userCancel(int ID) throws IOException, ClassNotFoundException{
        serverU.userCancel(ID);}

    @Override
    public void userDisconnect(int ID) throws IOException, ClassNotFoundException {
        serverU.userDisconnect(ID);
    }

    public void DisconnectFromHello() throws IOException, ClassNotFoundException{
        serverU.userCancel(this.ID);
    }

    public void Disconnect()throws IOException,ClassNotFoundException{
        serverU.userDisconnect(this.ID);
    }

    @Override
    public void EndOccupying(int ID) throws IOException, ClassNotFoundException {
        serverU.EndOccupying(ID);
    }

    @Override
    public void RepairReportU(int ID) throws IOException, ClassNotFoundException {
        serverU.RepairReportU(ID);
    }

    /**Overload*/
    public void RepairReportU() throws IOException, ClassNotFoundException {
        serverU.RepairReportU(this.ID);
    }

    /**Update Method*/
    @Override
    public void update(String Message) throws IOException, ClassNotFoundException {
        System.out.print("Hello, User #"+ID+" , the status of room you booked updated:\n"+ Message +"Name: "+server.NameStr()+"\nState: "+server.StateStr()+"\nType: "+server.TypeStr()+"(capacity: "+server.Capacity()+")\n");
    }

    //Not use
    public boolean Check(int ID, String Type) throws IOException {return serverU.Check(ID,"User");}

    /**id Check, via forHello*/
    public boolean Check()throws IOException{
        return serverU.Check(this.ID,"User");
    }

    @Override
    public int NumberOfAppliers() throws IOException, ClassNotFoundException {
        return server.NumberOfAppliers();
    }

    @Override
    public int getCrowdRemote(int UserID) throws IOException, ClassNotFoundException {
        return server.getCrowdRemote(UserID);
    }

}
