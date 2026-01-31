#include "Player.hh"
#include <climits>
#include <queue>

/**
 * Write the name of your player and save this file
 * with the same name and .cc extension.
 */
#define PLAYER_NAME Dummy


struct PLAYER_NAME : public Player {

  /**
   * Factory: returns a new instance of this class.
   * Do not modify this function.
   */
  static Player* factory () {
    return new PLAYER_NAME;
  }

  /**
   * Types and attributes for your player can be defined here.
   */

  const vector<Dir> dirs = { Down, Right, Up, Left };

  const int oo = INT_MAX;

  bool dead_in_pos (const Pos& p)  {
    return pos_ok(p) and cell(p.i,p.j).id != -1 and unit(cell(p.i,p.j).id).type == Dead;
  }

  bool zombie_in_pos (const Pos& p)  {
    return pos_ok(p) and cell(p.i,p.j).id != -1 and unit(cell(p.i,p.j).id).type == Zombie;
  }

  bool alive_in_pos (const Pos& p)  {
    return pos_ok(p) and cell(p.i,p.j).id != -1 and unit(cell(p.i,p.j).id).type == Alive;
  }

  bool alive_same_clan_in_pos (const Pos& p, int pl)  {
    return pos_ok(p) and cell(p.i,p.j).id != -1 and unit(cell(p.i,p.j).id).type == Alive and
      unit(cell(p.i,p.j).id).player == pl;
  }

  

  vector<vector<int>> distances_to_food ( ) {
    vector<vector<int>> distances(board_rows(),vector<int>(board_cols(),oo));
    queue<Pos> Q;
    for (int i = 0; i < board_rows(); ++i)
      for (int j = 0; j < board_cols(); ++j){
	if (cell(i,j).food) {
	  distances[i][j] = 0;
	  Q.push({i,j});
	}
      }
    
    while (not Q.empty()) {
      Pos p = Q.front(); Q.pop();
      for (auto d : dirs) {
	Pos np = p + d;
	if (pos_ok(np) and cell(np.i,np.j).type == Street and
	    not dead_in_pos(np) and
	    not zombie_in_pos(np) and
	    not alive_in_pos(np) and
	    distances[np.i][np.j] == oo) {
	  assert(distances[p.i][p.j] >= 0);
	  distances[np.i][np.j] = distances[p.i][p.j] + 1;
	  Q.push(np);
	}
      }      
    }
    return distances;
  }

  vector<vector<int>> distances_to_attackable_enemy (int pl) {
    vector<vector<int>> distances(board_rows(),vector<int>(board_cols(),oo));
    queue<Pos> Q;
    for (int i = 0; i < board_rows(); ++i)
      for (int j = 0; j < board_cols(); ++j){
	if (cell(i,j).id != -1 and unit(cell(i,j).id).player != pl and unit(cell(i,j).id).type == Alive) {
	  distances[i][j] = 0;
	  Q.push({i,j});
	}
      }
    
    while (not Q.empty()) {
      Pos p = Q.front(); Q.pop();
      for (auto d : dirs) {
	Pos np = p + d;
	if (pos_ok(np) and cell(np.i,np.j).type == Street and
	    not dead_in_pos(np) and
	    not zombie_in_pos(np) and
	    not alive_in_pos(np) and
	    distances[np.i][np.j] == oo) {
	  assert(distances[p.i][p.j] >= 0);
	  distances[np.i][np.j] = distances[p.i][p.j] + 1;
	  Q.push(np);
	}
      }      
    }
    return distances;
  }
  
  vector<vector<int>> distances_to_zombie ( ) {
    vector<vector<int>> distances(board_rows(),vector<int>(board_cols(),oo));
    queue<Pos> Q;
    for (int i = 0; i < board_rows(); ++i)
      for (int j = 0; j < board_cols(); ++j){
	if (cell(i,j).id != -1 and unit(cell(i,j).id).type == Zombie) {
	  distances[i][j] = 0;
	  Q.push({i,j});
	}
      }
    
    while (not Q.empty()) {
      Pos p = Q.front(); Q.pop();
      for (auto d : dirs) {
	Pos np = p + d;
	if (pos_ok(np) and cell(np.i,np.j).type == Street and
	    not dead_in_pos(np) and
	    not zombie_in_pos(np) and
	    not alive_in_pos(np) and
	    distances[np.i][np.j] == oo) {
	  assert(distances[p.i][p.j] >= 0);
	  distances[np.i][np.j] = distances[p.i][p.j] + 1;
	  Q.push(np);
	}
      }      
    }
    return distances;
  }

  pair<Dir,int> closest_dir (int id, const vector<vector<int>>& dist) {
    Pos p = unit(id).pos;
    int s_d = oo; // shortest distance
    Dir best_dir = Up;
    for (auto d : dirs) {
      Pos np = p + d;
      if (pos_ok(np) and cell(np.i,np.j).type != Waste and dist[np.i][np.j] < s_d) {
	s_d = dist[np.i][np.j];
	best_dir = d;
      }
    }
    return {best_dir,s_d};
  }
  
  virtual void play() {

    vector<vector<int>> dist_food = distances_to_food();
    vector<vector<int>> dist_attack = distances_to_attackable_enemy(me());
    vector<vector<int>> dist_zombie = distances_to_zombie();
    
    // for (uint i = 0; i < distances.size(); ++i){
    //   for (uint j = 0; j < distances[i].size(); ++j){
    // 	if (distances[i][j] == oo) cout << " in";
    // 	else {
    // 	  cout << " ";
    // 	  if (distances[i][j] < 10) cout << " ";
    // 	  cout << distances[i][j];
    // 	}
    //   }
    //   cout << endl;
    // }

    
    for (auto id : alive_units(me())) {
      pair<Dir,int> res_f = closest_dir(id,dist_food);
      pair<Dir,int> res_a = closest_dir(id,dist_attack);
      pair<Dir,int> res_z = closest_dir(id,dist_zombie);

      int best_dist = oo;
      Dir d = Up;
      if (random(0,100) < 80) {
	if (res_f.second < best_dist) {
	  d = res_f.first;
	  best_dist = res_f.second;
	}
      }
            
      if (res_a.second < best_dist) {
	d = res_a.first;
	best_dist = res_a.second;
      }

      if (res_z.second < best_dist) {
	d = res_z.first;
	best_dist = res_z.second;
      }

      if (best_dist < oo) move(id,d);
    }
  }
    
};

/**
 * Do not modify the following line.
 */
RegisterPlayer(PLAYER_NAME);
