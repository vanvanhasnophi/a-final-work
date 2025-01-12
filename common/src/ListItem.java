import javax.swing.*;

public interface ListItem {
    int getIndex();
    void setTag(String tag);
    String getTag();
    JButton getButton();
    JCheckBox getCheckBox();
}
