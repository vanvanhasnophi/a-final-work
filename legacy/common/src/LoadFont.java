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
        return loadFont("SarasaGothicSC-Regular.ttf", Size);
    }

    /**
    public static Font InterI() {
        return InterI(12f);
    }

    public static Font InterI(float Size){
        return loadFont("SarasaGothicSC-Italic.ttf", Size);
    }
     */
    public static Font InterB() {
        return InterB(12f);
    }

    public static Font InterB(float Size){
        return loadFont("SarasaGothicSC-Bold.ttf", Size);
    }

    /**
    public static Font InterBI() {
        return InterBI(12f);
    }

    public static Font InterBI(float Size){
        return loadFont("SarasaGothicSC-BoldItalic.ttf", Size);
    }

    public static Font InterLI(){return InterL(12f);}

    public static Font InterLI(float Size){ return loadFont("SarasaGothicSC-LightItalic.ttf",Size);}
    
    public static Font InterL(){return InterL(12f);}
    
    public static Font InterL(float Size){ return loadFont("SarasaGothicSC-Light.ttf",Size);}
     */
    public static Font Password(){return Password(12f);}

    public static Font Password(float Size){return loadFont("Inter-UI-Regular-2.ttf",Size);}

    public static Font Consolas() {
        return Consolas(12f);
    }

    public static Font Consolas(float Size){
        return loadFont("consola.ttf", Size);
    }

    /**
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

    public static Font SymBolR(){return SymbolR(12f);}

    public static Font SymbolR(float Size){return loadFont("FontAwesome6FreeRegular400.otf",Size);}

     */
    public static Font SymBolS(){return SymbolS(12f);}

    public static Font SymbolS(float Size){return loadFont("FontAwesome6FreeSolid900.otf",Size);}
}
