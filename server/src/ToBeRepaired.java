import java.rmi.RemoteException;

public class ToBeRepaired implements RoomState{
    @Override
    public final String State(){
        return "Needs Repairing";
    }

    @Override
    public boolean Occupy(RoomContext context) throws RemoteException {
        System.out.println("ERROR_ILLEGAL_ACTION: The room needs repairing.");
        return false;
    }

    @Override
    public boolean Cleaning(RoomContext context) throws RemoteException {
        System.out.println("ERROR_ILLEGAL_ACTION: The room needs repairing.");
        return false;
    }

    @Override
    public boolean Use(RoomContext context) throws RemoteException {
        System.out.println("ERROR_ILLEGAL_ACTION: The room needs repairing.");
        return false;
    }

    @Override
    public boolean NeedRepair(RoomContext context) throws RemoteException {
        System.out.println("ERROR_ILLEGAL_ACTION: The room is already needs-repairing state.");
        return false;
    }

    @Override
    public boolean Repair(RoomContext context) throws RemoteException {
        System.out.println("The room is repaired and needs cleaning.");
        context.setState(new NotClean());
        return true;
    }
}
