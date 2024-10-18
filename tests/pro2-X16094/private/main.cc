#include "Estudiant.hh"
#include <vector>
#include <algorithm>

// Redondear, dos versiones funcion 

Estudiant redondear_e_f1(const Estudiant& est)
/* Pre: est tiene nota */
/* Post: el resultado es un estudiante como est pero con la nota redondeada */
{
  Estudiant est2(est.consultar_DNI());
  double notaR = ((int) (10.0 * (est.consultar_nota() + 0.05))) / 10.0;
  est2.afegir_nota(notaR);
  return est2;
}

Estudiant redondear_e_f2(const Estudiant& est)
/* Pre: est tiene nota */
/* Post: el resultado es un estudiante como est pero con la nota redondeada */
{
  Estudiant est2(est);
  double notaR = ((int) (10.0 * (est.consultar_nota() + 0.05))) / 10.0;
  est2.modificar_nota(notaR);
  return est2;
}


// Redondear, version accion

void redondear_e_a(Estudiant& est)
/* Pre: est tiene nota */
/* Post: est pasa a tener su nota original redondeada */
{
  est.modificar_nota(((int) (10. * (est.consultar_nota() + 0.05))) / 10.0);
}


bool busqueda_lin(const vector<Estudiant>& v, const Estudiant& e)
/* Pre: cierto */
/* Post: el resultado indica si x está en v */
{
  int tam = v.size();
  int i = 0;
  bool b = false;
  while (i<tam and not b) {
    if (v[i]==e) b=true; 
    else ++i;
  }
  return b;
}

int main()
{

  int op; cin >> op;
 
  Estudiant est;
  while (op!= -8){
    if (op==-1) {// red void
      est.llegir();
      if (est.te_nota()) redondear_e_a(est); 
      est.escriure();
    }
    else if (op==-2) {// red return constr + asig
      est.llegir();  Estudiant est2;
      if (est.te_nota()) {est2=redondear_e_f1(est); est=redondear_e_f2(est);}
      est.escriure(); est2.escriure();
    }
    else if (op==-3) { // comp
      est.llegir();
      Estudiant est2; est2.llegir();
      if (Estudiant::comp(est,est2)) cout<< "est es menor que est2"<<endl;
      else cout<< "est2 es menor o igual que est"<<endl;
      if (Estudiant::comp(est2,est)) cout<< "est2 es menor que est"<<endl;
      else cout<< "est es menor o igual que est2"<<endl;
    }
    else if (op==-4){
      int n; cin >> n;
      vector<Estudiant> v(n);
      for (int i=0; i<n;++i)
	v[i].llegir();
      sort(v.begin(),v.end(),Estudiant::comp);
      for (int i=0; i<n;++i)
	v[i].escriure();
    }
    else  if (op==-5){ // mas de afegir; para ver si detecta que  tiene nota
      try{
      Estudiant est2(1111111);
      est2.afegir_nota(5);
      est2.escriure();
      est2.afegir_nota(8);
      est2.escriure();
      }
      catch(PRO2Excepcio& e){
	cout << e.what() << endl;
      }
      // ha de dar: 1111111 NP
      //            Ja te nota 

    }
     else  if (op==-6){// mas de modif; para ver si detecta que no tiene nota
      try{
      Estudiant est2(1111111);
      est2.escriure();
      est2.modificar_nota(5);
      est2.escriure();
      }
      catch(PRO2Excepcio& e){
	cout << e.what() << endl;
      }
      // ha de dar: 1111111 NP
      //            No te nota 
     }
     else if (op==-7){ // los operators
       int n; cin >> n;
       vector<Estudiant> v(n);
       for (int i=0; i<n;++i)
	 v[i].llegir();
       
       Estudiant e, emarca;
       e.llegir();
       while (e!=emarca) {
	 bool b = busqueda_lin(v,e);
	 if (b) cout << e.consultar_DNI() << " hi es a v" << endl;
	 else  cout << e.consultar_DNI() << " no hi es a v" << endl;
	 e.llegir();
       }
     } 
    cin >> op; 
  }
}
