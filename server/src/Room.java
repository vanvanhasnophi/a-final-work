import java.io.IOException;
import java.rmi.RemoteException;
import java.util.HashMap;
import java.util.Map;

public class Room extends RoomContext{
    private final int loc;
    private String name;
    private final int type;
    private final int cap;
    private int userID=-1;
    private final HashMap<Integer, Observable> approvers=new HashMap<>();
    private final HashMap<Integer, UserOnServer> appliers=new HashMap<>();
    private final HashMap<Integer, Observable> maintainers=new HashMap<>();
    private final HashMap<Integer, Observable> serviceStaffs=new HashMap<>();

    /**Registration and Disconnection*/
    @Override
    public void approverRegister(Observable observer)throws RemoteException{
        approvers.put(observer.getID(), observer);
    }

    @Override
    public void userApply(IUser applier) throws IOException, ClassNotFoundException, AlreadyAppliedException {
        try{
            System.setProperty("sun.rmi.transport.tcp.responseTimeout", "7000");
            if(appliers.get(applier.getID())!=null) throw new DuplicationException("");
            if(applier.getCrowd()>cap)throw new IndexOutOfBoundsException();
            appliers.put(applier.getID(),new UserOnServer(applier.getID(),applier.getCrowd(),applier));
            if(loc!=0)notifyAllApprovers("User #"+applier.getID()+" is applying room "+name+", please check it in time.");
        }catch(DuplicationException e){
            applier.update("You have already applied for this room.\n");
            throw new AlreadyAppliedException();
        }
        catch(IndexOutOfBoundsException e1){
            applier.update("Too many people for this room!\n");
            throw new RuntimeException();
        }
        catch (RemoteException e3){
            if(appliers.get(applier.getID())==null) applier.update("Failed to answer your request, try again later.\n");
            throw new RuntimeException();
        }
    }

    @Override
    public void maintainerRegister(Observable observer)throws RemoteException{
        maintainers.put(observer.getID(), observer);
    }


    @Override
    public void serviceStaffRegister(Observable observer)throws RemoteException{
        serviceStaffs.put(observer.getID(), observer);
    }

    @Override
    public void approverDisconnect(int ID)throws RemoteException{
        approvers.remove(ID);
    }

    @Override
    public void userCancel(int ID) throws IOException, ClassNotFoundException {
        if(appliers.get(ID)==null)throw new RemoteException();
        if(userID==ID) {
            EndOccupying(ID);
            return;
        }
        appliers.get(ID).getOnClient().update("Your submission for the Room is canceled.\n");
        appliers.remove(ID);
    }

    @Override
    public void userDisconnect(int ID) throws IOException {
        if(appliers.get(ID)==null)throw new RemoteException();
        appliers.get(ID).setOnline(false);
    }


    @Override
    public void maintainerDisconnect(int ID)throws RemoteException{
        maintainers.remove(ID);
    }


    @Override
    public void serviceStaffDisconnect(int ID)throws RemoteException{
        serviceStaffs.remove(ID);
    }

    /**Notification*/
    public void notifyAllApprovers(String Message) throws IOException, ClassNotFoundException {
        for (Map.Entry<Integer, Observable> observer : approvers.entrySet()) {
            observer.getValue().update(Message);
        }
    }

    public void notifyAllAppliers(String Message) {
        for (Map.Entry<Integer, UserOnServer> observer : appliers.entrySet()) {try{
            if(observer.getValue().isOnline())observer.getValue().getOnClient().update(Message);}
        catch (Exception ignored){}
        }
    }
    public void notifyWinner() {
        String message;
        for (Map.Entry<Integer, UserOnServer> observer : appliers.entrySet()) {
            int i=observer.getKey();
            message=(i==userID)?
                    ("Your application for "+NameStr()+" is approved, welcome.\n"):
                    ("Sorry, "+NameStr()+" is occupied, please wait in line.\n");
            try{
            if(observer.getValue().isOnline())observer.getValue().getOnClient().update(message);}
            catch (Exception ignored){}
        }
    }

    public void notifyReserve(){
        try{
        if(appliers.get(reserved).isOnline())appliers.get(reserved).getOnClient().update("Your application for "+NameStr()+" is approved and reserved.\nYou can use it when it is ready.\n");
        }catch (Exception ignored){}
    }
    public void notifyReserveToUse(){
        try{
        if(appliers.get(reserved).isOnline())appliers.get(reserved).getOnClient().update("The room is ready, welcome.\n");}
        catch (Exception ignored){}
    }

    public void notifyAllMaintainers(String Message) throws IOException, ClassNotFoundException {
        for (Map.Entry <Integer,Observable> observer : maintainers.entrySet()) {
            observer.getValue().update(Message);
        }
    }
    public void notifyAllServiceStaffs(String Message) throws IOException, ClassNotFoundException {
        for (Map.Entry <Integer,Observable> observer : serviceStaffs.entrySet()) {
            observer.getValue().update(Message);
        }
    }

