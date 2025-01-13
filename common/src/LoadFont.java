import java.awt.*;
import java.io.InputStream;

public class LoadFont
{
    public static Font loadFont(String fontPath, float fontSize)
    {
        try(InputStream fontStream = LoadFont.class.getClassLoader().getResourceAsStream(fontPath))
        {
            if (fontStream==null) throw new RuntimeException();
            Font dynamicFont = Font.createFont(Font.TRUETYPE_FONT, fontStream);
            Font dynamicFontPt = dynamicFont.deriveFont(fontSize);
            fontStream.close();
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
        return loadFont("Inter-UI-Regular-2.ttf", Size);
    }

    public static Font InterI() {
        return InterI(12f);
    }

    public static Font InterI(float Size){
        return loadFont("Inter-UI-Italic-6.ttf", Size);
    }

    public static Font InterM() {
        return InterM(12f);
    }

    public static Font InterM(float Size){
        return loadFont("Inter-UI-Medium-3.ttf", Size);
    }

    public static Font InterMI() {
        return InterMI(12f);
    }

    public static Font InterMI(float Size){
        return loadFont("Inter-UI-MediumItalic-8.ttf", Size);
    }

    public static Font InterB() {
        return InterB(12f);
    }

    public static Font InterB(float Size){
        return loadFont("Inter-UI-Bold-5.ttf", Size);
    }

    public static Font InterBI() {
        return InterBI(12f);
    }

    public static Font InterBI(float Size){
        return loadFont("Inter-UI-BoldItalic-7.ttf", Size);
    }

    public static Font InterBlack() {
        return InterBlack(12f);
    }

    public static Font InterBlack(float Size){
    return loadFont("Inter-UI-Black-4.ttf", Size);
    }

    public static Font Consolas() {
        return Consolas(12f);
    }

    public static Font Consolas(float Size){
        return loadFont("consola.ttf", Size);
    }

    public static Font ConsolasB() {
        return ConsolasB(12f);
    }

    public static Font ConsolasB(float Size){
        return loadFont("consolab.ttf", Size);
    }

    public static Font ConsolasI() {
        return ConsolasI(12f);
    }

    public static Font ConsolasI(float Size){
        return loadFont("consolai.ttf", Size);
    }

    public static Font ConsolasBI() {
        return ConsolasBI(12f);
    }

    public static Font ConsolasBI(float Size){
        return loadFont("consolaz.ttf", Size);
    }

}
