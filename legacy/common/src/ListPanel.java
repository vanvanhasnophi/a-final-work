import javax.swing.*;
import java.awt.*;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

public abstract class ListPanel extends JPanel {
    protected final JPanel ListContainer=new JPanel();
    protected final JScrollPane ListScroll=new JScrollPane(ListContainer);
    protected final JLabel title=new JLabel();
    protected final Map<Integer, ListItem> List=new HashMap<>();
    protected final ArrayList<Integer> selectedIndex=new ArrayList<>();
    ListPanel(String title){
        setLayout(new BorderLayout());
        this.title.setText("  "+title);
        add(this.title,BorderLayout.NORTH);
        add(ListScroll,BorderLayout.CENTER);
        this.title.setFont(PresFont.fntBld);
        ListContainer.setLayout(new BoxLayout(ListContainer,BoxLayout.Y_AXIS));
        ListScroll.getVerticalScrollBar().setUnitIncrement(10);
    }
    public void setTitle(String title) {
        this.title.setText(title);
    }
    public void clear(){
        ListContainer.removeAll();
        List.clear();
        repaint();
    }
    public abstract void add(int index, ListItem item);
    public abstract void remove(int index);
    public ArrayList<Integer> traverse(){
        ArrayList<Integer> indexList=new ArrayList<>();
        for(Map.Entry<Integer, ListItem> item:List.entrySet()){
            indexList.addLast(item.getValue().getIndex());
        }
        return indexList;
    }
    public Collection<ListItem> traverseR(){
        return List.values();
    }
}
