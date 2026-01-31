#include "SecGame.hh"
#include <signal.h>

/**
   Function to measure wall clock time.
**/
double now () {
  struct timespec res;
  int r = clock_gettime(CLOCK_MONOTONIC_RAW, &res);
  return res.tv_sec + (res.tv_nsec / 1e9);
}
                                  

/**
 * Creates a temporal directory and returns its name.
 */
string SecGame::make_tmp () {
  char s[] = "/tmp/game-XXXXXX";
  _my_assert(mkdtemp(s), "In mkdtemp().");
  return string(s);
}


/**
 * Creates a fifo with error control.
 */
void SecGame::mymkfifo (string filename) {
  _my_assert(mkfifo(filename.c_str(), O_CREAT) == 0, "In mkfifo().");
  _my_assert(chmod(filename.c_str(), 0600) != -1,  "In chmod()."); // Octal!
}


/**
 * Like system() but for strings and with error control.
 */
void SecGame::mysystem (string command) {
  _my_assert(system(command.c_str()) != -1, "In system().");
}


/**
 * This surely reads very interesting things :-)
 */
SecGame::Stat SecGame::read_proc_stat (int pid) {
  ifstream ifs("/proc/" + (pid == -1 ? "self" : int_to_string(pid)) + "/stat");

  Stat r;
  ifs
    >> r.pid
    >> r.comm
    >> r.state
    >> r.ppid
    >> r.pgrp
    >> r.session
    >> r.tty_nr
    >> r.tpgid
    >> r.flags
    >> r.minflt
    >> r.cminflt
    >> r.majflt
    >> r.cmajflt
    >> r.utime
    >> r.stime
    >> r.cutime
    >> r.cstime
    >> r.priority
    >> r.nice
    >> r.num_threads
    >> r.itrealvalue
    >> r.starttime
    >> r.vsize
    >> r.rss
    >> r.rsslim
    >> r.startcode
    >> r.endcode
    >> r.startstack
    >> r.kstkesp
    >> r.kstkeip
    >> r.signal
    >> r.blocked
    >> r.sigignore
    >> r.sigcatch
    >> r.wchan
    >> r.nswap
    >> r.cnswap
    >> r.exit_signal
    >> r.processor
    >> r.rt_priority
    >> r.policy
    >> r.delayacct_blkio_ticks
    >> r.guest_time
    >> r.cguest_time
    ;
  return r;
}


/**
 * Returns the CPU time used by process pid.
 */
double SecGame::cpu_time (int pid) {
  static double ticks = sysconf(_SC_CLK_TCK);
  Stat stat = read_proc_stat(pid);
  return (stat.utime + stat.stime) / ticks;
}


/**
 * Sets one rlimit.
 */
void SecGame::set_rlimit (int opt, int lim) {
  struct rlimit rlim;
  rlim.rlim_cur = rlim.rlim_max = opt;
  _my_assert(setrlimit(lim, &rlim) == 0, "In setrlimit().");
}


/**
 * Sets all the rlimits for a player process.
 */
void SecGame::set_all_rlimits () {
  const int MB = 1024*1024;

  set_rlimit(    8, RLIMIT_NOFILE);
  set_rlimit(    1, RLIMIT_NPROC );
  set_rlimit(32*MB, RLIMIT_FSIZE );
  set_rlimit( 0*MB, RLIMIT_CORE  );
  set_rlimit(64*MB, RLIMIT_AS    );
  set_rlimit(64*MB, RLIMIT_STACK );

  // In the case of RLIMIT_CPU, we set the soft and hard bounds differently
  // so that the soft bound raises SIGXCPU (the second would rise SIGKILL).
  struct rlimit rlim;
  rlim.rlim_cur = TIME_LIMIT;
  rlim.rlim_max = TIME_LIMIT + 1;
  _my_assert(setrlimit(RLIMIT_CPU, &rlim) == 0, "In setrlimit().");
}


/**
 * This handler is called when too much time has passed.
 */
void SecGame::alarm_handler (int) {
  cerr << "fatal: alarm" << endl;
  exit(EXIT_FAILURE);
}


double t1 = -1, t2 = -1;
int right_pid = -1;

void my_alarm (int) {
  t2 = now();
  if (t2 - t1 > 2*TIME_LIMIT and right_pid != -1) {
    kill(right_pid, SIGKILL);
  }
}


/**
 * Returns the right pipe.
 */
string SecGame::pipe (string tmp, int pl, bool input) {
  return tmp + "/" + int_to_string(pl) + (input ? ".act" : ".brd");
}


/**
 * Checks whether pl with a given pid has died, and updates dead if needed.
 */
inline bool SecGame::check_dead (int pl, const pid_t& pid,
                                 vector<bool>& dead) {
  int status;
  pid_t r = waitpid(pid, &status, WNOHANG);
  _my_assert(r == 0 or r == pid, "In waitpid().");
  if (r == 0) return false;

  cerr << "info: death of " << pl << endl;
  return dead[pl] = true;
}


