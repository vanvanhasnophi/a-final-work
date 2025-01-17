import java.awt.*;

public interface settable {
    void Apply();
    void Load(String Home);
    void discFromSet();
    int getID();
    Color getAccent();
    void setLocale(String locale);
}
