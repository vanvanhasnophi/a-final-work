import java.rmi.Remote;
import java.io.IOException;

public interface IUser extends Observable, RoomUsable, Remote {
    int getCrowd()throws IOException;
}
