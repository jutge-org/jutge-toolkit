#ifndef PROCESADOR_HH
#define PROCESADOR_HH

#include <map>
#include <set>
#include "Proceso.hh"



class Procesador{

private:
    map <int, Proceso> mem; // {inicio : Proceso} id = 0 -> hueco
    map <int, int> mem_aux; // {id_proceso : inicio}
    map <int, set<int>> huecos; // {longitud : {inicio, ... }}
    int memoria_total;
    int memoria_usada;
	
public:

    Procesador();

	Procesador(int m);
	
	void escribir_procesador() const;
	
	void alta_proceso(const Proceso & p, char & error);
	
	void baja_proceso(int id_proceso, char & error);
	
	bool cabe_proceso(int m) const;
	
	bool esta_proceso(int m) const;
	
	int hueco_mas_ajustado(int m) const;
	
	void quitar_procesos_acabados(int);
	
	int consultar_memoria_libre() const;
	
	int consultar_memoria_total() const;
	
	int consultar_memoria_usada() const;
	
	void compactar_memoria();
	
private:

	map<int, Proceso>::iterator quitar_proceso(map<int, Proceso>::iterator);

};

#endif
