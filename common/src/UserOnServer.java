import java.io.IOException;
import java.rmi.Remote;
import java.rmi.RemoteException;
import java.rmi.server.UnicastRemoteObject;

public class UserOnServer extends UnicastRemoteObject implements Remote {
    private final int id;
    private int crowd;
    private IUser onClient;
    private boolean online;

    UserOnServer(int id,int crowd,IUser onClient) throws RemoteException {
        super();
        this.id=id;
        this.crowd=crowd;
        this.onClient=onClient;
        this.online=true;
    }

    public int getCrowd() {
        return crowd;
    }

    public void setCrowd(int crowd) {
        this.crowd=crowd;
    }

    public void update(String Message) throws IOException, ClassNotFoundException {
        onClient.update(Message);
    }

    public int getID() throws RemoteException {
        return id;
    }

    public boolean isOnline() {
        return online;
    }

    public void setOnline(boolean online) {
        this.online = online;
    }

    public void setOnClient(IUser onClient) {
        this.onClient = onClient;
    }

    public IUser getOnClient() {
        return onClient;
    }
}
