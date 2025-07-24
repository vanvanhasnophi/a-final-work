import com.formdev.flatlaf.FlatLightLaf;

public class FlatLighterLaf extends FlatLightLaf {
    public static boolean setup(){
        return setup(new FlatLighterLaf());
    }

    @Override
    public String getName(){
        return "FlatLighterLaf";
    }
}
