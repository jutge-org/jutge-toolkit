#include "Procesador.hh"
//#include <cassert>
	
Procesador::Procesador(){}	
	
Procesador::Procesador(int m){
	memoria_total = m;
	memoria_usada = 0;
	set<int> c;
	c.insert(0);
	huecos[m] = c;
	
}
	
void Procesador::escribir_procesador() const{
	//cout << "Memoria:" << endl;
	for(map<int,Proceso>::const_iterator it = mem.begin(); it != mem.end(); ++it){
		cout << it->first << " ";
		(it->second).escribir_proceso();
	}
	//cout << "Memoria aux:" << endl;
	//for(map<int,int>::const_iterator it = mem_aux.begin(); it != mem_aux.end(); ++it){
		//cout << it->first << " " << it->second << endl;
	//}
	//cout << "Huecos:" << endl;
	//for(map<int,set<int> >::const_iterator it = huecos.begin(); it != huecos.end(); ++it){
		//cout << it->first << ":";
		//for(set<int>::const_iterator it_aux = (it->second).begin(); it_aux != (it->second).end(); ++it_aux) cout << " " << *it_aux;
		//cout << endl;
	//}
	//cout << memoria_total << " " << memoria_usada << endl;
	//cout << endl;
}


////// COMPROBAR QUE LA MEMORIA SEA CORRECTA

int Procesador::consultar_memoria_libre() const{
	return memoria_total-memoria_usada;
}

int Procesador::consultar_memoria_total() const{
	return memoria_total;
}
	
int Procesador::consultar_memoria_usada() const{
	return memoria_usada;
}

bool Procesador::cabe_proceso(int m) const{
	return huecos.lower_bound(m) != huecos.end();
}

bool Procesador::esta_proceso(int m) const{
	map<int, int>::const_iterator it;
	it = mem_aux.find(m);
	return it != mem_aux.end();
}

int Procesador::hueco_mas_ajustado(int m) const{
	int res = -1;
	map<int, set<int> >::const_iterator it;
	it = huecos.lower_bound(m);
	if (it != huecos.end()) res = it->first;
	return res;
}

void Procesador::alta_proceso(const Proceso & p, char & error){
	error = '0';
	int mem_proc = p.consultar_memoria();
	int id_proc = p.consultar_id_proceso();
	// Comprobar que el proceso no esté ya
	if (mem_aux.find(id_proc) != mem_aux.end()) {
		error = '1';
	}
	else{
		map<int, set<int> >::iterator it = huecos.lower_bound(mem_proc);
		if (it == huecos.end()) {
			error = '2';
		}
		else{
			int medida_hueco = it->first;
			int pos_ini =  *((it->second).begin()); // Donde comienza en la memoria
			mem[pos_ini] = p;
			mem_aux[id_proc] = pos_ini;
			// borrar el hueco que ahora se esta usando
			it->second.erase(it->second.begin());
			// borrar el item si no quedan huecos de esa medida
			if ((it->second).size() == 0) {
				it = huecos.erase(it);
			}
			// añadir un hueco pequeñito si es que queda
			int medida_huequito = medida_hueco - mem_proc;
			if (medida_huequito > 0){
				// Proceso nuevo_hueco (0, medida_huequito,0);
				// mem[pos_ini + mem_proc] = nuevo_hueco;
				map<int, set<int> >::iterator it2 = huecos.find(medida_huequito);
				// No había huecos de ese tamaño
				if (it2 == huecos.end()) { 
					set<int> c;
					c.insert(pos_ini + mem_proc);
					huecos[medida_huequito] = c;
				}
				else{ // Ya había huecos de ese tamaño
					(it2->second).insert(pos_ini + mem_proc);
				}
			}
			memoria_usada += mem_proc;
		}
	}
}


