import java.awt.*;
import java.io.File;
import java.io.FileInputStream;

public class LoadFont
{
    public static Font loadFont(String fontFileName, float fontSize)  //第一个参数是外部字体名，第二个是字体大小
    {
        try
        {
            File file = new File(fontFileName);
            FileInputStream stream = new FileInputStream(file);
            Font dynamicFont = Font.createFont(Font.TRUETYPE_FONT, stream);
            Font dynamicFontPt = dynamicFont.deriveFont(fontSize);
            stream.close();
            return dynamicFontPt;
        }
        catch(Exception e)//异常处理
        {
            return new Font("宋体", Font.PLAIN, 12);
        }
    }

    public static Font InterR() {
        return InterR(12f);
    }

    public static Font InterR(float Size){
        String root=System.getProperty("user.dir");//项目根目录路径
        //调用
        return loadFont(root+"/resources/Inter-UI-Regular-2.ttf", Size);//返回字体
    }

    public static Font InterI() {
        return InterI(12f);
    }

    public static Font InterI(float Size){
        String root=System.getProperty("user.dir");//项目根目录路径
        return loadFont(root+"/resources/Inter-UI-Italic-6.ttf", Size);//返回字体
    }

    public static Font InterM() {
        return InterM(12f);
    }

    public static Font InterM(float Size){
        String root=System.getProperty("user.dir");//项目根目录路径
        return loadFont(root+"/resources/Inter-UI-Medium-3.ttf", Size);//返回字体
    }

    public static Font InterMI() {
        return InterMI(12f);
    }

    public static Font InterMI(float Size){
        String root=System.getProperty("user.dir");//项目根目录路径
        return loadFont(root+"/resources/Inter-UI-MediumItalic-8.ttf", Size);//返回字体
    }

    public static Font InterB() {
        return InterB(12f);
    }

    public static Font InterB(float Size){
        String root=System.getProperty("user.dir");//项目根目录路径
        return loadFont(root+"/resources/Inter-UI-Bold-5.ttf", Size);//返回字体
    }

    public static Font InterBI() {
        return InterBI(12f);
    }

    public static Font InterBI(float Size){
        String root=System.getProperty("user.dir");//项目根目录路径
        return loadFont(root+"/resources/Inter-UI-BoldItalic-7.ttf", Size);//返回字体
    }

    public static Font InterBlack() {
        return InterBlack(12f);
    }

    public static Font InterBlack(float Size){
    String root=System.getProperty("user.dir");//项目根目录路径
    return loadFont(root+"/resources/Inter-UI-Black-4.ttf", Size);//返回字体
    }

    public static Font Consolas() {
        return Consolas(12f);
    }

    public static Font Consolas(float Size){
        String root=System.getProperty("user.dir");//项目根目录路径
        return loadFont(root+"/resources/consola.ttf", Size);//返回字体
    }

    public static Font ConsolasB() {
        return ConsolasB(12f);
    }

    public static Font ConsolasB(float Size){
        String root=System.getProperty("user.dir");//项目根目录路径
        return loadFont(root+"/resources/consolab.ttf", Size);//返回字体
    }

    public static Font ConsolasI() {
        return ConsolasI(12f);
    }

    public static Font ConsolasI(float Size){
        String root=System.getProperty("user.dir");//项目根目录路径
        return loadFont(root+"/resources/consolai.ttf", Size);//返回字体
    }

    public static Font ConsolasBI() {
        return ConsolasBI(12f);
    }

    public static Font ConsolasBI(float Size){
        String root=System.getProperty("user.dir");//项目根目录路径
        return loadFont(root+"/resources/consolaz.ttf", Size);//返回字体
    }

}
