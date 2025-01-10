import javax.swing.*;
import java.awt.*;

public class MessageBox extends JDialog {
    // Default Fonts
    static final Font fntText = LoadFont.InterR(12);
    static final Font fntDisplay=LoadFont.InterR(13);
    static final Font fntBld = LoadFont.InterB(12);
    static final Font fntCons = new Font("Consolas", Font.PLAIN, 12);
    static final Font fntConsL = new Font("Consolas", Font.PLAIN, 14);

    private JPanel contentPane;
    private JButton buttonOK;
    private JTextArea MessageLabel;

    public MessageBox(String Message,int width,int height) {
        MessageLabel.setFont(fntText);
        buttonOK.setFont(fntBld);
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
