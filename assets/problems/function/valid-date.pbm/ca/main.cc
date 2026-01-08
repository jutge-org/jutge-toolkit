#include <iostream>
using namespace std;

bool es_data_valida(int d, int m, int a);

int main()
{
    int d, m, a;
    while (cin >> d >> m >> a)
    {
        cout << (es_data_valida(d, m, a) ? "true" : "false") << endl;
    }
    return 0;
}
