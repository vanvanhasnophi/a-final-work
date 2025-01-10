import java.io.IOException;
import java.net.MalformedURLException;
import java.rmi.AlreadyBoundException;
import java.rmi.Naming;
import java.rmi.NotBoundException;
import java.rmi.RemoteException;
import java.util.HashMap;

public class Approver extends RoomStub implements RoomManageable{
    /**remote obj*/
    private RoomManageable serverA;

    /**Is duplicated*/
    private boolean dup;

    public boolean isDup() {
        return dup;
    }

    /**Approver id*/
    private final int ID;


    /**Initialize and reconnect*/

    Approver(int i,int ID) throws RemoteException {
        super(i);
        this.ID=ID;
        try {
            this.serverA = (RoomManageable) Naming.lookup("rmi://127.0.0.1:1099/Remote" + (i + 1));
            dup=Check(ID,"Approver");
            if(!dup)serverA.approverRegister(this);
        }
        catch (Exception e){
            System.out.println("ERROR: Can not connect to the remote server.");
            throw new RemoteException();
        }
    }

    Approver(String name,int ID) throws MalformedURLException, NotBoundException, RemoteException {
        super(name);
        this.ID=ID;
        try {
            this.serverA = (RoomManageable) Naming.lookup(name);
            dup=Check(ID,"Approver");
            if(!dup)serverA.approverRegister(this);
        }
        catch (Exception e){
            System.out.println("ERROR: Can not connect to the remote server.");
            throw new RemoteException();
        }
    }


    @Override
    public void Reconnect(int i) throws MalformedURLException, NotBoundException, RemoteException, AlreadyBoundException {
        super.Reconnect(i);
        try {
            this.serverA = (RoomManageable) Naming.lookup("rmi://127.0.0.1:1099/Remote" + (i + 1));
            dup=Check(ID,"Approver");
            if(!dup)serverA.approverRegister(this);
        }
        catch (Exception e){
            System.out.println("ERROR: Can not connect to the remote server.");
            throw new RemoteException();
        }
    }

    @Override
    public void Reconnect(String name) throws IOException, NotBoundException, ClassNotFoundException, AlreadyBoundException {
        super.Reconnect(name);
        try {
            this.serverA = (RoomManageable) Naming.lookup(name);
            dup=Check(ID,"Approver");
            if(!dup)serverA.approverRegister(this);
        }
        catch (Exception e){
            System.out.println("ERROR: Can not connect to the remote server.");
            serverA.approverRegister(this);
            throw new RemoteException();
        }
    }



    /**User id of a room*/
    @Override
    public int UserID() throws IOException, ClassNotFoundException {
        return serverA.UserID();
    }

    /**Approver id*/
    @Override
    public int getID() throws RemoteException {
        return ID;
    }

    /**
     * Get list
     */
    public HashMap<Integer, UserInfo> ApplierList() throws IOException, ClassNotFoundException {
        return serverA.ApplierList();
    }


    /**Operations*/
    public int Approve(int userID)throws IOException, ClassNotFoundException{
        int i=serverA.Approve(userID);
        if(i==1)System.out.println("Approved user #"+ userID +" 's request.");
        else System.out.println("ERROR: userID not found.");
        return i;
    }

    public int Reject(int userID)throws IOException, ClassNotFoundException{
        int i=serverA.Reject(userID);
        if(i==1)System.out.println("Rejected user #"+ userID +" 's request.");
        else System.out.println("ERROR: userID not found.");
        return i;
    }

    //just for communication to remote obj, not use
    public void approverRegister(Observable observer) { }

    //Not use
    public void approverDisconnect(int ID)throws RemoteException{}

    public void Disconnect()throws RemoteException{
        serverA.approverDisconnect(this.ID);
    }

    /**Update Method*/
    @Override
    public void update(String Message) throws IOException, ClassNotFoundException {
        System.out.print(server.NameStr()+" updated: "+Message+"\nCurrent status:\nName: "+server.NameStr()+"\nState: "+server.StateStr()+"\nType: "+server.TypeStr()+"(capacity: "+server.Capacity()+")\n");
    }

    //Not use
    public boolean Check(int ID, String Type) throws IOException {return serverA.Check(ID,"Approver");}

    /**id Check, via forHello*/
    public boolean Check()throws IOException{
        return serverA.Check(this.ID,"Approver");
    }

    @Override
    public int NumberOfAppliers() throws IOException, ClassNotFoundException {
        return server.NumberOfAppliers();
    }

    @Override
    public int getCrowdRemote(int UserID) {
        return -3;
    }

    //Coming soon
    @Override
    public void FetchRemote(IUser applier) {
    }

    @Override
    public int getReserved() throws RemoteException {
        return server.getReserved();
    }

}
