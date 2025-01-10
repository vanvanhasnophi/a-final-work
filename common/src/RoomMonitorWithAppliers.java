import java.io.IOException;

public interface RoomMonitorWithAppliers extends RoomMonitor{
    boolean Applying(int UserID) throws IOException, ClassNotFoundException;
    boolean Occupying(int UserID) throws IOException, ClassNotFoundException;
    int NumberOfAppliers()throws IOException,ClassNotFoundException;
    int getCrowdRemote(int UserID)throws IOException,ClassNotFoundException;
    void FetchRemote(IUser applier)throws IOException,ClassNotFoundException;
}
