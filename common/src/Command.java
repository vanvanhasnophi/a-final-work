public interface Command {
    boolean conductible(String command);
    void conduct(String command);
}
