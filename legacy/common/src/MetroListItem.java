import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionListener;

@SuppressWarnings("FieldCanBeLocal")
public class MetroListItem extends JButton implements ListItem,Selection{
    private final int index;
    private String tag;
    private boolean selected;
    private final int selectPolicy;
    private final Selection father;
    @Override
    public boolean isSelected(){
        return selected;
    }
    @Override
    public void setSelected(boolean selected){
        this.selected=selected;
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

    MetroListItem(int index, String tag, String Text, ActionListener aListener, Color Background, int selectPolicy, Selection father,int side){
        putClientProperty("Button.hoverBackground",null);
        setFocusPainted(false);
        this.index=index;
        this.tag=tag;
        this.selectPolicy = selectPolicy;
        this.father = father;
        addActionListener(e->{
            if(selectPolicy==CHECK)select(index);
            else if(selectPolicy==UNIQUE)uniqueSelect(index);
        });
        setPreferredSize(new Dimension(side,side));
        setMinimumSize(new Dimension(side,side));
        setBackground(Background);
        addActionListener(aListener);
        setText(Text);
        setFont(PresFont.symbolText);
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