void SecGame::run_master (vector<string> names, istream& is, ostream& os,
                          ostream& rs, int seed) {
  cerr << "info: seed " << seed << endl;

  cerr << "info: loading game" << endl;
  Board b(is, seed);
  cerr << "info: loaded game" << endl;

  int np = b.num_players();
  int nr = b.num_rounds();
  _my_assert(np == (int)names.size(), "Wrong number of players.");

  cerr << "info: setting alarm" << endl;
  
  _my_assert(signal(SIGALRM, my_alarm) != SIG_ERR, "error at signal");
  ualarm(100000, 100000);
                                    

  string tmp = make_tmp();
  cerr << "info: tmp = " << tmp << endl;

  cerr << "info: pipes start" << endl;
  for (int pl = 0; pl < np; ++pl) {
    cerr << "info: pipes " << pl << endl;
    mymkfifo(pipe(tmp, pl, false));
    mymkfifo(pipe(tmp, pl, true));
  }
  cerr << "info: pipes end" << endl;

  cerr << "info: players start" << endl;
  vector<pid_t> pids;
  for (int pl = 0; pl < np; ++pl) {
    string name = names[pl];
    cerr << "info: preparing player " << pl << " as " << name << endl;
    b.names[pl] = name;
    pid_t pid = fork();
    _my_assert(pid >= 0, "In fork().");

    if (pid > 0) pids.push_back(pid); // parent
    else { // child
      char* argv[10];
      for (int i = 0; i < 10; ++i) argv[i] = 0;
      int c = 0;
      argv[c++] = strdup(("./AI" + name + ".exe").c_str());
      argv[c++] = strdup("-s");
      argv[c++] = strdup(int_to_string(seed).c_str());
      argv[c++] = strdup("-p");
      argv[c++] = strdup(int_to_string(pl).c_str());
      argv[c++] = strdup(name.c_str());
      argv[c++] = strdup(pipe(tmp, pl, false).c_str());
      argv[c++] = strdup(pipe(tmp, pl, true).c_str());

      _my_assert(execvp(argv[0], argv) >= 0,
                 "In execvp(). Maybe player does not exist?");
      _exit(0);
    }
  }
  cerr << "info: players end" << endl;

  cerr << "info: opening pipes start" << endl;
  vector<bool> dead(np, false);
  vector<ofstream*> brds;
  vector<ifstream*> acts;
  for (int pl = 0; pl < np; ++pl) {
    cerr << "info: opening pipes " << pl << endl;
    brds.push_back(new ofstream(pipe(tmp, pl, false)));
    acts.push_back(new ifstream(pipe(tmp, pl, true)));
  }
  cerr << "info: open pipes end" << endl;

  cerr << "info: ignoring sigpipe" << endl;
  signal(SIGPIPE, SIG_IGN);

  os << "SecGame" << endl << endl;
  os << "Seed " << seed << endl << endl;
  b.print_settings(os);
  b.print_names(os);
  b.print_state(os);

  for (int pl = 0; pl < np; ++pl) b.print_settings(*brds[pl]);

  for (int round = 0; round < nr; ++round) {
    cerr << "info: start round " << round << endl;
    vector<Action> actions(np);

    for (int pl = 0; pl < np; ++pl) {
      cerr << "info:     start player " << pl << endl;

      try {
        if (dead[pl]) throw 1;

        if (check_dead(pl, pids[pl], dead)) throw 1;

        b.stats[pl] = max(0.0, min(1.0, cpu_time(pids[pl])/TIME_LIMIT));
        if (b.stats[pl] == 1.0) {
          dead[pl] = true;
          throw 1;
        }


        actions[pl] = Action();
        *brds[pl] << "go" << endl;
        b.print_state(*brds[pl]);
		
        t1 = now();
        right_pid = pids[pl];
        Action a(*acts[pl]);
        right_pid = -1;
        if (check_dead(pl, pids[pl], dead)) throw 1;
      
        actions[pl] = a;

      }
      catch (int dead) {
        cerr << "info:     dead player " << pl << endl;
        b.stats[pl] = -1;
      }

      cerr << "info:     end player " << pl << endl;
    }

    b.next(actions, os);
    b.print_state(os);
    cerr << "info: end round " << round << endl;
  }

  cerr << "info: writing good result file" << endl;

  b.print_results();

  for (int pl = 0; pl < np; ++pl)
    cerr << "info: player " << b.name(pl) << " ended with status "
         << fixed << setprecision(3) << b.stats[pl] << endl;

  for (int pl = 0; pl < np; ++pl)
    rs << b.name(pl) << " " << fixed << setprecision(3) << b.stats[pl]
       << " " << b.score(pl) << endl;

  mysystem("rm -rf " + tmp);

  cerr << "info: game played" << endl;
}


void SecGame::run_child (int pl, string name, string brd_pipe,
                         string act_pipe, int seed) {
  // set the limits
  set_all_rlimits();
  
  // open the pipes
  ifstream brd_stream(brd_pipe);
  ofstream act_stream(act_pipe);

  // control name length
  _my_assert(name.size() <= 12, "Player name too long.");
  
  // redirect stdout to /dev/null
  stringstream buffer; //workaround because it seems that Docker can't access /dev/null
  cout.rdbuf(buffer.rdbuf());

  
  // load the player
  Player* player = Registry::new_player(name);
  player->me_ = pl;
  player->set_random_seed(seed + pl + 1);
  *static_cast<Settings*>(player) = Settings::read_settings(brd_stream);

  // main loop
  double real_time = 0;
  string s;
  while (brd_stream >> s) {
    _my_assert(s == "go", "Expected 'go' while parsing.");
    player->reset(brd_stream);

    double start = now();
    player->play();
    double end = now();
    real_time += end - start;
    if (real_time > 2*TIME_LIMIT) {
      cerr << "wall clock time exceeded" << endl;
      exit(1);
    }

    Action::print((*player).v, act_stream);
  }
}
