import java.rmi.RemoteException;

public class Clean implements RoomState{
    @Override
    public final String State(){
        return "Empty, Clean";
    }

    @Override
    public boolean Occupy(RoomContext context) throws RemoteException {
        System.out.println("The room is now occupied.");
        context.setState(new Occupied());
        return true;
    }

    @Override
    public boolean Cleaning(RoomContext context) throws RemoteException {
        System.out.println("ERROR_ILLEGAL_ACTION: The room is clean.");
        return false;
    }

    @Override
    public boolean Use(RoomContext context) throws RemoteException {
        System.out.println("ERROR_ILLEGAL_ACTION: The room is empty.");
        return false;
    }

    @Override
    public boolean NeedRepair(RoomContext context) throws RemoteException {
        System.out.println("ERROR_ILLEGAL_ACTION: The room is empty.");
        return false;
    }

    @Override
    public boolean Repair(RoomContext context) throws RemoteException {
        System.out.println("ERROR_ILLEGAL_ACTION: The room does not need repairing.");
        return false;
    }
}
