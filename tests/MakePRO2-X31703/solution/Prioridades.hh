#ifndef PRIORIDADES_HH
#define PRIORIDADES_HH

#include <iostream>
#include <map>
#include <list>
#include "Cluster.hh"
using namespace std;

class Prioridades{

private:
	map<string,list<Proceso> > info;
	map<string, set<int> > info_aux;
	map<string, pair<int, int> > est; // <enviados, rechazados>

public:

	Prioridades(int);

	void imprimir_prioridad(const string & id, char & error) const;

	void imprimir_area_de_espera() const;

	void alta_prioridad(const string & id, char & error);

	void baja_prioridad(const string & id, char & error);

	void alta_proceso_espera(const string & prio, const Proceso & p, char & error);

	void enviar_procesos_a_cluster(int n, Cluster & cl);

	bool existe_prioridad(const string & id) const;

};

#endif
