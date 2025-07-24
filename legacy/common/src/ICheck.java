import java.io.IOException;
import java.rmi.Remote;
public interface ICheck extends Remote{
    boolean Check(int ID,String Type) throws IOException;
}
