#ifndef SecGame_hh
#define SecGame_hh

#include "Player.hh"
#include "Board.hh"

// Libraries only useful for SecGame that depend on Unix/Linux
// Put here to avoid problems when compiling Game in Windows.
#include <unistd.h>
#include <fcntl.h>
#include <sys/resource.h>
#include <sys/stat.h>
#include <sys/wait.h>

const int TIME_LIMIT = 3;


class SecGame {

  /**
   * Struct with the info contained in /proc/self/stat or /proc/pid/stat.
   * Do "man proc" for documentation.
   */
  struct Stat {
    int pid;
    string comm;
    char state;
    int ppid;
    int pgrp;
    int session;
    int tty_nr;
    int tpgid;
    unsigned flags;
    long unsigned minflt;
    long unsigned cminflt;
    long unsigned majflt;
    long unsigned cmajflt;
    long unsigned utime;
    long unsigned stime;
    long cutime;
    long cstime;
    long priority;
    long nice;
    long num_threads;
    long itrealvalue;
    long long unsigned starttime;
    long unsigned vsize;
    long rss;
    long unsigned rsslim;
    long unsigned startcode;
    long unsigned endcode;
    long unsigned startstack;
    long unsigned kstkesp;
    long unsigned kstkeip;
    long unsigned signal;
    long unsigned blocked;
    long unsigned sigignore;
    long unsigned sigcatch;
    long unsigned wchan;
    long unsigned nswap;
    long unsigned cnswap;
    int exit_signal;
    int processor;
    unsigned rt_priority;
    unsigned policy;
    long long unsigned delayacct_blkio_ticks;
    long unsigned guest_time;
    long unsigned cguest_time;
  };

  static string make_tmp ();
  static void mymkfifo (string filename);
  static void mysystem (string command);
  static Stat read_proc_stat (int pid);
  static double cpu_time (int pid);
  static void set_rlimit (int opt, int lim);
  static void set_all_rlimits ();
  static bool check_dead (int pl, const pid_t& pid, vector<bool>& dead);
  static void alarm_handler (int);
  static string pipe (string tmp, int pl, bool input);

public:

  static void run_master (vector<string> names, istream& is, ostream& os, ostream& rs, int seed);
  static void run_child (int num, string name, string brd_pipe, string act_pipe, int seed);

};


#endif
