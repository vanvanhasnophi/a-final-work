import java.io.IOException;
import java.rmi.Remote;
import java.rmi.RemoteException;

public interface RoomMaintainable extends Remote,ICheck {
    void RepairComplete(int ID) throws IOException, ClassNotFoundException;
    void maintainerRegister(Observable observer) throws RemoteException;
    void maintainerDisconnect(int ID)throws RemoteException;
}
