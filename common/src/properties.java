public enum properties {
    version("2.0 beta 1"),
    author("Vince C"),
    date("Jan 13, 2025");
    private final String description;
    properties(String s) {
        this.description=s;
    }
    String description() {
        return description;
    }
}
