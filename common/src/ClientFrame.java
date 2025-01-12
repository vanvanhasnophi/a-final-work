import com.formdev.flatlaf.FlatLightLaf;

import javax.swing.*;
import javax.swing.event.DocumentEvent;
import javax.swing.event.DocumentListener;
import java.awt.*;
import java.awt.event.*;
import java.io.OutputStream;
import java.net.MalformedURLException;
import java.rmi.NotBoundException;
import java.rmi.RemoteException;

public abstract class ClientFrame extends JFrame implements Command{
    protected final JMenuBar menu=new JMenuBar();
    protected final JTextField idTextField=new JTextField(20);
    protected final JTextField commandInputBox=new JTextField("Input commands...");
    protected final JTextArea Messenger=new JTextArea("");
    protected final JTextArea Console=new JTextArea("");
    protected final JTextArea Notification=new JTextArea("");
    protected final JPanel commandPanel=new JPanel(new BorderLayout(5,5));
    protected final JPanel actionPanel=new JPanel(new BorderLayout());
    protected final JPanel buttonPanel=new JPanel(new GridLayout(1,3));
    protected final JPanel inputPanel=new JPanel(new FlowLayout());
    protected final JPanel ChooseARoom=new JPanel();
    protected final JPanel RoomNameL=new JPanel();
    protected final JPanel Actions=new JPanel();
    protected final JPanel ItPane=new JPanel(new BorderLayout());
    protected final JPanel OpPane=new JPanel(new BorderLayout());
    protected final JPanel TextPane=new JPanel();
    protected final JPanel InfoPane=new JPanel();
    protected final JScrollPane scrollPane =new JScrollPane(Console);
    protected final JButton LightDarkSwitch=new JButton("Light/Dark");
    protected final JButton registerButton=new JButton("Register");
    protected final JButton DisconnectButton=new JButton("Disconnect");
    protected final JButton clearButton=new JButton("Clear Console");
    protected final JButton scanButton=new JButton("Scan");
    protected final JLabel selected=new JLabel("N/A");
    protected final JLabel idLabel=new JLabel("id:");
    protected final JLabel RoomLoc=new JLabel("  Room Loc:");
    protected final JComboBox<Integer> roomList=new JComboBox<>();
    protected final JMenu MFile=new JMenu("<html><body><u>F</u>ile</body></html>");
    protected final JMenu MHelp=new JMenu("<html><body><u>H</u>elp</body></html>");
    protected final ButtonListPanel OverallInfo=new ButtonListPanel("Overall:");
    protected final ButtonListPanel FilteredInfo=new ButtonListPanel("Filtered:");

    protected final String version=properties.version.description();

    protected final Color commandFore=PresColor.GREEN.value();
    protected final Color commandBack=this.getBackground();

    protected final int[] ID={-1};

    protected final JFrame ActionFrame=new JFrame();



