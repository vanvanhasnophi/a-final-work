import java.awt.event.ActionListener;

public class ButtonListPanel extends ListPanel {
    ButtonListPanel(String title){
        super(title);
    }
    @Override
    public void add(int index, ListItem item){
        List.put(index,item);
        ListContainer.add(item.getButton());
        item.getButton().setVisible(true);
    }
    public void add(int index, String tag, String Text, ActionListener aListener){
        ButtonListItem newItem=new ButtonListItem(index, tag, Text, aListener);
        List.put(index,newItem);
        ListContainer.add(newItem);
        newItem.setVisible(true);
    }
    @Override
    public void remove(int index){
        ListContainer.remove(List.get(index).getButton());
        List.remove(index);
        repaint();
    }

}
