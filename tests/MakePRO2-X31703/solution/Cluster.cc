#include "Cluster.hh"

Cluster::Cluster(){
}

void Cluster::configurar_cluster(){
	chips.clear();
	leer_arbol(arq);
}

void Cluster::leer_arbol(BinTree<string>& a)
{
  string id;
  cin >> id;
  if (id != "*"){
	int mem_proc;
	cin >> mem_proc;
	//map<string, Procesador>::iterator it;
	//it = chips.find(id);
	//assert(it == chips.end());
	Procesador pr (mem_proc);
	chips[id] = pr;
	BinTree<string> l;
	leer_arbol(l);
	BinTree<string> r;
	leer_arbol(r);
	a=BinTree<string>(id,l,r);
  }
}

void Cluster::modificar_cluster(const string & id, const Cluster & cl, char & error){
	error = '0';
	map<string, Procesador>::iterator it;
	it = chips.find(id);
	if (it == chips.end()) error = '1';
	else if ((it->second).consultar_memoria_usada() > 0) error = '2';
	else {
		bool encontrado, puesto;
		modificar_cluster_aux(id, arq, cl.arq, encontrado, puesto);
		if (puesto){
			it = chips.find(id);
			it = chips.erase(it);
			map<string, Procesador>::const_iterator it_aux = cl.chips.begin();
			while (it_aux != cl.chips.end()){
				chips[it_aux->first] = it_aux->second;
				++it_aux;
			}
		}
		else error = '3';
	}
}

void Cluster::modificar_cluster_aux(const string & id, BinTree<string> & a, const BinTree<string> &b, bool & encontrado, bool & puesto){
	if (a.empty()) {
		encontrado = puesto = false;
	}
	else if (a.value() == id){
		encontrado = true;
		if (a.left().empty() and a.right().empty()) {
			a = b;
			puesto = true;
		}
		else puesto = false;
	}
	else{
		BinTree<string> iz, der;
		iz = a.left();
		der = a.right();
		modificar_cluster_aux(id, iz, b, encontrado, puesto);
		if (not encontrado) modificar_cluster_aux(id, der, b, encontrado, puesto);
		a = BinTree<string> (a.value(),iz,der);
	}
}

void Cluster::imprimir_estructura_cluster() const{
	escribir_arbol(arq);
	cout << endl;
}

void Cluster::imprimir_procesadores_cluster() const{
	for(map<string ,Procesador>::const_iterator it = chips.begin(); it != chips.end(); ++it){
		cout << it->first << endl;
		(it->second).escribir_procesador();
	}
}

void Cluster::escribir_arbol(const BinTree<string>& a)
{
    if (not a.empty()){
      //    cout << " " << a.value() ;
      //    escribir_arbol(a.left());
      //    escribir_arbol(a.right());
      cout <<"(";
      cout << a.value();
      escribir_arbol(a.left());
      escribir_arbol(a.right());cout <<")";
    }
    else cout << " ";
}

void Cluster::imprimir_procesador(const string & id, char & error) const
{
	error = '0';
	map<string, Procesador>::const_iterator it;
	it = chips.find(id);
	if (it != chips.end()) (it->second).escribir_procesador();
	else error = '1';
}

void Cluster::alta_proceso_procesador(const string & id_procesador, const Proceso & p, char & error)
{
	error = '0';
	map<string, Procesador>::iterator it;
	it = chips.find(id_procesador);
	if (it != chips.end()){
		chips[id_procesador].alta_proceso(p, error);
		if (error == '1') error = '2';
		else if (error == '2') error = '3';
	}
	else error = '1';
}

void Cluster::baja_proceso_procesador(const string & id_procesador, int id_proceso, char & error)
{
	error = '0';
	map<string, Procesador>::iterator it;
	it = chips.find(id_procesador);
	if (it != chips.end()) {
		chips[id_procesador].baja_proceso(id_proceso, error);
		if (error == '1') error = '2';
	}
	else error = '1';
}

void Cluster::avanzar_tiempo(int t)
{
	for(map<string ,Procesador>::iterator it = chips.begin(); it != chips.end(); ++it){
		(it->second).quitar_procesos_acabados(t);
	}
}

void Cluster::compactar_memoria_cluster()
{
	for(map<string ,Procesador>::iterator it = chips.begin(); it != chips.end(); ++it){
		(it->second).compactar_memoria();
	}
}

void Cluster::compactar_memoria_procesador(const string & id, char & error){
	error = '0';
	map<string, Procesador>::iterator it;
	it = chips.find(id);
	if (it != chips.end()) (it->second).compactar_memoria();
	else error = '1';
}

void  Cluster::enviar_proceso_a_cluster(const Proceso & p, bool & puesto)
{
	int profundidad, hueco, memoria_total;
	string procesador;
	puesto = rec_aux(arq,chips,p.consultar_id_proceso(), p.consultar_memoria(),procesador,profundidad,hueco,memoria_total);
	if (puesto) {
		char error;
		alta_proceso_procesador(procesador,p,error);
	}	
}

bool Cluster::rec_aux(const BinTree<string> & a, const map<string,Procesador> & c, int id_proceso, int memoria, string & procesador, int & prof, int & hueco, int & mt)
{
	bool b;
	if (a.empty()) { b=false; hueco = -1;}
	else{
		
		int prof_d, prof_i, hueco_d, hueco_i, mt_i, mt_d;
		string p_d, p_i;
		bool b_i, b_d;
		b_i = rec_aux(a.left(), c, id_proceso, memoria, p_i, prof_i, hueco_i, mt_i);
		b_d = rec_aux(a.right(), c, id_proceso, memoria, p_d, prof_d, hueco_d, mt_d);
		map<string,Procesador>::const_iterator it;
		it = chips.find(a.value());
		//assert(it != chips.end());
		b = (not (it->second).esta_proceso(id_proceso)) and (it->second).cabe_proceso(memoria);
		int hueco_r = -1;;
		if (b) hueco_r = (it->second).hueco_mas_ajustado(memoria);
		//assert(b == (hueco_r>=0));
		//assert(b_i == (hueco_i>=0));
		//assert(b_d == (hueco_d>=0));
		b = b or b_i or b_d;
		if (b){
			if (hueco_i >= 0) ++prof_i;
			if (hueco_d >= 0) ++prof_d;
			if (hueco_r >= 0){
				hueco = hueco_r; procesador = a.value(); prof = 0; mt = (it->second).consultar_memoria_libre();
			}
			else if (hueco_i>=0){
				procesador = p_i; prof = prof_i; hueco = hueco_i; mt = mt_i;
			}
			if (hueco_r >= 0 and hueco_i>=0){
				if (hueco_i < hueco_r or (hueco_i == hueco_r and mt < mt_i)){
					procesador = p_i; prof = prof_i; hueco = hueco_i; mt = mt_i;
				}
			}
			if (hueco_d>=0 and hueco_r<0 and hueco_i<0){
				procesador = p_d; prof = prof_d; hueco = hueco_d; mt = mt_d;
			}
			else if (hueco_d>=0 and (hueco_r>=0 or hueco_i>=0)){
				if (hueco_d < hueco or (hueco_d == hueco and mt_d > mt) or (hueco_d == hueco and mt_d == mt and prof_d < prof)){
					procesador = p_d; prof = prof_d; hueco = hueco_d; mt = mt_d;
				}
			}
		}
		else hueco = -1;
		
	}
	return b;
}




