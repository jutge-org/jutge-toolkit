
def es_any_de_traspas(any):
    return any % 4 == 0 and (any % 100 != 0 or any % 400 == 0)


def es_data_valida(d, m, a):
    if d < 1 or d > 31 or m < 1 or m > 12:
        return False
    if (m == 4 or m == 6 or m == 9 or m == 11) and d > 30:
        return False
    if m != 2:
        return True
    return d < 29 or (d == 29 and es_any_de_traspas(a))