    ClientFrame(){
        try {
            setLightDarkMode();
        } catch (UnsupportedLookAndFeelException e) {
            System.err.println("Failed to initialize flatLaf.");
        }
        setLayout(new BorderLayout());
        UIManager.put( "Component.focusWidth", 0 );
        UIManager.put( "ScrollBar.thumbArc", 999 );
        UIManager.put( "ScrollBar.thumbInsets", new Insets( 2, 2, 2, 2 ) );

        // Size of the form
        setSize(960, 540);
        setMinimumSize(new Dimension(960,540));
        this.setLocationRelativeTo(null);

        // Action Panel
        actionPanel.setVisible(false);

        ChooseARoom.setLayout(new FlowLayout(FlowLayout.CENTER));
        actionPanel.add(ChooseARoom,BorderLayout.NORTH);
        RoomLoc.setFont(PresFont.fntDisplay.fontName());
        ChooseARoom.add(RoomLoc);

        RoomNameL.setLayout(new FlowLayout(FlowLayout.CENTER));
        actionPanel.add(RoomNameL,BorderLayout.CENTER);

        Actions.setLayout(new FlowLayout());
        actionPanel.add(Actions,BorderLayout.SOUTH);

        // RoomList ComboBox Paint
        ChooseARoom.add(roomList);
        roomList.setEnabled(true);
        roomList.setFont(PresFont.fntText.fontName());
        roomList.setVisible(true);

        MFile.setMnemonic(KeyEvent.VK_F);//设置快速访问符

        JMenuItem item=new JMenuItem(commandPanel.isVisible()?"<html><body>Hide <u>C</u>ommand</body></html>":"<html><body>Show <u>C</u>ommand</body></html>",KeyEvent.VK_C);
        item.setAccelerator(KeyStroke.getKeyStroke(KeyEvent.VK_C, InputEvent.ALT_DOWN_MASK));
        JMenuItem finalItem = item;
        item.addActionListener(e->{
            commandPanel.setVisible(!commandPanel.isVisible());
            finalItem.setText(commandPanel.isVisible()?"<html><body>Hide <u>C</u>ommand</body></html>":"<html><body>Show <u>C</u>ommand</body></html>");
        });
        MFile.add(item);

        MFile.addSeparator();// Separator
        item=new JMenuItem("<html><body><u>E</u>xit</body></html>",KeyEvent.VK_E);
        item.setAccelerator(KeyStroke.getKeyStroke(KeyEvent.VK_F4,InputEvent.ALT_DOWN_MASK));
        item.addActionListener(e->dispose());
        MFile.add(item);

        menu.add(MFile);


        MHelp.setMnemonic(KeyEvent.VK_H);//设置快速访问符

        item=new JMenuItem("<html><body><u>C</u>ommand Help...</body></html>",KeyEvent.VK_C);
        item.setAccelerator(KeyStroke.getKeyStroke(KeyEvent.VK_M, InputEvent.ALT_DOWN_MASK));
        item.addActionListener(e->{
            commandPanel.setVisible(true);
            finalItem.setText(commandPanel.isVisible()?"<html><body>Hide <u>C</u>ommand</body></html>":"<html><body>Show <u>C</u>ommand</body></html>");
            help();
        });
        MHelp.add(item);

        MHelp.addSeparator();// Separator
        item=new JMenuItem("<html><body><u>A</u>bout</body></html>",KeyEvent.VK_A);
        item.setAccelerator(KeyStroke.getKeyStroke(KeyEvent.VK_A,InputEvent.ALT_DOWN_MASK));
        item.addActionListener(e->about(false));
        MHelp.add(item);

        menu.add(MHelp);
        setJMenuBar(menu);

        // Selected Label
        selected.setFont(PresFont.fntDisplay.fontName());
        RoomNameL.add(selected);
        selected.setVisible(true);

        // Input Panel
        inputPanel.setLayout(new FlowLayout());

        inputPanel.add(LightDarkSwitch);
        LightDarkSwitch.addActionListener(e -> switchLD());
        inputPanel.add(idLabel);
        idLabel.setFont(PresFont.fntBld.fontName());

        inputPanel.add(idTextField);
        idTextField.setFont(PresFont.fntText.fontName());

        add(inputPanel, BorderLayout.NORTH);

        // Register Button Paint
        registerButton.setFont(PresFont.fntBld.fontName());
        inputPanel.add(registerButton);

        // Disconnect Button Paint
        DisconnectButton.setFont(PresFont.fntBld.fontName());
        inputPanel.add(DisconnectButton);
        DisconnectButton.setVisible(false);

        //Interface Panel Layout
        OpPane.add(ItPane,BorderLayout.NORTH);// Action Panel
        ItPane.add(actionPanel,BorderLayout.CENTER);
        ItPane.add(buttonPanel,BorderLayout.SOUTH);
        ItPane.add(inputPanel, BorderLayout.NORTH);

        // TextArea at the Center
        add(TextPane, BorderLayout.CENTER);
        TextPane.setLayout(new GridLayout(1,2));
        TextPane.add(OpPane);
        InfoPane.setLayout(new GridLayout(3,1));
        TextPane.add(InfoPane);

        //Console
        Console.setEditable(false); //Readonly
        scrollPane.setOpaque(true);
        scrollPane.getHorizontalScrollBar().setBackground(Console.getBackground());
        scrollPane.getHorizontalScrollBar().setForeground(new Color(0x555555));
        scrollPane.getVerticalScrollBar().setBackground(Console.getBackground());
        scrollPane.getVerticalScrollBar().setForeground(new Color(0x555555));
        OpPane.add(scrollPane,BorderLayout.CENTER);
        Console.setFont(PresFont.fntCons.fontName());
        Console.setBackground(PresColor.DARK.value());
        Console.setForeground(PresColor.LIGHT.value());
        Console.append("Input your id.\n");
        Console.setVisible(true);

        // Overall Info & Filtered Info
        InfoPane.add(OverallInfo);
        InfoPane.add(FilteredInfo);

        // Notification Center
        Notification.setEditable(false); //Readonly
        JScrollPane scrollPane3 =new JScrollPane(Notification);
        InfoPane.add(scrollPane3);
        Notification.setFont(PresFont.fntText.fontName());
        Notification.append("Input your id.\n");
        Notification.setVisible(true);
        TextPane.add(InfoPane);

        // Message
        Messenger.setEditable(true); // Readonly
        Messenger.getDocument().addDocumentListener(new DocumentListener() {
            @Override
            public void insertUpdate(DocumentEvent e) {
                SwingUtilities.invokeLater(() -> {
                    if(!Messenger.getText().isEmpty())Console.append(Messenger.getText()+"\n");
                    Notification.append(Messenger.getText());
                    Messenger.setText("");
                });
            }

            @Override
            public void removeUpdate(DocumentEvent e) {

            }

            @Override
            public void changedUpdate(DocumentEvent e) {

            }
        });


        // Clear Button
        clearButton.setFont(PresFont.fntBld.fontName());
        clearButton.addActionListener(e -> {
            ConfirmDialog c=new ConfirmDialog("Clear the console?",400,100);
            c.setVisible(true);
            if(!c.isOK())return;
            Console.setText(""); // Clear
        });

        // Scan Button
        scanButton.setFont(PresFont.fntBld.fontName());
        scanButton.addActionListener(e -> {
            Notification.setText("");
            try {
                Scanning("NoMessage");
            } catch (MalformedURLException | RemoteException | NotBoundException ex) {
                throw new RuntimeException(ex);
            }
        });

        // Command Panel
        add(commandPanel, BorderLayout.SOUTH);
        commandPanel.setVisible(true);

        JPanel gap1=new JPanel();
        commandPanel.add(gap1,BorderLayout.WEST);
        gap1.setBackground(commandBack);
        JPanel gap2=new JPanel();
        commandPanel.add(gap2,BorderLayout.NORTH);
        gap2.setBackground(commandBack);
        gap2.setMaximumSize(new Dimension(0,1));
        JPanel goPane=new JPanel(new BorderLayout());
        commandPanel.add(goPane,BorderLayout.EAST);
        goPane.setBackground(commandBack);
        goPane.setMinimumSize(new Dimension(20,0));

        commandPanel.setBackground(commandBack);
        commandInputBox.setFont(PresFont.fntConsL.fontName());
        commandInputBox.setForeground(PresColor.GREY.value());
        commandInputBox.setBackground(commandBack);
        commandInputBox.setBorder(BorderFactory.createLineBorder(Color.BLACK,0));
        commandInputBox.setMinimumSize(new Dimension(0,50));
        commandInputBox.addKeyListener(new KeyAdapter() {
            @Override
            public void keyTyped(KeyEvent e) {
                super.keyTyped(e);
                if (e.getKeyChar() == KeyEvent.VK_ENTER) {
                    if(commandInputBox.getForeground()==commandFore||commandInputBox.getForeground()==PresColor.PINK.value()){
                        Console.append("\n>> "+commandInputBox.getText()+"\n");
                        conduct(commandInputBox.getText());
                        commandInputBox.setText("");
                    }
                }
            }

            @Override
            public void keyPressed(KeyEvent e) {
                super.keyPressed(e);
            }

            @Override
            public void keyReleased(KeyEvent e) {
                super.keyReleased(e);
            }
        });
        commandInputBox.getDocument().addDocumentListener(new DocumentListener() {
            @Override
            public void insertUpdate(DocumentEvent e) {
                if(commandInputBox.getText().contains("love"))commandInputBox.setForeground(PresColor.PINK.value());
                else{
                    if(commandInputBox.getText().equals("Input commands..."))return;
                    if(!conductible(commandInputBox.getText()))commandInputBox.setForeground(PresColor.RED.value());
                    else commandInputBox.setForeground(commandFore);
                }
            }

            @Override
            public void removeUpdate(DocumentEvent e) {
                if(commandInputBox.getText().contains("love"))commandInputBox.setForeground(PresColor.PINK.value());
                else{
                    if(commandInputBox.getText().equals("Input commands..."))return;
                    if(!conductible(commandInputBox.getText()))commandInputBox.setForeground(PresColor.RED.value());
                    else commandInputBox.setForeground(commandFore);
                }
            }

            @Override
            public void changedUpdate(DocumentEvent e) {
                if(commandInputBox.getText().contains("love"))commandInputBox.setForeground(PresColor.PINK.value());
                else{
                    if(commandInputBox.getText().equals("Input commands..."))return;
                    if(!conductible(commandInputBox.getText()))commandInputBox.setForeground(PresColor.RED.value());
                    else commandInputBox.setForeground(commandFore);
                }

            }
        });
        commandPanel.add(commandInputBox,BorderLayout.CENTER);
        commandInputBox.addFocusListener(new FocusAdapter() {
            final String hintText="Input commands...";
            @Override
            public void focusLost(FocusEvent e) {
                super.focusLost(e);
                String temp = commandInputBox.getText();
                if(temp.isBlank()) {
                    commandInputBox.setForeground(PresColor.GREY.value());
                    commandInputBox.setText(hintText);
                }
            }

            @Override
            public void focusGained(FocusEvent e) {
                super.focusGained(e);
                String temp = commandInputBox.getText();
                if (temp.equals(hintText)) {
                    commandInputBox.setText("");
                    commandInputBox.setForeground(commandFore);
                }
            }
        });

    }

