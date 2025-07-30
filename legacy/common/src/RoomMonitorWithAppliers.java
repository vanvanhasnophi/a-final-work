import java.io.IOException;
import java.rmi.RemoteException;

public interface RoomMonitorWithAppliers extends RoomMonitor{
    boolean Applying(int UserID) throws IOException, ClassNotFoundException;
    boolean Occupying(int UserID) throws IOException, ClassNotFoundException;
    int NumberOfAppliers()throws IOException,ClassNotFoundException;
    int getCrowdRemote(int UserID)throws IOException,ClassNotFoundException;
    void FetchRemote(IUser applier)throws IOException,ClassNotFoundException;
    boolean isReserved()throws RemoteException;
    int getReserved()throws RemoteException;
}
