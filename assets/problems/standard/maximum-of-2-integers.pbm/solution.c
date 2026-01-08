#include <stdio.h>

int main()
{
    int a, b;

    (void)scanf("%d", &a);
    (void)scanf("%d", &b);

    if (a > b)
    {
        printf("%d\n", a);
    }
    else
    {
        printf("%d\n", b);
    }
}
