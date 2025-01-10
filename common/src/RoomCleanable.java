import java.io.IOException;
import java.rmi.Remote;
import java.rmi.RemoteException;

public interface RoomCleanable extends Remote,ICheck {
    void CleaningComplete(int ID) throws IOException, ClassNotFoundException;
    void RepairReportC(int ID) throws IOException, ClassNotFoundException;
    void serviceStaffRegister(Observable observer) throws RemoteException;
    void serviceStaffDisconnect(int ID)throws RemoteException;
}
