import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionListener;

public class MetroListPanel extends ButtonListPanel{
    final int Side;
    MetroListPanel(String title,boolean isTitleVisible){
        this(title,isTitleVisible,NULL);
    }
    MetroListPanel(int Side,String title,boolean isTitleVisible){
        this(Side,title,isTitleVisible,NULL);
    }
    MetroListPanel(int Side,String title,boolean isTitleVisible,int selectPolicy) {
        super(title,selectPolicy);
        ListScroll.setBorder(BorderFactory.createEmptyBorder());
        this.title.setVisible(isTitleVisible);
        this.ListContainer.setLayout(new FlowLayout(FlowLayout.LEFT,5,5));
        this.Side=Side;
    }
    MetroListPanel(String title,boolean isTitleVisible,int selectPolicy) {
        this(20,title,isTitleVisible,selectPolicy);
    }
    MetroListPanel(int selectPolicy){
        this("",false,selectPolicy);
    }
    MetroListPanel(int Side,int selectPolicy){
        this(Side,"",false,selectPolicy);
    }

    @Override
    public void add(int index, ListItem item){
        List.put(index,item);
        ListContainer.add(item.getButton());
        item.getButton().setVisible(true);
        SwingUtilities.updateComponentTreeUI(this);
    }
    public void add(int index, String tag, String Text, ActionListener aListener,Color background){
        MetroListItem newItem=new MetroListItem(index, tag, Text, aListener,background,selectPolicy,this,Side);
        List.put(index,newItem);
        ListContainer.add(newItem);
        newItem.setVisible(true);
        SwingUtilities.updateComponentTreeUI(this);
    }
}
