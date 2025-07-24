import com.formdev.flatlaf.FlatDarkLaf;

public class FlatDarkerLaf extends FlatDarkLaf {
    public static boolean setup(){
        return setup(new FlatDarkerLaf());
    }

    @Override
    public String getName(){
        return "FlatDarkerLaf";
    }
}