void Procesador::baja_proceso(int id_proceso, char & error){
	error = '0';
	map<int, int>:: iterator it1;
	it1 = mem_aux.find(id_proceso);
	if (it1 == mem_aux.end()) error = '1';
	else{
		int pos_ini_proc = it1->second;
		map<int, Proceso>:: iterator it2;
		it2 = mem.find(pos_ini_proc);
		//assert(it2 != mem.end());
		memoria_usada -= (it2->second).consultar_memoria();
		// quito proceso (1)
		it1 = mem_aux.erase(it1);
		int mem_proc = (it2->second).consultar_memoria();
		int pos_ini_hueco = pos_ini_proc;
		int mem_hueco = mem_proc;
		// quito proceso (2)
		it2 = mem.erase(it2);
		// que pasa por detrás
		int mem_huequito;
		int pos_ini_huequito;
		if (it2 != mem.end()){
			pos_ini_huequito = pos_ini_proc + mem_proc;
			mem_huequito  = it2->first - pos_ini_proc - mem_proc;
			
		}
		else {
			pos_ini_huequito = pos_ini_proc + mem_proc;
			mem_huequito  = memoria_total - pos_ini_proc - mem_proc;
		}
		if (mem_huequito > 0){
			// hay un hueco detrás
			mem_hueco += mem_huequito;
			// borrar huequito
			map<int, set<int> >:: iterator it3;
			it3 = huecos.find(mem_huequito);
			//assert(it3 != huecos.end());
			(it3->second).erase(pos_ini_huequito);
			if ((it3->second).size() == 0) {
				it3 = huecos.erase(it3);
			}
		}
		
		// que pasa por delante
		if (it2 != mem.begin()){
			--it2;
			pos_ini_huequito = it2->first + (it2->second).consultar_memoria();
			mem_huequito  = pos_ini_proc - pos_ini_huequito;
		}
		else{
			pos_ini_huequito = 0 ;
			mem_huequito  = pos_ini_proc - pos_ini_huequito;
		}
		if (mem_huequito > 0){
			// hay un hueco delante
			mem_hueco += mem_huequito;
			pos_ini_hueco = pos_ini_huequito;
			// borrar huequito
			map<int, set<int> >:: iterator it3;
			it3 = huecos.find(mem_huequito);
			//assert(it3 != huecos.end());
			(it3->second).erase(pos_ini_huequito);
			if ((it3->second).size() == 0) {
				it3 = huecos.erase(it3);
			}
		}
		// Poner hueco nuevo
		map<int, set<int> >::iterator it_aux;
		it_aux = huecos.find(mem_hueco);
		if (it_aux == huecos.end()){
			set<int> aux;
			aux.insert(pos_ini_hueco);
			huecos[mem_hueco] = aux;
		}	
		else (it_aux->second).insert(pos_ini_hueco);
	}
}

void Procesador::compactar_memoria(){
	map<int, Proceso>::iterator it;
	it = mem.begin();
	int acum = 0;
	while(it != mem.end()){
		Proceso pr = it->second;
		int id_proc = pr.consultar_id_proceso();
		if (acum == it->first) {
			++it;
		}
		else{
			it = mem.erase(it);
			pair<int, Proceso> item(acum, pr);
			mem.insert(it,item); // insert con pista
			mem_aux[id_proc] = acum;
			
		}
		acum += pr.consultar_memoria();
	}
	huecos.clear();
	if (consultar_memoria_libre() > 0){
		set<int> c;
		c.insert(memoria_usada);
		huecos[consultar_memoria_libre()] = c;
	}
}

void Procesador::quitar_procesos_acabados(int t){
	map<int,Proceso>::iterator it;
	it = mem.begin();
	int ultima_pos = 0; 
	while(it != mem.end()){
		bool b;
		b = (it->second).restar_tiempo(t);
		if (b){
			while (it != mem.end() and b){
				if (ultima_pos < it->first){
					// hay un hueco antes
					// hay que borrarlo
					map<int, set<int>>::iterator it_aux;
					it_aux = huecos.find(it->first - ultima_pos);
					//assert(it_aux != huecos.end());
					(it_aux->second).erase(ultima_pos);
					if (it_aux->second.size() == 0) it_aux = huecos.erase(it_aux);
				}
				ultima_pos = it->first + (it->second).consultar_memoria();
				map<int, int>::iterator it_aux;
				it_aux = mem_aux.find((it->second).consultar_id_proceso());
				it_aux = mem_aux.erase(it_aux);
				memoria_usada -= (it->second).consultar_memoria();
				it = mem.erase(it);
				if (it != mem.end()) {
					b = (it->second).restar_tiempo(t);
				}
			}
			// puede que quede un hueco al final
			// hay que borrarlo
			if (it == mem.end()){
				if (ultima_pos < memoria_total){
					map<int, set<int>>::iterator it_aux;
					it_aux = huecos.find(memoria_total - ultima_pos); 
					//assert(it_aux != huecos.end());
					(it_aux->second).erase(ultima_pos);
					if (it_aux->second.size() == 0) it_aux = huecos.erase(it_aux);
				}
			}
			else if (ultima_pos < it->first){
				map<int, set<int>>::iterator it_aux;
				it_aux = huecos.find(it->first - ultima_pos); 
				(it_aux->second).erase(ultima_pos);
				if (it_aux->second.size() == 0) it_aux = huecos.erase(it_aux);
			}
			// añadir el nuevo hueco gordo
			int tam;
			int ini;
			if (mem.size() == 0){
				ini = 0; tam = memoria_total;
			}
			else if (it == mem.end()){
				--it;
				ini = it->first + (it->second).consultar_memoria();
				tam = memoria_total - ini;
			}
			else if (it == mem.begin()){
				ini = 0;
				tam = it->first;
			}
			else{
				map<int, Proceso>::iterator it_aux;
				it_aux = it;
				--it_aux;
				ini = it_aux->first + (it_aux->second).consultar_memoria();
				tam = it->first - ini;
			}
			map<int, set<int>>::iterator it_aux;
			it_aux = huecos.find(tam);
			if (it_aux == huecos.end()){
				set<int> aux;
				aux.insert(ini);
				huecos[tam] = aux;
			}
			else{
				(it_aux->second).insert(ini);
			}
			if (it != mem.end()){
				ultima_pos = it->first + (it->second).consultar_memoria();
				++it;
			} 
		}
		else {
			ultima_pos = it->first + (it->second).consultar_memoria();
			++it;
		}
	}
}

