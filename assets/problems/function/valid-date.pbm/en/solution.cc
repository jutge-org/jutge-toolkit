
bool is_leap_year(int y)
{
    return y % 4 == 0 and (y % 100 != 0 or y % 400 == 0);
}

bool is_valid_date(int d, int m, int y)
{
    if (d < 1 or d > 31 or m < 1 or m > 12)
        return false;
    if ((m == 4 or m == 6 or m == 9 or m == 11) and d > 30)
        return false;
    if (m != 2)
        return true;
    return d < 29 or (d == 29 and is_leap_year(y));
}
