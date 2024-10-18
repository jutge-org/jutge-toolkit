#include "Proceso.hh"

Proceso::Proceso()
{
}

Proceso::Proceso(int id, int m, int t)
{
	this->id = id;
	memoria = m;
	tiempo = t;
}

void Proceso::leer_proceso()
{
	cin >> id;
	cin >> memoria;
	cin >> tiempo;
}

void Proceso::escribir_proceso() const
{
	cout << id << " " << memoria << " " << tiempo << endl;
}

// Si se queda a cero o menos, indica que se ha acabado con el bool
bool Proceso::restar_tiempo(int t)
{
	tiempo -= t;
	if (tiempo<0) tiempo = 0;
	return tiempo == 0;
}

bool Proceso::es_hueco() const
{
	return id == 0;
}

int Proceso::consultar_id_proceso() const
{
	return id;
}

int Proceso::consultar_memoria() const
{
	return memoria;
}

int  Proceso::consultar_tiempo() const
{
	return tiempo;
}

