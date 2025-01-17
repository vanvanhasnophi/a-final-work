import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionListener;

public class MessageBox extends JDialog {

    private JPanel contentPane;
    private JButton buttonOK;
    private JButton buttonSecondary;
    private JTextArea MessageLabel;
    private JPanel buttonPane;
    private JPanel buttons;

    public MessageBox(String Message,int width,int height) {
        MessageLabel.setFont(PresFont.fntText);
        buttonOK.setFont(PresFont.fntBldText);
        buttonSecondary.setFont(PresFont.fntText);
        buttonSecondary.setVisible(false);
        setMinimumSize(new Dimension(300,120));
        setContentPane(contentPane);
        setModal(true);
        getRootPane().setDefaultButton(buttonOK);
        setTitle("Message");
        setSize(width,height);
        MessageLabel.setText(Message);
        this.setLocationRelativeTo(null);
        buttonOK.addActionListener(e -> onOK());
    }

    public MessageBox(String Title,String Message,int width,int height){
        this(Message,width,height);
        setTitle(Title);
    }

    public MessageBox(String Title, String Message, int width, int height, String buttonName, ActionListener e){
        this(Title,Message,width,height);
        buttonSecondary.setVisible(true);
        buttonSecondary.setText(buttonName);
        buttonSecondary.addActionListener(e);
        buttonSecondary.addActionListener(e1->dispose());
    }

    private void onOK() {
        // 在此处添加您的代码
        dispose();
    }

    public static void main(String[] args) {
        MessageBox dialog = new MessageBox("TextDialog",300,120);
        dialog.pack();
        dialog.setVisible(true);

        System.exit(0);
    }

}
