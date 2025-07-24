import java.awt.*;

public class ColorDecode{
    public static String toRRGGBB(Color color){
        int red= color.getRed();
        int green=color.getGreen();
        int blue=color.getBlue();
        return String.format("%02x",red)+String.format("%02x",green)+String.format("%02x",blue);
    }
    public static Color fromAARRGGBB(String argb)throws NumberFormatException{
        int alpha=Integer.parseInt(argb.substring(0,2),16);
        int red=Integer.parseInt(argb.substring(2,4),16);
        int green=Integer.parseInt(argb.substring(4,6),16);
        int blue=Integer.parseInt(argb.substring(6,8),16);
        return new Color(red,green,blue,alpha);
    }
    public static String toAARRGGBB(Color color){
        int alpha=color.getAlpha();
        return String.format("%02x",alpha)+toRRGGBB(color);
    }
}
