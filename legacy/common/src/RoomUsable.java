import java.io.IOException;
import java.rmi.Remote;

public interface RoomUsable extends Remote,ICheck {
    void userApply(IUser applier) throws IOException, ClassNotFoundException, AlreadyAppliedException;
    void EndOccupying(int ID) throws IOException, ClassNotFoundException;
    void RepairReportU(int ID) throws IOException, ClassNotFoundException;
    void userCancel(int ID) throws IOException, ClassNotFoundException;
    void userDisconnect(int ID)throws  IOException,ClassNotFoundException;
}
