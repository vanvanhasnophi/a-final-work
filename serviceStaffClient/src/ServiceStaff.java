import java.io.IOException;
import java.net.MalformedURLException;
import java.rmi.AlreadyBoundException;
import java.rmi.Naming;
import java.rmi.NotBoundException;
import java.rmi.RemoteException;

public class ServiceStaff extends RoomStub implements RoomCleanable{
    /**remote obj*/
    private RoomCleanable serverS;

    /**ServiceStaff id*/
    private final int ID;

    /**Is duplicated*/
    private boolean dup;

    public boolean isDup() {
        return dup;
    }

    /**Initialize and reconnect*/

    ServiceStaff(int i,int ID) throws RemoteException {
        super(i);
        this.ID=ID;
        try {
            this.serverS = (RoomCleanable) Naming.lookup("rmi://127.0.0.1:1099/Remote" + (i + 1));
            dup=Check(ID,"ServiceStaff");
            if(!dup)serverS.serviceStaffRegister(this);
        }
        catch (Exception e){
            System.out.println("ERROR: Can not connect to the remote server.");
            throw new RemoteException();
        }
    }

    ServiceStaff(String name,int ID) throws MalformedURLException, NotBoundException, RemoteException {
        super(name);
        this.ID=ID;
        try {
            this.serverS = (RoomCleanable) Naming.lookup(name);
            dup=Check(ID,"ServiceStaff");
            if(!dup)serverS.serviceStaffRegister(this);
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
            this.serverS = (RoomCleanable) Naming.lookup("rmi://127.0.0.1:1099/Remote" + (i + 1));
            dup=Check(ID,"ServiceStaff");
            if(!dup)serverS.serviceStaffRegister(this);
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
            this.serverS = (RoomCleanable) Naming.lookup(name);
            dup=Check(ID,"ServiceStaff");
            if(!dup)serverS.serviceStaffRegister(this);
        }
        catch (Exception e){
            System.out.println("ERROR: Can not connect to the remote server.");
            throw new RemoteException();
        }
    }

    public int getID() throws RemoteException {
        return ID;
    }
    @Override
    public void update(String Message) throws IOException, ClassNotFoundException {
        System.out.print(server.NameStr()+" updated: "+Message+"\nCurrent status:\nName: "+server.NameStr()+"\nState: "+server.StateStr()+"\nType: "+server.TypeStr()+"(capacity: "+server.Capacity()+")\n");
    }

    @Override
    public void CleaningComplete(int ID) throws IOException, ClassNotFoundException {
        if(this.ID==ID)serverS.CleaningComplete(ID);
        else System.out.println("Incorrect id, try again.");
    }

    //Not use
    public void RepairReportC(int ID) {

    }

    /**Overload*/
    public void RepairReportC() throws IOException, ClassNotFoundException{
        serverS.RepairReportC(this.ID);
    }

    //Not use
    public void serviceStaffRegister(Observable observer) {}

    //Not use
    public void serviceStaffDisconnect(int ID)throws RemoteException{}

    public void Disconnect()throws RemoteException{
        serverS.serviceStaffDisconnect(this.ID);
    }

    //Not use
    public boolean Check(int ID, String Type) throws IOException {return serverS.Check(ID,"ServiceStaff");}

    /**id Check, via forHello*/
    public boolean Check()throws IOException{
        return serverS.Check(this.ID,"ServiceStaff");
    }

    @Override
    public int NumberOfAppliers() {
        return -1;
    }

    @Override
    public int getCrowdRemote(int UserID) {
        return -3;
    }

    @Override
    public void FetchRemote(IUser applier) {

    }

}
