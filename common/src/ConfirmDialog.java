import com.formdev.flatlaf.FlatLightLaf;

import javax.swing.*;
import java.awt.*;
import java.awt.event.*;

public class ConfirmDialog extends JDialog {
    // Default Fonts
    static final Font fntText = LoadFont.InterR(12);
    static final Font fntDisplay=LoadFont.InterR(13);
    static final Font fntBld = LoadFont.InterB(12);
    static final Font fntCons = new Font("Consolas", Font.PLAIN, 12);
    static final Font fntConsL = new Font("Consolas", Font.PLAIN, 14);

    private JPanel contentPane;
    private JButton buttonOK;
    private JButton buttonCancel;
    private JTextArea MessageLabel;
    private boolean OK;

    public ConfirmDialog(String Message,int width,int height) {
        MessageLabel.setFont(fntText);
        buttonOK.setFont(fntBld);
        buttonCancel.setFont(fntBld);
        setMinimumSize(new Dimension(300,120));
        setTitle("Confirm?");
        setContentPane(contentPane);
        setModal(true);
        setSize(width,height);
        getRootPane().setDefaultButton(buttonOK);
        this.setLocationRelativeTo(null);

        MessageLabel.setText(Message);

        buttonOK.addActionListener(e -> onOK());

        buttonCancel.addActionListener(e -> onCancel());

        // 点击 X 时调用 onCancel()
        setDefaultCloseOperation(DO_NOTHING_ON_CLOSE);
        addWindowListener(new WindowAdapter() {
            public void windowClosing(WindowEvent e) {
                onCancel();
            }
        });

        // 遇到 ESCAPE 时调用 onCancel()
        contentPane.registerKeyboardAction(e -> onCancel(), KeyStroke.getKeyStroke(KeyEvent.VK_ESCAPE, 0), JComponent.WHEN_ANCESTOR_OF_FOCUSED_COMPONENT);
    }


    private void onOK() {
        // 在此处添加您的代码
        OK=true;
        dispose();
    }

    private void onCancel() {
        // 必要时在此处添加您的代码
        OK=false;
        dispose();
    }

    public boolean isOK(){
        return OK;
    }

    public static void main(String[] args) {
        ///Optional, if not work, delete it and its dependency.
        try {
            UIManager.setLookAndFeel( new FlatLightLaf() );
        } catch( Exception ex ) {
            System.err.println( "Failed to initialize LaF" );
        }
        ConfirmDialog dialog = new ConfirmDialog("TextDialog",300,100);
        dialog.pack();
        dialog.setVisible(true);
        System.exit(0);
    }

}
