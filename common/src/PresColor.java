import java.awt.*;
//for design specifications, go to [...](https://vi.tsinghua.edu.cn/gk/xxbz/scgf.htm)

public enum PresColor {
    RED(new Color(0xDD2211), new Color(0xDD3329)),
    YELLOW(new Color(0xAA8822), new Color(0xCCAA29)),
    GREEN(new Color(0x449911), new Color(0x55AA17)),
    BLUE(new Color(0x2255AA), new Color(0x2E70D2)),
    PURPLE(new Color(0x660874), new Color(0x990CAE)),/*Standard Color of Tsinghua*/
    ROSE(new Color(0xD93379), new Color(0xE24880)),/*Auxiliary Color of Tsinghua*/
    PINK(new Color(0xFF69B4), new Color(0xFF69B4)),/*love*/
    DARK(new Color(0x121319), new Color(0x121319)),/*Background of console*/
    LIGHT(new Color(0xE0E0E0), new Color(0xE0E0E0)),/*Foreground of console*/
    BACK(new Color(0xF2F2F2), new Color(0x1E1F22)),
    FORE(new Color(0x060606), new Color(0xD8DAE1)),
    GREY(new Color(0x555555), new Color(0x777777)),
    WARNING(new Color(0xDD2211),new Color(0xCCAA29)),
    NULL(new Color(0x00000000,true),new Color(0x00000000,true));
    private final Color value1,value2;
    public Color value(){
        return !LightDarkMode.isDark()?value1:value2;
    }
    public Color dark(){
        return value2;
    }
    public Color light(){
        return value1;
    }
    PresColor(Color value1,Color value2){
        this.value1=value1;
        this.value2=value2;
    }
}
