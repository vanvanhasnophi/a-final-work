import javax.swing.*;
import javax.swing.border.LineBorder;
import java.awt.*;
import java.awt.event.ActionListener;

public class ButtonListItem extends JButton implements ListItem{
    private final int index;
    private String tag;
    @Override
    public int getIndex(){
        return index;
    }

    @Override
    public void setTag(String tag) {
        this.tag = tag;
    }

    @Override
    public String getTag() {
        return tag;
    }

    @Override
    public JButton getButton() {
        return this;
    }

    @Override
    public JCheckBox getCheckBox() {
        return null;
    }

    ButtonListItem(int index, String tag, String Text, ActionListener aListener){
        this.index=index;
        this.tag=tag;
        setPreferredSize(new Dimension(100,11));
        setBackground(new Color(0x00FFFFFF, true));
        setBorder(new LineBorder(Color.WHITE,0));
        addActionListener(aListener);
        System.out.println(tag);
        switch(tag){
            case "Reserved":{
                setText("  "+Text+"(Reserved)");
                setFont(PresFont.fntBldText.fontName());
                setForeground(PresColor.BLUE.value());
                break;
            }
            case "Occupying":{
                setText("  "+Text+"(Occupying)");
                setFont(PresFont.fntBldText.fontName());
                setForeground(PresColor.GREEN.value());
                break;
            }
            case "NotExecuted":{
                setText("  "+Text+"(To be executed)");
                setFont(PresFont.fntBldText.fontName());
                setForeground(PresColor.YELLOW.value());
                break;
            }
            case "Applying":{
                setText("  "+Text+"(Applying)");
                setFont(PresFont.fntBldText.fontName());
                setForeground(PresColor.ROSE.value());
                break;
            }
            case "null":{
                setFont(PresFont.fntBld.fontName());
                setForeground(PresColor.RED.value());
                break;
            }
            default:{
                setText("  "+Text);
                setForeground(PresColor.FORE.value());
                setFont(PresFont.fntText.fontName());
                break;
            }
        }
    }
}
