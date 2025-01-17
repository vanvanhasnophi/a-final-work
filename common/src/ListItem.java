import javax.swing.*;

public interface ListItem {
    int getIndex();
    void setTag(String tag);
    boolean isSelected();
    void setSelected(boolean selected);
    String getTag();
    JButton getButton();
    JCheckBox getCheckBox();
}
