import java.rmi.RemoteException;

public class Occupied implements RoomState{
    @Override
    public final String State(){
        return "Guest-Occupied";
    }

    @Override
    public boolean Occupy(RoomContext context) throws RemoteException {
        System.out.println("ERROR_ILLEGAL_ACTION: The room is occupied.");
        return false;
    }

    @Override
    public boolean Cleaning(RoomContext context) throws RemoteException {
        System.out.println("ERROR_ILLEGAL_ACTION: The room does not need cleaning.");
        return false;
    }

    @Override
    public boolean Use(RoomContext context) throws RemoteException {
        System.out.println("The room needs cleaning now.");
        context.setState(new NotClean());
        return true;
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
