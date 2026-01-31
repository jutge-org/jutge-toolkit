#include "SecGame.hh"


void help (int argc, char** argv) {
  cout << "Usage: " << argv[0] << " [options] player1 player2 ... [< default.cnf] [> default.out] " << endl;
  cout << "Available options:" << endl;
  cout << "--player=pl     -p player    set child player number" << endl;
  cout << "--seed=seed     -s seed      set random seed"         << endl;
  cout << "--input=file    -i input     set input file"          << endl;
  cout << "--output=file   -o output    set output file"         << endl;
  cout << "--list          -l           list registered players" << endl;
  cout << "--version       -v           print version"           << endl;
  cout << "--help          -h           print help"              << endl;
}


int main (int argc, char** argv) {
  if (argc == 1) {
    help(argc, argv);
    return EXIT_SUCCESS;
  }

  struct option long_options[] = {
    { "player",  required_argument, 0, 'p' },
    { "seed",    required_argument, 0, 's' },
    { "input",   required_argument, 0, 'i' },
    { "output",  required_argument, 0, 'o' },
    { "result",  required_argument, 0, 'r' },
    { "list",    no_argument,       0, 'l' },
    { "version", no_argument,       0, 'v' },
    { "help",    no_argument,       0, 'h' },
    { 0, 0, 0, 0 }
  };

  int player = -1;
  char* ifile = 0;
  char* ofile = 0;
  char* rfile = 0;
  int seed = -1;
  vector<string> args;

  while (true) {
    int index = 0;
    int c = getopt_long(argc, argv, "p:s:i:o:r:lvh", long_options, &index);
    if (c == -1) break;

    switch (c) {
      case 'p':
        player = string_to_int(optarg);
        break;
      case 's':
        seed = string_to_int(optarg);
        break;
      case 'i':
        ifile = optarg;
        break;
      case 'o':
        ofile = optarg;
        break;
      case 'r':
        rfile = optarg;
        break;
      case 'l':
        Registry::print_players(cout);
        return EXIT_SUCCESS;
      case 'v':
        cout << Board::version() << endl;
        cout << "compiled " << __TIME__ << " " << __DATE__ << endl;
        return EXIT_SUCCESS;
      case 'h':
        help(argc, argv);
        return EXIT_SUCCESS;
      default:
        return EXIT_FAILURE;
    }
  }

  while (optind < argc) args.push_back(argv[optind++]);

  _my_assert(seed >= 0, "Missing seed?");

  if (player == -1) { // master    

    istream* is = ifile ? new ifstream(ifile) : &cin;
    ostream* os = ofile ? new ofstream(ofile) : &cout;
    ostream* rs = rfile ? new ofstream(rfile) : &cerr;

    SecGame::run_master(args, *is, *os, *rs, seed);

    if (ifile) delete is;
    if (ofile) delete os;
    if (rfile) delete rs;
  }
  else { // child
    cerr << "Hello from child " << player << "." << endl;
    _my_assert(args.size() == 3, "Wrong number of parameters.");
    SecGame::run_child(player, args[0], args[1], args[2], seed);
  }
}
