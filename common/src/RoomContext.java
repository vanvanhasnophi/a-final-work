import java.rmi.RemoteException;
import java.rmi.server.UnicastRemoteObject;
public abstract class RoomContext extends UnicastRemoteObject implements
        RoomMonitorWithAppliers,
        RoomManageable,
        RoomUsable,
        RoomMaintainable,
        RoomCleanable
{
    protected RoomState state;
    @Override
    public String StateStr(){
        return state.State();
    }
    @Override
    public abstract String NameStr();
    RoomContext(RoomState state)throws RemoteException {
        this.state = state;
    }
    @Override
    public String sayHello() throws RemoteException {
        return "Server greets!";
    }
    @Override
    public abstract String TypeStr();
    @Override
    public abstract int Capacity();
    public void setState(RoomState state){
        this.state =state;
        System.out.print("The State is "+state.State()+".\n\n");
    }

    public RoomState getState(){
        return state;
    }

}
