#include <stdio.h>

int main()
{
    int a, b;
    if (scanf("%d", &a)) { };
    if (scanf("%d", &b)) { };
    if (a > b)
        printf("%d\n", a);
    else
        printf("%d\n", b);
}
