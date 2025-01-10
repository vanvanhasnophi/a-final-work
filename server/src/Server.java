import java.net.MalformedURLException;
import java.rmi.Naming;
import java.rmi.RemoteException;
import java.rmi.registry.LocateRegistry;
import java.util.Scanner;

class Rooms {
    private final Room[] List;
    private final int count;
    public Rooms(int count) throws RemoteException {
        this.count=count;
        List=new Room[count];
        System.out.print("--------------\nReminder: capacity<->type\n<=20  Seminar Room (1)\n<=75  Case Room (2)\n<=150 Lecture Room (3)\n--------------\n");
        for(int i=0;i<count;i++) {
            java.util.Scanner roomScanner=new Scanner(System.in);
            System.out.println("Input the type and capacity of room "+i+":");
            int type=roomScanner.nextInt();
            int cap=roomScanner.nextInt();
            List[i] = new Room("Room " + i,type,cap,1);
        }
        System.out.println("Rooms initialized.");
    }
    public void Socket(int start) throws MalformedURLException, RemoteException {
        for(int i=0;i<count;i++) Naming.rebind("rmi://127.0.0.1:1099/Remote"+(start+i), List[i]);
    }
    public void Rename(int i,String name){
        List[i].setName(name);
        System.out.println("Room "+i+" Renamed.\nThe new name is: "+name);
    }
    public String getName(int i){
        return List[i].NameStr();
    }

    public String getType(int i){
        return List[i].TypeStr();
    }

    public int getCap(int i){
        return List[i].Capacity();
    }

    public void Occupy(int i){
        List[i].setUserID(-2);
        List[i].Occupy(-2);
    }
    public void NeedRepair(int i){
        List[i].NeedRepair();
    }
    public void Repair(int i){
        List[i].Repair();
    }
    public void Use(int i){
        List[i].setUserID(-2);
        List[i].Use(-2);
    }
    public void Cleaning(int i){
        List[i].Cleaning();
    }

    public void Show(int i){
        System.out.print("(Room "+i+")\nName: "+List[i].NameStr()+"\nState: "+List[i].StateStr()+"\nType: "+List[i].TypeStr()+"\nCapacity: "+List[i].Capacity()+"\n");
    }

    public void ShowAll(){
        for(int i=0;i<count;i++)System.out.print("Name: "+List[i].NameStr()+"\nState: "+List[i].StateStr()+"\nType: "+List[i].TypeStr()+"\nCapacity: "+List[i].Capacity()+"\n\n");
        System.out.println();
    }
}
/**Also Skeleton**/
@SuppressWarnings("FieldCanBeLocal")
public class Server {
    private static int Count;
    public static void Line(){
        System.out.println("\n---------------\n");
    }


    public static void main(String[] args) throws RemoteException, MalformedURLException,RuntimeException {
        //TestRoom();
        System.setProperty("sun.rmi.transport.tcp.responseTimeout", "7000");
        Count=1;
        Room forHello=new Room("Hello",0,1000,0);
        LocateRegistry.createRegistry(1099);
        Naming.rebind("rmi://127.0.0.1:1099/Remote0",forHello);
        java.util.Scanner s=new java.util.Scanner(System.in);
        System.out.print("Creating Rooms, input the number of rooms: ");
        int count=s.nextInt();
        Rooms h1=new Rooms(count);
        h1.Socket(Count);
        Count+=count;
        while(true){
            Line();
            System.out.println("""
                    Choose a room, and its operation:
                    0 - show all
                    1 - get info
                    2 - rename
                    3 - occupy
                    4 - use
                    5 - clean
                    6 - need repairing
                    7 - repair
                    input negative room number to exit...
                    """);
            Line();
            int n=s.nextInt();
            int op=s.nextInt();
            if(n<0)break;
            try {
                switch (op) {
                    case 0: {
                        h1.ShowAll();
                        break;
                    }
                    case 1: {
                        h1.Show(n);
                        break;
                    }
                    case 2: {
                        System.out.println("Input New Name of Room " + n + " (aka " + h1.getName(n) + "): ");
                        java.util.Scanner s1 = new java.util.Scanner(System.in);
                        String NewName = s1.nextLine();
                        h1.Rename(n, NewName);
                        break;
                    }
                    case 3: {
                        h1.Occupy(n);
                        break;
                    }
                    case 4: {
                        h1.Use(n);
                        break;
                    }
                    case 5: {
                        h1.Cleaning(n);
                        break;
                    }
                    case 6: {
                        h1.NeedRepair(n);
                        break;
                    }
                    case 7: {
                        h1.Repair(n);
                        break;
                    }
                    default: {
                        System.out.println("Illegal operation number!!!");
                        break;
                    }
                }
            }catch (ArrayIndexOutOfBoundsException e){
                System.out.println("Illegal room number!!!");
            }
        }
        System.exit(0);
    }
}