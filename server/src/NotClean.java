import java.rmi.RemoteException;

public class NotClean implements RoomState{
    @Override
    public final String State(){
        return "Needs Cleaning";
    }

    @Override
    public boolean Occupy(RoomContext context) throws RemoteException {
        System.out.println("ERROR_ILLEGAL_ACTION: The room is not clean.");
        return false;
    }

    @Override
    public boolean Cleaning(RoomContext context) throws RemoteException {
        System.out.println("The room is cleaned.");
        context.setState(new Clean());
        return true;
    }

    @Override
    public boolean Use(RoomContext context) throws RemoteException {
        System.out.println("ERROR_ILLEGAL_ACTION: The room is not clean.");
        return false;
    }

    @Override
    public boolean NeedRepair(RoomContext context) throws RemoteException {
        System.out.println("The room needs repairing now.");
        context.setState(new ToBeRepaired());
        return true;
    }

    @Override
    public boolean Repair(RoomContext context) throws RemoteException {
        System.out.println("ERROR_ILLEGAL_ACTION: The room does not need repairing.");
        return false;
    }
}
