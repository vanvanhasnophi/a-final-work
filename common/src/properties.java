public enum properties {
    version("1.2.2"),
    author("Vince C"),
    date("Jan 10, 2025");
    private final String description;
    properties(String s) {
        this.description=s;
    }
    String description() {
        return description;
    }
}