    @Override
    public String NameStr(){
        return name;
    }

    @Override
    public String TypeStr() {
        if(type==1)return "Seminar room";
        else if(type==2)return "Case room";
        else if(type==3)return "Lecture room";
        else return "No type";
    }

    @Override
    public int Capacity() {
        return cap;
    }

    @Override
    public int UserID() {
        return userID;
    }


    @Override
    public HashMap<Integer, UserInfo> ApplierList() throws IOException {
        HashMap<Integer, UserInfo> result = new HashMap<>();
        for (Map.Entry<Integer, UserOnServer> entry : appliers.entrySet()) {
            UserOnServer userOnServer = entry.getValue();
            result.put(entry.getKey(), new UserInfo(
                    userOnServer.getID(),
                    userOnServer.getCrowd()
            ));
        }
        return result;
    }

    @Override
    public int Approve(int userID) {
        try{
            if(isReserved()||userID==this.userID)throw new RuntimeException();
            if(StateStr().equals("Empty, Clean")) {
                if (appliers.get(userID) == null) throw new NullPointerException();
                this.userID = userID;
                Occupy(userID);
                notifyWinner();
            }
            else {
                setReserved(userID);
                notifyReserve();
            }
            return 1;
        }
        catch(Exception e){
            return 0;
        }
    }

    @Override
    public int Reject(int userID){
        try{
            if(reserved==userID){
                if (appliers.get(userID) == null) throw new NullPointerException();
                setReserved(-1);
                appliers.remove(userID);
                try{
                appliers.get(userID).getOnClient().update("Sorry, your reservation for " + NameStr() + " is canceled.\n");
                } catch (Exception ignored){}
            }
            else {
                if (userID == this.userID) throw new RuntimeException();
                if (appliers.get(userID) == null) throw new NullPointerException();
                appliers.remove(userID);
                try{
                    appliers.get(userID).getOnClient().update("Sorry, your application for " + NameStr() + " is rejected.\n");
                }catch(Exception ignored){}
            }
            return 1;
        }
        catch(NullPointerException e){
            return 0;
        }
    }

    public int AutoType(int type){
        return Math.max(type,(cap>0?1:0) + (cap>20?1:0) + (cap>75?1:0) + (cap>150?1:0));
    }


    /**Constructor*/
    Room(RoomState state,String Name,int type,int cap,int loc)throws RemoteException{
        super(state);
        System.setProperty("sun.rmi.transport.tcp.responseTimeout", "7000");
        this.name =Name;
        this.cap=cap;
        this.type=AutoType(type);
        this.loc=loc;
    }
    Room()throws RemoteException{
        super(new Clean());
        System.setProperty("sun.rmi.transport.tcp.responseTimeout", "7000");
        this.name="Room";
        this.cap=0;
        this.type=0;
        this.loc=-1;
    }

    Room(int type,int cap,int loc)throws RemoteException{
        super(new Clean());
        System.setProperty("sun.rmi.transport.tcp.responseTimeout", "7000");
        this.name="Room";
        this.cap=cap;
        this.type=AutoType(type);
        this.loc=loc;
    }

    Room(RoomState state,int type,int cap,int loc)throws RemoteException{
        super(state);
        System.setProperty("sun.rmi.transport.tcp.responseTimeout", "7000");
        this.name ="Room";
        this.cap=cap;
        this.type=AutoType(type);
        this.loc=loc;
    }


    Room(String name,int type,int cap,int loc)throws RemoteException{
        super(new Clean());
        System.setProperty("sun.rmi.transport.tcp.responseTimeout", "7000");
        this.name =name;
        this.cap=cap;
        this.type=AutoType(type);
        this.loc=loc;
    }



    /**End Constructor*/

    public void setName(String name) {
        this.name = name;
    }

    public void setUserID(int userID) {
        this.userID = userID;
    }

    public String State(){
        return getState().State();
    }

    public void Occupy(int ID) {
        boolean suc;
        try {
            System.out.print(name+":");
            suc = state.Occupy(this);
            try {
                notifyReserveToUse();
            } catch (Exception ignored){}
        } catch (RemoteException e) {
            throw new RuntimeException(e);
        }
        if(suc){
        setUserID(ID);
        setReserved(-1);
        }
    }