    protected abstract void help();
    protected abstract void about(boolean love);
    protected abstract void Scanning(String Message)throws MalformedURLException, NotBoundException, RemoteException;
    protected void switchLD() {
        try {
            LightDarkMode.switchMode();
            setLightDarkMode();
            revalidate();
            repaint();
            scrollPane.getHorizontalScrollBar().setBackground(Console.getBackground());
            scrollPane.getVerticalScrollBar().setBackground(Console.getBackground());
            scrollPane.putClientProperty("JScrollBar.thumb",new Color(0x555555));
            SwingUtilities.updateComponentTreeUI(this);
            commandInputBox.setBackground(this.getBackground());
            if(ID[0]>0)Scanning("NoMessage");

        } catch (UnsupportedLookAndFeelException ex) {
            System.out.println("switch failed!");
        } catch (MalformedURLException | NotBoundException | RemoteException ignored) {
        }
    }

    protected static void setLightDarkMode() throws UnsupportedLookAndFeelException {
        UIManager.getLookAndFeelDefaults().clear();
        UIManager.setLookAndFeel(LightDarkMode.isDark()?new FlatDarkerLaf():new FlatLightLaf());
        UIManager.put( "Component.focusWidth", 0 );
        UIManager.put( "ScrollBar.thumbArc", 999 );
        UIManager.put( "ScrollBar.thumbInsets", new Insets( 2, 2, 2, 2 ) );
    }

    // Customize OutputStream, let "print" family print to "JTextArea"
    protected static class JTextAreaOutputStream extends OutputStream {
        private final JTextArea textArea;

        public JTextAreaOutputStream(JTextArea textArea) {
            this.textArea = textArea;
        }

        @Override
        public void write(int b) {
            // Convert to char to print to "JTextArea"
            textArea.append(String.valueOf((char) b));
        }

        @Override
        public void write(byte[] b, int off, int len) {
            // append the String to "JTextArea"
            textArea.append(new String(b, off, len));
        }
    }
}
