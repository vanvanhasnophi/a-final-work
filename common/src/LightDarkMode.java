public class LightDarkMode {
    private static boolean isDark=false;
    public static void setDark(boolean dark) {
        isDark = dark;
    }

    public static boolean isDark() {
        return isDark;
    }

    public static void switchMode(){
        setDark(!isDark);
    }
}
