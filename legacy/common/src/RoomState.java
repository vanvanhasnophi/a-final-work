import java.rmi.Remote;
import java.rmi.RemoteException;

public interface RoomState extends Remote {
    String State();
    boolean Occupy(RoomContext context)throws RemoteException;
    boolean Cleaning(RoomContext context)throws RemoteException;
    boolean Use(RoomContext context)throws RemoteException;
    boolean NeedRepair(RoomContext context)throws RemoteException;
    boolean Repair(RoomContext context)throws RemoteException;
}
