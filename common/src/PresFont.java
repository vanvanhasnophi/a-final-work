import java.awt.*;

public enum PresFont {
    fnt(LoadFont.InterR(12)),
    fntDisplay(LoadFont.InterR(13)),
    fntText(LoadFont.InterR(11)),
    fntBldText(LoadFont.InterB(11)),
    fntBld(LoadFont.InterB(12)),
    fntBldL(LoadFont.InterB(18)),
    fntItalicText(LoadFont.InterI(11)),
    fntItalic(LoadFont.InterI(12)),
    fntCons(LoadFont.Consolas(12)),
    fntConsL(LoadFont.Consolas(14));
    public Font fontName(){
        return fontName;
    }
    private final Font fontName;
    PresFont(Font fontName){
        this.fontName = fontName;
    }
}
