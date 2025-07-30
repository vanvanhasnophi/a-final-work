import java.io.IOException;
import java.rmi.Remote;
import java.rmi.RemoteException;
import java.util.HashMap;

public interface RoomManageable extends Remote,ICheck {
    int Approve(int userID)throws IOException, ClassNotFoundException;
    int Reject(int userID)throws IOException, ClassNotFoundException;
    void approverRegister(Observable observer) throws RemoteException;
    int UserID() throws IOException, ClassNotFoundException;
    void approverDisconnect(int ID)throws RemoteException;
     HashMap<Integer,UserInfo> ApplierList() throws IOException, ClassNotFoundException;
}
