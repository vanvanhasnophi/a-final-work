import java.io.Serial;
import java.io.Serializable;
public class UserInfo implements Serializable {
    @Serial
    private static final long serialVersionUID = 1L;
    private final int id;
    private final int crowd;

    public UserInfo(int id, int crowd) {
        this.id = id;
        this.crowd = crowd;
    }

    public int getID() {
        return id;
    }

    public int getCrowd() {
        return crowd;
    }
}

