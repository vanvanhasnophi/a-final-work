import javax.swing.*;
import java.awt.*;

public class MessageBox extends JDialog {
    private JPanel contentPane;
    private JButton buttonOK;
    private JTextArea MessageLabel;

    public MessageBox(String Message,int width,int height) {
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