    public boolean Cleaning() {
        boolean suc;
        try {
            suc = state.Cleaning(this);
            if(isReserved()){
                Occupy(getReserved());
            }
        } catch (Exception e) {
            return false;
        }
        if(suc){
            System.out.print(name+":");
            if(StateStr().equals("Empty, Clean"))setUserID(-1);
        }
        return suc;
    }
    public boolean Use(int ID) {
        if(ID!=userID)return false;
        try {
            if(state.Use(this)){
                System.out.print(name+":");
                setUserID(-1);
                return true;
            }
            else return false;
        } catch (RemoteException e) {
            throw new RuntimeException(e);
        }
    }
    public boolean NeedRepair(){
        boolean suc;
        try {
            suc = state.NeedRepair(this);
        } catch (RemoteException e) {
            throw new RuntimeException(e);
        }
        if(suc){
            System.out.print(name+":");
            setUserID(-1);
            return true;
        }
        else return false;
    }
    public boolean Repair(){
        boolean suc;
        try {
            suc = state.Repair(this);
        } catch (RemoteException e) {
            throw new RuntimeException(e);
        }
        if(suc){
            System.out.print(name+":");
            setUserID(-1);
            return true;
        }
        else return false;
    }

    @Override
    public void CleaningComplete(int ID) throws IOException, ClassNotFoundException {
        if(Cleaning()) notifyAllServiceStaffs(NameStr()+" is cleaned by Service Staffs #"+ID+" .\n");
        else serviceStaffs.get(ID).update("ERROR: Failed to set cleaned status, or not need cleaning, if necessary, contact the supporters.\n");
        notifyAllMaintainers(NameStr()+" is cleaned, not need repairing.\n");
        if(StateStr().equals("Guest-Occupied")){
            notifyAllApprovers(NameStr()+" is cleaned, ready for the reserved user.\n");
        }
        else{
            notifyAllAppliers(NameStr()+" is cleaned, ready to use.\n");
            notifyAllApprovers(NameStr()+" is cleaned, ready to use.\n");
        }
    }

    @Override
    public void RepairReportC(int ID) throws IOException, ClassNotFoundException {
        if(NeedRepair()) notifyAllMaintainers(NameStr()+" need repairing.\n");
        else {
            serviceStaffs.get(ID).update("ERROR: Failed to report, contact the supporters.\n");
            throw new RemoteException();
        }
    }

    @Override
    public void RepairComplete(int ID) throws IOException, ClassNotFoundException {
        if(Repair()) notifyAllServiceStaffs(NameStr()+" is just repaired, now needs cleaning.\n");
        else {
            maintainers.get(ID).update("Failed to set status, contact the supporters.");
            throw new RemoteException();
        }
    }

    @Override
    public void EndOccupying(int ID) throws IOException, ClassNotFoundException {
        if(Use(ID)){
            notifyAllServiceStaffs(NameStr()+" just ended using, now needs cleaning.\n");
            appliers.remove(ID);
        }
        else appliers.get(ID).update("ERROR: No certification, or something went wrong in room status, contact the supporters.\n");
    }

    @Override
    public void RepairReportU(int ID) throws IOException, ClassNotFoundException {
        if(NeedRepair()) notifyAllMaintainers(NameStr()+" need repairing.\n");
        else {
            appliers.get(ID).update("ERROR: Failed to report, contact the supporters.\n");
            throw new RemoteException();
        }
    }


    @Override
    public String ToString() {
        return "{" +
                "Name: " + name  +
                ", Type: " + type+"("+TypeStr()+")"+
                ", Cap: " + cap +
                ", State: " + StateStr() +
                '}';
    }

    @Override
    public void Tells() throws RemoteException {
        System.out.println("Someone use /tell told something.\nWish him/her and you a nice day!");
    }

    @Override
    public boolean Check(int ID, String Type) {
        return switch (Type) {
            case "User" -> appliers.get(ID) != null;
            case "Approver" -> approvers.get(ID) != null;
            case "Maintainer" -> maintainers.get(ID) != null;
            case "ServiceStaff" -> serviceStaffs.get(ID) != null;
            default -> false;
        };
    }

    @Override
    public boolean Applying(int UserID) {
        return appliers.get(UserID)!=null&&this.UserID()!=UserID;
    }

    @Override
    public boolean Occupying(int UserID) {
        return appliers.get(UserID)!=null&&this.UserID()==UserID;
    }

    @Override
    public int NumberOfAppliers() {
        int count=StateStr().equals("Occupied")?-1:0;
        for (Map.Entry<Integer, UserOnServer> observer : appliers.entrySet()) {
            if(observer!=null)count++;
        }
        return count;
    }

    @Override
    public int getCrowdRemote(int UserID) {
        return appliers.get(UserID).getCrowd();
    }

    @Override
    public void FetchRemote(IUser applier) throws IOException, ClassNotFoundException {
        try{
            if(appliers.get(applier.getID())!=null){
                appliers.get(applier.getID()).setOnClient(applier);
                appliers.get(applier.getID()).setOnline(true);
            }
            else throw new NullPointerException();
        }catch (Exception e){
            applier.update("Cannot fetch the remote user info.\n");
        }
    }
}
