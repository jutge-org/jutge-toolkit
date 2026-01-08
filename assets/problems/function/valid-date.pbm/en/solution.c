int is_leap_year(int any)
{
    return any % 4 == 0 && (any % 100 != 0 || any % 400 == 0);
}

int is_valid_date(int d, int m, int a)
{
    if (d < 1 || d > 31 || m < 1 || m > 12)
        return 0;
    if ((m == 4 || m == 6 || m == 9 || m == 11) && d > 30)
        return 0;
    if (m != 2)
        return 1;
    return d < 29 || (d == 29 && is_leap_year(a));
}
