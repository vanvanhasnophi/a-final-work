import com.formdev.flatlaf.FlatLightLaf;
import javax.swing.*;
import java.awt.*;

public class Test extends JFrame{
    Test(){
        setTitle("Test");
        setSize(600,500);
        setLayout(new BorderLayout());
        setVisible(true);
        ButtonListPanel p=new ButtonListPanel("Lorem ipsum dolor sit amet");
        p.add(1, "Reserved", "Reserved Room", e -> setTitle("Reserved"));
        p.add(2, "Occupying", "Occupying Room", e -> setTitle("Occupying"));
        p.add(3, "NotExecuted", "NotExecuted Room", e -> setTitle("NotExecuted"));
        p.add(4, "Regular", "Regular Room", e -> setTitle("Regular"));
        add(p,BorderLayout.CENTER);
        p.setVisible(true);
    }
    public static void main(String[] args) {
        try {
            UIManager.setLookAndFeel( new FlatLightLaf() );
        } catch( Exception ex ) {
            System.err.println( "Failed to initialize LaF" );
        }

        // Safely Run
        SwingUtilities.invokeLater(() -> new Test().setVisible(true));
    }
}
