int es_any_de_traspas(int any)
{
    return any % 4 == 0 && (any % 100 != 0 || any % 400 == 0);
}

int es_data_valida(int d, int m, int a)
{
    if (d < 1 || d > 31 || m < 1 || m > 12)
        return 0;
    if ((m == 4 || m == 6 || m == 9 || m == 11) && d > 30)
        return 0;
    if (m != 2)
        return 1;
    return d < 29 || (d == 29 && es_any_de_traspas(a));
}
