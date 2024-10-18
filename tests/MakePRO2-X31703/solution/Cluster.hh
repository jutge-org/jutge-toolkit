#ifndef CLUSTER_HH
#define CLUSTER_HH

#include "Procesador.hh"
#include "BinTree.hh"

class Cluster{

private:

	BinTree<string> arq;
	map<string, Procesador> chips;

public:

	Cluster();

	void configurar_cluster();

	void imprimir_estructura_cluster() const;

	void imprimir_procesadores_cluster() const;

	void imprimir_procesador(const string & id, char & error) const;

	void alta_proceso_procesador(const string & id_procesador, const Proceso & p, char & error);

	void baja_proceso_procesador(const string & id_procesador, int id_proceso, char & error);

	void enviar_proceso_a_cluster(const Proceso & p, bool & puesto);

	void avanzar_tiempo(int t);

	void compactar_memoria_cluster();

	void compactar_memoria_procesador(const string & id, char & error);

	void modificar_cluster(const string & id, const Cluster & cl, char & error);

private:

	void leer_arbol(BinTree<string>& a);

	static void escribir_arbol(const BinTree<string>& a);

	static void modificar_cluster_aux(const string & id, BinTree<string> & a, const BinTree<string> &b, bool & encontrado, bool & puesto);

	bool rec_aux(const BinTree<string> & a, const map<string,Procesador> & c, int id_proceso, int memoria, string & procesador, int & prof, int & hueco, int & mt);

};

#endif


