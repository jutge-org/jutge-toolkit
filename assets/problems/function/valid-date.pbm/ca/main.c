#include <stdio.h>

int es_data_valida(int d, int m, int a);

int main()
{
    int d, m, a;
    while (scanf("%d %d %d", &d, &m, &a) > 0)
    {
        printf("%s\n", es_data_valida(d, m, a) ? "true" : "false");
    }
    return 0;
}
