import javax.swing.*;
import java.awt.*;

public class Test extends JFrame{
    Test(){
        setDefaultCloseOperation(EXIT_ON_CLOSE);

        setTitle("Test");
        setSize(600,500);
        setLayout(new BorderLayout());
        setVisible(true);
        ButtonListPanel p=new ButtonListPanel("Lorem ipsum dolor sit amet",Selection.UNIQUE);
        p.add(1, "Reserved", "Reserved Room", e -> setTitle("Reserved"));
        p.add(2, "Occupying", "Occupying Room", e -> setTitle("Occupying"));
        p.add(3, "NotExecuted", "NotExecuted Room", e -> setTitle("NotExecuted"));
        p.add(4, "Regular", "Regular Room", e -> setTitle("Regular"));
        add(p,BorderLayout.CENTER);
        p.setVisible(true);

        MetroListPanel p1=new MetroListPanel(Selection.UNIQUE);
        p1.add(1,"","",e->{},PresColor.RED.value());
        p1.add(2,"","",e->{},PresColor.YELLOW.value());
        p1.add(3,"","",e->{},PresColor.GREEN.value());
        p1.add(4,"","",e->{},PresColor.BLUE.value());
        p1.add(5,"","",e->{},PresColor.PURPLE.value());
        add(p1,BorderLayout.CENTER);
        p1.setVisible(true);

        add(new JButton("AA"),BorderLayout.SOUTH);
    }
    public static void main(String[] args) {
        LightDarkMode.setDark(true);
        try {
            UIManager.setLookAndFeel( LightDarkMode.isDark()?new FlatDarkerLaf():new FlatLighterLaf() );
        } catch( Exception ex ) {
            System.err.println( "Failed to initialize LaF" );
        }



        // Safely Run
        SwingUtilities.invokeLater(() -> new Test().setVisible(true));
    }
}
