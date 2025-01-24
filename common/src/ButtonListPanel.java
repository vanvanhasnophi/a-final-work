import javax.swing.*;
import java.awt.event.ActionListener;

public class ButtonListPanel extends ListPanel implements Selection {
    protected final int selectPolicy;
    ButtonListPanel(String title){this(title, NULL);}
    ButtonListPanel(String title,int selectPolicy){
        super(title);
        this.selectPolicy=selectPolicy;
    }
    @Override
    public void add(int index, ListItem item){
        List.put(index,item);
        ListContainer.add(item.getButton());
        ListContainer.add(Box.createVerticalStrut(10));
        item.getButton().setVisible(true);
        SwingUtilities.updateComponentTreeUI(this);
    }
    public void add(int index, String tag, String Text, ActionListener aListener){
        ButtonListItem newItem=new ButtonListItem(index, tag, Text, aListener,selectPolicy,this);
        List.put(index,newItem);
        ListContainer.add(newItem);
        newItem.setVisible(true);
        SwingUtilities.updateComponentTreeUI(this);
    }
    @Override
    public void remove(int index){
        if(selectedIndex.contains(index))selectedIndex.remove((Integer) index);
        ListContainer.remove(List.get(index).getButton());
        List.remove(index);
        SwingUtilities.updateComponentTreeUI(this);
    }
    @Override
    public void select(int index){
        if(!List.get(index).isSelected()){
            List.get(index).setSelected(true);
            selectedIndex.addLast(index);
        }else{
            List.get(index).setSelected(false);
            selectedIndex.remove((Integer)index);
        }
        SwingUtilities.updateComponentTreeUI(this);
    }
    @Override
    public void uniqueSelect(int index){
        if(index>=0&&List.get(index)!=null)List.get(index).setSelected(true);
        for(ListItem item: this.List.values()){
            if(item.getIndex()!=index)item.setSelected(false);
        }
        if(index>=0)selectedIndex.addFirst(index);
        else selectedIndex.clear();
        SwingUtilities.updateComponentTreeUI(this);
    }
    public void selectClick(int index){
        if(index<0||List.get(index)==null)return;
        List.get(index).getButton().doClick();
    }
}
