import java.rmi.RemoteException;
import java.rmi.server.UnicastRemoteObject;
public abstract class RoomContext extends UnicastRemoteObject implements
        RoomMonitorWithAppliers,
        RoomManageable,
        RoomUsable,
        RoomMaintainable,
        RoomCleanable
{
    protected int reserved=-1;
    protected RoomState state;
    @Override
    public boolean isReserved(){
        return reserved>=0;
    }
    @Override
    public int getReserved(){
        return reserved;
    }
    public void setReserved(int reserved){
        this.reserved=reserved>=0?reserved:-1;
    }
    @Override
    public String StateStr(){
        return state.State();
    }
    @Override
    public String RichStateStr(){
        return StateStr()+(reserved>=0?"(Reserved)":"");
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
