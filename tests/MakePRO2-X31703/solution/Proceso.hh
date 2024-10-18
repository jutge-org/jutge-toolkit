#ifndef PROCESO_HH
#define PROCESO_HH

#include <iostream>

using namespace std;

class Proceso{

private:
	int id;
	int memoria;
	int tiempo;

public:

    Proceso();

	Proceso(int, int, int);

	void escribir_proceso() const;

	void leer_proceso();

	bool restar_tiempo(int);

	bool es_hueco() const;

	int consultar_id_proceso() const;

	int consultar_memoria() const;

	int consultar_tiempo() const;
};

#endif
