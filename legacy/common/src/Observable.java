import java.io.IOException;
import java.rmi.Remote;
import java.rmi.RemoteException;

public interface Observable extends Remote {
    void update(String Message) throws IOException, ClassNotFoundException;
    int getID()throws RemoteException;
}
