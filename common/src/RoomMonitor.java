import java.io.IOException;
import java.rmi.Remote;
import java.rmi.RemoteException;

public interface RoomMonitor extends Remote{
    String NameStr() throws IOException, ClassNotFoundException;
    String StateStr() throws IOException, ClassNotFoundException;
    String TypeStr() throws IOException, ClassNotFoundException;
    int Capacity() throws IOException, ClassNotFoundException;
    String sayHello() throws RemoteException;
    String ToString()throws RemoteException;
    void Tells()throws RemoteException;
}
