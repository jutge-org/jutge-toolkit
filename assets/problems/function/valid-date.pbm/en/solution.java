class Solution {

    public static boolean isLeapYear(int any) {
        return any % 4 == 0 && (any % 100 != 0 || any % 400 == 0);
    }

    public static boolean isValidDate(int d, int m, int a) {
        if (d < 1 || d > 31 || m < 1 || m > 12) {
            return false;
        }
        if ((m == 4 || m == 6 || m == 9 || m == 11) && d > 30) {
            return false;
        }
        if (m != 2) {
            return true;
        }
        return d < 29 || (d == 29 && isLeapYear(a));
    }

}
