import java.io.IOException;
import java.net.MalformedURLException;
import java.rmi.AlreadyBoundException;
import java.rmi.Naming;
import java.rmi.NotBoundException;
import java.rmi.RemoteException;

public class Maintainer extends RoomStub implements RoomMaintainable {
    private final int ID;
    private RoomMaintainable serverM;

    /**Is duplicated*/
    private boolean dup;

    public boolean isDup() {
        return dup;
    }


    Maintainer(int i,int ID) throws RemoteException {
        super(i);
        this.ID=ID;
        try {
            this.serverM = (RoomMaintainable) Naming.lookup("rmi://127.0.0.1:1099/Remote" + (i + 1));
            dup=Check(ID,"Maintainer");
            if(!dup)serverM.maintainerRegister(this);
        }
        catch (Exception e){
            System.out.println("ERROR: Can not connect to the remote server.");
            throw new RemoteException();
        }
    }

    Maintainer(String name,int ID) throws MalformedURLException, NotBoundException, RemoteException {
        super(name);
        this.ID=ID;
        try {
            this.serverM = (RoomMaintainable) Naming.lookup(name);
            dup=Check(ID,"Maintainer");
            if(!dup)serverM.maintainerRegister(this);
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
            this.serverM = (RoomMaintainable) Naming.lookup("rmi://127.0.0.1:1099/Remote" + (i + 1));
            dup=Check(ID,"Maintainer");
            if(!dup)serverM.maintainerRegister(this);
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
            this.serverM = (RoomMaintainable) Naming.lookup(name);
            dup=Check(ID,"Maintainer");
            if(!dup) maintainerRegister(this);
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

    //Not use
    public void RepairComplete(int ID) throws IOException, ClassNotFoundException {
        if(ID==this.ID) serverM.RepairComplete(ID);
        else System.out.println("Incorrect id, try again.");
    }


    //Not use
    public void maintainerRegister(Observable observer) {}

    //Not use
    public void maintainerDisconnect(int ID) throws RemoteException {}

    public void Disconnect()throws RemoteException{
        serverM.maintainerDisconnect(this.ID);
    }

    //Not use
    public boolean Check(int ID, String Type) throws IOException {return serverM.Check(ID,"Maintainer");}

    /**id Check, via forHello*/
    public boolean Check()throws IOException{
        return serverM.Check(this.ID,"Maintainer");
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
