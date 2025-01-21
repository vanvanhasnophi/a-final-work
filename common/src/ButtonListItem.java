import javax.swing.*;
import javax.swing.border.LineBorder;
import java.awt.*;
import java.awt.event.ActionListener;

@SuppressWarnings("FieldCanBeLocal")
public class ButtonListItem extends JButton implements ListItem,Selection{
    private final int index;
    private String tag;
    private boolean selected;
    private final int selectPolicy;
    private final Selection father;
    private final Color fore;
    @Override
    public boolean isSelected(){
        return selected;
    }
    @Override
    public void setSelected(boolean selected){
        this.selected=selected;
        if(this.selected) {
            this.setBackground(fore);
            this.setForeground(PresColor.SELECTEDFORE.value());
        }
        else{
            this.setBackground(PresColor.NULL.value());
            this.setForeground(fore);
        }
    }
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

    ButtonListItem(int index, String tag, String Text, ActionListener aListener, int selectPolicy, Selection father){
        this.index=index;
        this.tag=tag;
        this.selectPolicy = selectPolicy;
        this.father = father;
        addActionListener(e->{
            if(selectPolicy==CHECK)select(index);
            else if(selectPolicy==UNIQUE)uniqueSelect(index);
        });
        setHorizontalAlignment(LEFT);
        setPreferredSize(new Dimension(100,15));
        setMinimumSize(new Dimension(100,15));
        setBackground(new Color(0x00FFFFFF, true));
        setBorder(new LineBorder(Color.WHITE,0));
        addActionListener(aListener);
        switch(tag){
            case "Reserved":{
                setText(" "+Text+"(Reserved)");
                setFont(PresFont.fntBldText);
                fore=PresColor.BLUE.value();
                break;
            }
            case "Occupying":{
                setText(" "+Text+"(Occupying)");
                setFont(PresFont.fntBldText);
                fore=PresColor.GREEN.value();
                break;
            }
            case "NotExecuted":{
                setText(" "+Text+"(To be executed)");
                setFont(PresFont.fntBldText);
                fore=PresColor.YELLOW.value();
                break;
            }
            case "Applying":{
                setText(" "+Text+"(Applying)");
                setFont(PresFont.fntBldText);
                fore=PresColor.ROSE.value();
                break;
            }
            case "null":{
                setText(" "+Text);
                setFont(PresFont.fntBld);
                fore=PresColor.WARNING.value();
                break;
            }
            default:{
                setText(" "+Text);
                fore=PresColor.FORE.value();
                setFont(PresFont.fntText);
                break;
            }
        }
        setForeground(fore);
    }

    @Override
    public void select(int index) {
        father.select(index);
    }

    @Override
    public void uniqueSelect(int index) {
        father.uniqueSelect(index);
    }
}
