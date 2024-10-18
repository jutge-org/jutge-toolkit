OPCIONS = -D_JUDGE_ -D_GLIBCXX_DEBUG -O2 -Wall -Wextra -Werror -Wno-sign-compare -std=c++11

program.exe: program.o Cluster.o Procesador.o Proceso.o Prioridades.o
	g++ -o program.exe program.o Cluster.o Procesador.o Proceso.o Prioridades.o $(OPCIONS)

program.o: program.cc Cluster.hh Procesador.hh Proceso.hh Prioridades.hh
	g++ -c program.cc $(OPCIONS)

Prioridades.o: Prioridades.cc Prioridades.hh Cluster.hh Procesador.hh Proceso.hh
	g++ -c Prioridades.cc $(OPCIONS)

Cluster.o: Cluster.cc Cluster.hh Procesador.hh Proceso.hh
	g++ -c Cluster.cc $(OPCIONS)

Proceso.o: Proceso.cc Proceso.hh
	g++ -c Proceso.cc $(OPCIONS)

Procesador.o: Procesador.cc Procesador.hh Proceso.hh
	g++ -c Procesador.cc $(OPCIONS)

practica.tar: 
	tar -cvf practica.tar Makefile program.cc Cluster.cc Cluster.hh Proceso.cc Proceso.hh Procesador.cc Procesador.hh Prioridades.cc Prioridades.hh

clean:
	rm -f *.o
	rm -f *.exe
