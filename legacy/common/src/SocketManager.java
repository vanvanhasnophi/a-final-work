public class SocketManager {
    String socket;
    SocketManager(){
        socket="127.0.0.1:1099";
    }

    SocketManager(String socket){
        this.socket=socket;
    }

    public void setSocket(String socket) {
        this.socket = socket;
    }

    public String getSocket() {
        return socket;
    }
}
