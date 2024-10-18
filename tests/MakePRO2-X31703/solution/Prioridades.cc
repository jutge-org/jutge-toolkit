#include "Prioridades.hh"

Prioridades::Prioridades(int n)
{
	for(int i = 1; i<=n; ++i) {
		string id_pri;
		cin >> id_pri;
		info[id_pri] = list<Proceso> ();
		info_aux[id_pri] = set<int> ();
		est[id_pri] = make_pair(0,0);
	}
}

bool Prioridades::existe_prioridad(const string & id) const
{
	return info.find(id)!=info.end();
}

void Prioridades::imprimir_prioridad(const string & id, char & error) const
{
	error = '0';
	map<string,list<Proceso> >::const_iterator it1 = info.find(id);
	if (it1 != info.end()) {
		for(list<Proceso>::const_iterator it_aux = (it1->second).begin(); it_aux != (it1->second).end(); ++it_aux){
			(*it_aux).escribir_proceso();
		}
		map<string,pair<int, int> >::const_iterator it3 = est.find(id);
		if (it3 != est.end()) cout << (it3->second).first << " " << (it3->second).second << endl;
	}
	else error = '1';
}

void Prioridades::imprimir_area_de_espera() const{
	map<string,list<Proceso> >::const_iterator it1 = info.begin();
	while (it1 != info.end()) {
		cout << it1->first << endl;
		for(list<Proceso>::const_iterator it_aux = (it1->second).begin(); it_aux != (it1->second).end(); ++it_aux){
			(*it_aux).escribir_proceso();
		}
		map<string,pair<int, int> >::const_iterator it3 = est.find(it1->first);
		if (it3 != est.end()) cout << (it3->second).first << " " << (it3->second).second << endl;
		++it1;
	}
}

void Prioridades::alta_prioridad(const string & id, char & error)
{
	error = '0';
	map<string,list<Proceso> >::iterator it=info.find(id);
	if (it==info.end()) {
		info[id] = list<Proceso> ();
		info_aux[id] = set<int>();
		est[id] = make_pair(0,0);
	}
	else error = '1';
}

void Prioridades::baja_prioridad(const string & id, char & error)
{
	error = '0';
	map<string,list<Proceso> >::iterator it=info.find(id);
	if (it ==info.end()) error = '1';
	else if ((*it).second.size() != 0) error = '2';
	else{
		info.erase(it);
		info_aux.erase(id);
		est.erase(id);
	}
}

void Prioridades::alta_proceso_espera(const string & prio, const Proceso & pr, char & error)
{
	error = '0';
	map<string,list<Proceso>>::iterator it=info.find(prio);
	if (it!=info.end()) {
		int id_pr;
		id_pr = pr.consultar_id_proceso();
		map<string,set<int> >::iterator it_aux=info_aux.find(prio);
		set<int>::iterator it_set = (it_aux->second).find(id_pr);
		if (it_set == (it_aux->second).end()){ 
			(it->second).insert((it->second).end(),pr);
			(it_aux->second).insert(id_pr);
		}
		else error = '2';
	}
	else error = '1';
}

void Prioridades::enviar_procesos_a_cluster(int n, Cluster & cl)
{
	int procesos_puestos = 0;
	map<string,list<Proceso> >::iterator it = info.begin();
	bool quedan_prioridades = it != info.end(); 
	while(procesos_puestos < n and quedan_prioridades){
		int aux = (it->second).size();
		int i = 1;
		while (i <= aux and procesos_puestos < n){
			Proceso pr = (*(it->second).begin());
			(it->second).erase((it->second).begin());
			bool b;
			cl.enviar_proceso_a_cluster(pr,b);
			if (b) {
				++procesos_puestos;
				info_aux[it->first].erase(pr.consultar_id_proceso());
				++(est[it->first].first);
				
			}
			else {
				(it->second).insert((it->second).end(),pr);
				++(est[it->first].second);
			}
			++i;
		}
		++it;
		quedan_prioridades = it != info.end(); 
	}
}
