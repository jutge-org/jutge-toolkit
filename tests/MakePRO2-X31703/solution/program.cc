#include "Prioridades.hh"

int main(){
	Cluster cl;
	cl.configurar_cluster();
	int n;
	cin >> n;
	Prioridades prios (n);
	string instr;
	cin >> instr;
	while (instr!="fin"){
		if (instr == "configurar_cluster" or instr == "cc"){
			cout << "#" << instr << endl;
			cl.configurar_cluster();
		}
		else if (instr=="modificar_cluster" or instr == "mc"){
			string id;
			cin >> id;
			Cluster aux;
			aux.configurar_cluster();
			char error;
			cout << "#" << instr << " " << id << endl;
			cl.modificar_cluster(id, aux, error);
			if (error == '1') cout << "error: no existe procesador" << endl;
			else if (error == '2') cout << "error: procesador con procesos" << endl;
			else if (error == '3') cout << "error: procesador con auxiliares" << endl;
		}
		else if (instr=="alta_prioridad" or instr == "ap"){
			string id_prio;
			cin >> id_prio;
			char error;
			cout << "#" << instr << " " << id_prio << endl;
			prios.alta_prioridad(id_prio, error);
			if (error == '1') cout << "error: ya existe prioridad" << endl;
		}
		else if (instr=="baja_prioridad" or instr == "bp"){
			string id_prio;
			cin >> id_prio;
			char error;
			cout << "#" << instr << " " << id_prio << endl;
			prios.baja_prioridad(id_prio, error);
			if (error == '1') cout << "error: no existe prioridad" << endl;
			else if (error == '2') cout << "error: prioridad con procesos" << endl; 
		}
		else if (instr=="alta_proceso_espera" or instr == "ape" ){
			int id_proceso, tiempo, memoria;
			string id_prio;
			cin >> id_prio;
			cin >> id_proceso;
			cin >> memoria;
			cin >> tiempo;
			char error;
			Proceso p (id_proceso,memoria,tiempo);
			cout << "#" << instr << " " << id_prio << " " << id_proceso << endl;
			prios.alta_proceso_espera(id_prio, p, error);
			if (error == '1') cout << "error: no existe prioridad" << endl;
			else if (error == '2') cout << "error: ya existe proceso" << endl; 
		}
		else if (instr=="alta_proceso_procesador" or instr == "app"){
			string id_procesador;
			int id_proceso, tiempo, memoria;
			cin >> id_procesador;
			cin >> id_proceso;
			cin >> memoria;
			cin >> tiempo;
			Proceso p (id_proceso,memoria,tiempo);
			char error;
			cout << "#" << instr << " " << id_procesador << " " << id_proceso << endl;
			cl.alta_proceso_procesador(id_procesador,p,error);
			if (error == '1') cout << "error: no existe procesador" << endl;
			else if (error == '2') cout << "error: ya existe proceso" << endl;
			else if (error == '3') cout << "error: no cabe proceso" << endl;
		}
		else if (instr=="baja_proceso_procesador" or instr == "bpp"){
			string id_procesador;
			int id_proceso;
			cin >> id_procesador;
			cin >> id_proceso;
			char error;
			cout << "#" << instr << " " << id_procesador << " " << id_proceso << endl;
			cl.baja_proceso_procesador(id_procesador, id_proceso, error);
			if (error == '1') cout << "error: no existe procesador" << endl;
			else if (error == '2') cout << "error: no existe proceso" << endl;
		}
		else if (instr=="enviar_procesos_cluster" or instr == "epc"){
			int np;
			cin >> np;
			cout << "#" << instr << " " << np << endl;
			prios.enviar_procesos_a_cluster(np,cl);
		}
		else if (instr=="avanzar_tiempo" or instr == "at"){
			int tiempo;
			cin >> tiempo;
			cout << "#" << instr << " " << tiempo << endl;
			cl.avanzar_tiempo(tiempo);
		}
		else if (instr=="imprimir_prioridad" or instr == "ipri"){
			string id;
			cin >> id;
			cout << "#" << instr << " " << id << endl;
			char error;
			prios.imprimir_prioridad(id, error);
			if (error == '1') cout << "error: no existe prioridad" << endl;
		}
		else if (instr=="imprimir_area_espera" or instr == "iae"){
			cout << "#" << instr << endl;
			prios.imprimir_area_de_espera();
		}
		else if (instr=="imprimir_procesador" or instr == "ipro"){
			string id;
			cin >> id;
			char error;
			cout << "#" << instr << " " << id << endl;
			cl.imprimir_procesador(id, error);
			if (error == '1') cout << "error: no existe procesador" << endl;
		}
		else if (instr == "imprimir_estructura_cluster" or instr == "iec"){
			cout << "#" << instr << endl;
			cl.imprimir_estructura_cluster();
		}
		else if (instr == "imprimir_procesadores_cluster" or instr == "ipc"){
			cout << "#" << instr << endl;
			cl.imprimir_procesadores_cluster();
		}
		else if (instr == "compactar_memoria_procesador" or instr == "cmp"){
			string id;
			cin >> id;
			char error;
			cout << "#" << instr << " " << id << endl;
			cl.compactar_memoria_procesador(id, error);
			if (error == '1') cout << "error: no existe procesador" << endl;
		}
		else if (instr == "compactar_memoria_cluster" or instr == "cmc"){
			cout << "#" << instr << endl;
			cl.compactar_memoria_cluster();
		}
		//		else assert(false);
		cin >> instr;
	}
}

