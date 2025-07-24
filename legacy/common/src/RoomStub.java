import java.io.IOException;
import java.rmi.AlreadyBoundException;
import java.rmi.Naming;
import java.rmi.NotBoundException;
import java.rmi.RemoteException;
import java.rmi.server.UnicastRemoteObject;

public abstract class RoomStub extends UnicastRemoteObject implements RoomMonitorWithAppliers, Observable{
    /**remote obj*/
    RoomMonitorWithAppliers server;
    private boolean connected=false;

    /**Initialize and reconnect*/
    public RoomStub() throws RemoteException {
        super();
    }
    public RoomStub(int i) throws RuntimeException, RemoteException {
        this("rmi://127.0.0.1:1099/Remote"+(i+1));
    }
    public RoomStub(String name) throws RuntimeException, RemoteException {
        try{
            this.server= (RoomMonitorWithAppliers) Naming.lookup(name);
            this.connected=true;
        }
        catch(Exception e){
            System.out.println("ERROR: Can not connect to the remote server.");
            this.connected=false;
        }
    }

    public RoomStub(String loc,int i)throws RemoteException{
        this("rmi://"+loc+"/Remote"+(i+1));
    }


    public void Reconnect(int i) throws RuntimeException, IOException, NotBoundException, AlreadyBoundException, ClassNotFoundException {
        Reconnect("rmi://127.0.0.1:1099/Remote"+(i+1));
    }
    public void Reconnect(String name) throws RuntimeException, IOException, NotBoundException, ClassNotFoundException, AlreadyBoundException {
        try{
            this.server= (RoomMonitorWithAppliers) Naming.lookup(name);
            this.connected=true;
        }
        catch(Exception e){
            System.out.println("ERROR: Can not connect to the remote server.");
            this.connected=false;
        }
    }

    public void Reconnect(String loc,int i) throws IOException, AlreadyBoundException, NotBoundException, ClassNotFoundException {
        Reconnect("rmi://127.0.0.1:1099/Remote"+(i+1));
    }

    /**Monitor*/
    @Override
    public boolean isReserved() throws RemoteException {
        return server.isReserved();
    }
    @Override
    public String StateStr() throws IOException, ClassNotFoundException {
        return server.StateStr();
    }
    @Override
    public String RichStateStr() throws IOException, ClassNotFoundException {
        return server.RichStateStr();
    }

    @Override
    public String TypeStr() throws IOException, ClassNotFoundException {
        return server.TypeStr();
    }

    @Override
    public int Capacity() throws IOException, ClassNotFoundException {
        return server.Capacity();
    }

    @Override
    public String NameStr() throws IOException, ClassNotFoundException {
        return server.NameStr();
    }

    @Override
    public String ToString()throws RemoteException{
        return server.ToString();
    }

    @Override
    public boolean Applying(int UserID) throws IOException, ClassNotFoundException {
        return server.Applying(UserID);
    }

    @Override
    public boolean Occupying(int UserID) throws IOException, ClassNotFoundException {
        return server.Occupying(UserID);
    }

    /**Response from server*/
    public String sayHello() throws RemoteException {
        return "Server greets!";
    }

    /**isConnected*/
    public boolean isConnected() {
        return connected;
    }

    /**Observer*/
    public abstract void update(String Message) throws IOException, ClassNotFoundException;

    @Override
    public void Tells()throws RemoteException{
        server.Tells();
    }
}
