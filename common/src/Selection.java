public interface Selection {
    int NULL=0,UNIQUE=1,CHECK=2;
    void select(int index);
    void uniqueSelect(int index);
}
