//////// STUDENTS DO NOT NEED TO READ BELOW THIS LINE ////////

#include "Board.hh"
#include "Action.hh"

Board::Board(istream &is, int seed)
{
  set_random_seed(seed);
  *static_cast<Settings *>(this) = Settings::read_settings(is);

  player2alive_units = vector<set<int>>(num_players());
  player2dead_units = vector<set<int>>(num_players());
  zombies_ = set<int>();

  names = vector<string>(num_players());
  scr = vector<int>(num_players(), 0);
  scr_accumulated = vector<int>(num_players(), 0);
  nb_cells = vector<int>(num_players(), 0); // Is computed in read grid
  overall_strength = vector<int>(num_players(), clan_ini_strength());

  stats = vector<double>(num_players(), 0);

  rnd = 0;

  fresh_id = 0;
  read_generator_and_grid(is);

  for (auto &p : units)
    fresh_id = max(fresh_id, p.first);
  ++fresh_id;

  _my_assert(ok(), "Invariants are not satisfied.");
}

void Board::check_is_good_initial_fixed_board() const
{
  vector<int> num_units(num_players(), 0);
  int num_zombies = 0;
  int num_food = 0;

  _my_assert(int(grid.size()) == board_rows(), "Fixed board has wrong number of rows.");
  _my_assert(int(grid[0].size()) == board_cols(), "Fixed board has wrong number of cols.");

  for (int i = 0; i < board_rows(); ++i)
    for (int j = 0; j < board_cols(); ++j)
    {
      Cell c = grid[i][j];
      if (c.food)
        ++num_food;
      if (c.id != -1)
      {
        int id = c.id;
        _my_assert(units.count(id) != 0, "Unit places in grid does noe appear in units");
        const Unit &u = units.find(id)->second;
        _my_assert(u.type != Dead, "Initial unit already dead");
        if (u.type == Alive)
        {
          _my_assert(player_ok(u.player), "Player not ok in check_is_good_initial_fixed_board");
          _my_assert(c.owner == u.player, "Unit placed in a cell but player does not own it");
          _my_assert(u.pos == Pos(i, j), "Live unit does not have right position");
          _my_assert(player2alive_units[u.player].count(id) != 0, "Live unit not in player2alive_units");
          ++num_units[u.player];
        }
        else
        { // We know it is a zombie
          ++num_zombies;
          _my_assert(u.player == -1, "Zombies should have player -1");
          _my_assert(u.pos == Pos(i, j), "Zombie does not have right position");
          _my_assert(zombies_.count(id) != 0, "Live unit not in zombies_");
        }
      }
    }

  _my_assert(num_food == num_ini_food(), "Fixed board has wrong number of initial food.");
  _my_assert(num_zombies == num_ini_zombies(), "Fixed board has wrong number of initial zombies.");
  for (int p = 0; p < num_players(); ++p)
    _my_assert(int(player2alive_units[p].size()) == num_units[p], "Fixed board has wrong number of initial live units.");
}

void Board::print_settings(ostream &os) const
{

  os << version() << endl;
  os << endl;
  os << "NUM_PLAYERS" << "\t\t\t" << num_players() << endl;
  os << "NUM_ROUNDS" << "\t\t\t" << num_rounds() << endl;
  os << "BOARD_ROWS" << "\t\t\t" << board_rows() << endl;
  os << "BOARD_COLS" << "\t\t\t" << board_cols() << endl;
  os << "NUM_INI_UNITS_PER_CLAN" << "\t\t" << num_ini_units_per_clan() << endl;
  os << "NUM_INI_ZOMBIES" << "\t\t\t" << num_ini_zombies() << endl;
  os << "NUM_INI_FOOD" << "\t\t\t" << num_ini_food() << endl;
  os << "CLAN_INI_STRENGTH" << "\t\t" << clan_ini_strength() << endl;
  os << "POINTS_FOR_KILLING_PERSON" << "\t" << points_for_killing_person() << endl;
  os << "POINTS_FOR_KILLING_ZOMBIE" << "\t" << points_for_killing_zombie() << endl;
  os << "POINTS_PER_OWNED_CELL" << "\t\t" << points_per_owned_cell() << endl;
  os << "FOOD_STRENGTH" << "\t\t\t" << food_strength() << endl;
  os << "ROUNDS_BEFORE_BECOMING_ZOMBIE" << "\t" << rounds_before_becoming_zombie() << endl;
}

void Board::print_names(ostream &os) const
{
  os << "names         ";
  for (int pl = 0; pl < num_players(); ++pl)
    os << ' ' << name(pl);
  os << endl;
}

void Board::print_state(ostream &os)
{

  // Should start with the same format of Info::read_grid.
  // Then other data describing the state.

  os << endl
     << endl;

  os << "   ";
  for (int j = 0; j < board_cols(); ++j)
    os << j / 10;
  os << endl;

  os << "   ";
  for (int j = 0; j < board_cols(); ++j)
    os << j % 10;
  os << endl;

  for (int i = 0; i < board_rows(); ++i)
  {
    os << i / 10 << i % 10 << " ";
    for (int j = 0; j < board_cols(); ++j)
    {
      const Cell &c = grid[i][j];
      if (c.type == Waste)
        os << 'W';
      else if (c.owner == 0)
        os << '0';
      else if (c.owner == 1)
        os << '1';
      else if (c.owner == 2)
        os << '2';
      else if (c.owner == 3)
        os << '3';
      else
        os << '.';
    }
    os << endl;
  }

  os << endl
     << "units" << endl;
  os << units.size() << endl;
  os << "type\tid\tplayer\trow\tcolumn\trounds" << endl;
  for (const auto &ci : units)
  {
    os << UnitType2char(ci.second.type) << "\t";
    os << ci.second.id << "\t";
    os << ci.second.player << "\t";
    os << ci.second.pos.i << "\t";
    os << ci.second.pos.j << "\t";
    os << ci.second.rounds_for_zombie << endl;
  }

  os << endl
     << "food" << endl;
  // Collect them
  vector<Pos> food;
  for (int i = 0; i < board_rows(); ++i)
    for (int j = 0; j < board_cols(); ++j)
      if (grid[i][j].food)
        food.push_back(Pos(i, j));
  os << food.size() << endl;
  os << "row\tcolumn" << endl;
  for (const auto &p : food)
  {
    os << p.i << "\t";
    os << p.j << endl;
  }

  os << endl;

  os << "round " << rnd << endl;
  os << endl;

  os << "score";
  for (auto s : scr)
    os << "\t" << s;
  os << endl;
  os << endl;

  os << "scr_acc";
  for (auto s : scr_accumulated)
    os << "\t" << s;
  os << endl;
  os << endl;

  os << "strength";
  for (auto s : overall_strength)
    os << "\t" << s;
  os << endl;
  os << endl;

  os << "status";
  for (auto s : stats)
    os << "\t" << s;
  os << endl;
  os << endl;
}

void Board::print_results() const
{
  int max_score = 0;
  vector<int> v;
  for (int pl = 0; pl < num_players(); ++pl)
  {

    cerr << "info: player " << name(pl)
         << " got score " << score(pl) << endl;

    if (score(pl) == max_score)
      v.push_back(pl);
    else if (score(pl) > max_score)
    {
      max_score = score(pl);
      v = vector<int>(1, pl);
    }
  }

  cerr << "info: player(s)";
  for (int pl : v)
    cerr << " " << name(pl);
  cerr << " got top score" << endl;
}

// Returns whether c1 wins
bool Board::first_unit_wins_attack(const Unit &u1, const Unit &u2)
{
  int S = 30; // 30% vegades attack is a surprise and u1 wins
  if (random(0, 100) < S)
    return true;

  // Otherwise, it depend on the strength
  int u1_strength = strength(u1.player);
  int u2_strength = strength(u2.player);

  if (u1_strength + u2_strength == 0)
    return random(0, 1) == 0; // If both no strength --> 50-50
  int M = 1000;
  int num = random(0, M);
  double threshold = double(u1_strength) / (u1_strength + u2_strength) * M;
  return num < threshold;
}

void Board::perform_attack(Unit &orig_u, Unit &dest_u, vector<vector<int>> &alive_to_dead)
{
  bool first_wins = first_unit_wins_attack(orig_u, dest_u);
  Unit &winner = (first_wins ? orig_u : dest_u);
  Unit &loser = (first_wins ? dest_u : orig_u);

  alive_to_dead[loser.player].push_back(loser.id);
  loser.type = Dead;
  loser.rounds_for_zombie = rounds_before_becoming_zombie();
  scr_accumulated[winner.player] += points_for_killing_person();
}

bool Board::execute(const Command &m,
                    vector<int> &food_to_regenerate,
                    vector<vector<int>> &zombie_to_unit,
                    vector<vector<int>> &alive_to_dead)
{
  int id = m.id;
  Dir dir = Dir(m.dir);
  CommandType c_type = CommandType(m.c_type);

  if (not command_type_ok(c_type))
  {
    cerr << "warning: invalid command type in command: " << c_type << endl;
    return false;
  }

  if (not dir_ok(dir))
  {
    cerr << "warning: invalid dir in command: " << dir << endl;
    return false;
  }

  Unit &un = units[id];
  UnitType type = un.type;
  int pl = un.player;
  Pos op = un.pos;
  Cell &oc = grid[op.i][op.j];

  if (type == Alive and (dir == DR or dir == RU or dir == UL or dir == LD))
    return false; // Alive not diagonal

  if (type == Dead)
    return false; // Unit is dead (maybe has been dead in this round)

  Pos np = op + dir;
  if (not pos_ok(np))
  {
    cerr << "warning: cannot move to position " << np << " out of the board." << endl;
    return false;
  }

  Cell &nc = grid[np.i][np.j];

  if (type == Zombie)
  {
    if (nc.type == Waste)
    {
      return false;
    }
    else if (nc.food)
    {                                      // Cell with food
      ++food_to_regenerate[num_players()]; // last position is for zombies
      nc.food = false;
      nc.owner = -1;
      nc.id = id;
      un.pos = np;
      oc.id = -1;
    }
    else if (nc.id == -1)
    { // Cell with no unit
      nc.owner = -1;
      nc.id = id;
      un.pos = np;
      oc.id = -1;
    }
    else
    {                          // Cell with unit
      Unit &au = units[nc.id]; // attacked unit
      if (au.type == Zombie or au.type == Dead)
      { // Zombie attacks zombie
        return false;
      }
      else
      { // Attack and bite a live unit
        if (au.rounds_for_zombie == -1)
        {
          au.rounds_for_zombie = rounds_before_becoming_zombie() + 1;
        }
      }
    }
  }
  else if (type == Alive)
  {
    if (nc.type == Waste)
    {
      cerr << "warning: cannot move to position " << np << " with waste." << endl;
      return false;
    }
    else if (nc.food)
    { // Cell with food
      ++food_to_regenerate[pl];
      nc.food = false;
      nc.owner = pl;
      nc.id = id;
      un.pos = np;
      oc.id = -1;
    }
    else if (nc.id == -1)
    { // Cell with no unit
      nc.owner = pl;
      nc.id = id;
      un.pos = np;
      oc.id = -1;
    }
    else
    {                          // Cell with unit
      Unit &au = units[nc.id]; // attacked unit
      if (au.type == Zombie)
      {                                      // Kill a zombie
        zombie_to_unit[pl].push_back(nc.id); // zombie will be regenerated as unit of this clan
        nc.id = -1;                          // nobody is in the cell previouly occupied by the zombie
        au.pos = {-1, -1};                   // no position (pending to be regenerated)
        scr_accumulated[pl] += points_for_killing_zombie();
      }
      else if (au.type == Dead)
      {
        return false;
      }
      else if (au.player == pl)
      { // attacks among same clan not allowed
        return false;
      }
      else
      { // attacks among different clans
        perform_attack(un, au, alive_to_dead);
      }
    }
  }

  return true;
}

bool Board::is_good_pos_to_regen(const Pos &p) const
{

  if (not grid[p.i][p.j].is_empty())
    return false;

  for (int i = p.i - 2; i <= p.i + 2; ++i)
  { // Check nobody is nearby
    for (int j = p.j - 2; j <= p.j + 2; ++j)
    {
      if (pos_ok(Pos(i, j)) and grid[i][j].id != -1)
        return false;
    }
  }
  return true;
}

Pos Board::get_random_pos_where_regenerate()
{
  vector<Pos> res;
  for (int i = 0; i < board_rows(); ++i)
  {
    for (int j = 0; j < board_cols(); ++j)
    {
      if (is_good_pos_to_regen(Pos(i, j)))
        res.push_back(Pos(i, j));
    }
  }

  if (res.size() != 0)
    return res[random(0, res.size() - 1)];
  else
    return get_empty_pos();
}

// pair<bool,Pos> Board::get_random_pos_where_regenerate ( ) {
//   vector<Pos> res;
//   for (int i = 0; i < board_rows(); ++i){
//     for (int j = 0; j < board_cols(); ++j) {
//       if (is_good_pos_to_regen(Pos(i,j))) res.push_back(Pos(i,j));
//     }
//   }

//   if (res.size() != 0)  return {true,res[random(0,res.size()-1)]};
//   else                  return {false,Pos()};
// }

void Board::next(const vector<Action> &act, ostream &os)
{

  _my_assert(ok(), "Invariants are not satisfied.");

  int npl = num_players();
  _my_assert(int(act.size()) == npl, "Size should be number of players.");

  // Elements to be regenerated
  vector<int> food_to_regenerate(num_players() + 1, 0); // we know how much food each clan has collected, in order to change overall_strength at the end of the round. Last position is for food eaten by zombies
  vector<vector<int>> zombie_to_unit(num_players());
  vector<vector<int>> alive_to_dead(num_players());

  // Chooses (at most) one command per unit.
  set<int> seen;
  vector<vector<Command>> v(npl);
  for (int pl = 0; pl < npl; ++pl)
    for (const Command &m : act[pl].v)
    {
      int id = m.id;
      int c_type = m.c_type;
      int dir = m.dir;

      auto it = units.find(id);

      if (it == units.end())
        cerr << "warning: invalid id : " << id << endl;
      else if (it->second.player != pl)
        cerr << "warning: unit " << id << " of player " << it->second.player
             << " not owned by " << pl << endl;
      else
      {
        // Here an assert as repetitions should have already been filtered out.
        _my_assert(not seen.count(id), "More than one command for the same unit.");
        seen.insert(id);

        v[pl].push_back(Command(id, c_type, dir));
      }
    }

  // Makes all players' commands using a random order,
  // but respecting the relative order of the units of the same player.
  // Permutations are not equally likely to avoid favoring leading clans.
  int num = 0; // Counts number of pending commands
  for (int pl = 0; pl < npl; ++pl)
    num += v[pl].size();

  set<int> killed;
  vector<Command> commands_done;
  vector<int> index(npl, 0);
  while (num--)
  {
    int q = 0; // Counts number of players with some action pending
    for (int pl = 0; pl < npl; ++pl)
      q += index[pl] < (int)v[pl].size();
    _my_assert(q > 0, "q > 0 in next.");
    int ran = random(1, q); // Decide whether 1st, 2nd, 3rd,, player with something pending is chosen
    int pl = -1;
    int acum = 0;
    while (acum < ran)
    {
      ++pl;
      acum += index[pl] < (int)v[pl].size(); // If index > ..., then player has nothing pending
                                             // and does not count
    }

    const Command &m = v[pl][index[pl]++];
    if (execute(m, food_to_regenerate, zombie_to_unit, alive_to_dead))
      commands_done.push_back(m);
  }

  move_zombies(food_to_regenerate, zombie_to_unit, alive_to_dead, commands_done);
  // Es mouen els zombies (de moment, que facin moviments random, ja els farem intel·ligents)
  // Mirar com es fa a Moria (pel que sembla, s'execute un move i es posar a la llista de commands_done)

  os << "commands" << endl;
  Action::print(commands_done, os);

  // Es decrementen les rondes per a convertir-se en zombie
  // Es converteix en zombie a qui li toca
  // S'actualitzen zombies_ i player2alive_units i player2dead_units
  // Es regeneren les units (zombies morts que passen a ser unitats)
  // Es regenera tot el menjar que ha desaparegut
  // Comptem number cells de cada un
  // Actualitzem score, que serà el scr_accumulated + les cel·les de cadascu

  decrement_rounds_for_becoming_zombie();

  execute_conversion_to_zombie();

  execute_conversion_zombie_to_alive(zombie_to_unit);

  execute_conversion_alive_to_dead(alive_to_dead);

  execute_random_conversion_live_unit();

  regenerate_food_and_update_strength(food_to_regenerate); // also substracts the food consumed per round

  update_nb_cells();

  update_score();

  ++rnd;

  _my_assert(ok(), "Invariants are not satisfied.");
}

void Board::execute_conversion_to_zombie()
{
  for (auto &p : units)
  {
    Unit &u = p.second;
    if (u.rounds_for_zombie == 0)
    {
      _my_assert(u.type != Zombie, "Cannot convert zombie to zombie");
      if (u.type == Alive)
      { // Alive to zombie
        _my_assert(player2alive_units[u.player].count(u.id), "Alive unit not found in player2alive_units");
        player2alive_units[u.player].erase(u.id);
        zombies_.insert(u.id);
        u.type = Zombie;
        u.player = -1;
        u.rounds_for_zombie = -1;
        grid[u.pos.i][u.pos.j].owner = -1;
      }
      else
      {
        _my_assert(u.type == Dead, "If not zombie or alive, should be dead");
        _my_assert(player2dead_units[u.player].count(u.id), "Dead unit not found in player2dead_units");
        player2dead_units[u.player].erase(u.id);
        zombies_.insert(u.id);
        u.type = Zombie;
        u.player = -1;
        u.rounds_for_zombie = -1;
        grid[u.pos.i][u.pos.j].owner = -1;
      }
    }
  }
}

void Board::execute_conversion_zombie_to_alive(vector<vector<int>> &zombie_to_unit)
{
  for (int p = 0; p < num_players(); ++p)
  {
    for (int id : zombie_to_unit[p])
    {
      _my_assert(units.count(id) != 0, "Unit which should be converted zombie->unit not found in units");
      _my_assert(zombies_.count(id) != 0, "Unit which should be converted zombie->unit not found in zombies_");
      _my_assert(units[id].type == Zombie, "Unit in zombie_to_unit is not a zombie");
      Pos new_pos = get_random_pos_where_regenerate();
      Unit &u = units[id];
      u.type = Alive;
      u.player = p;
      u.pos = new_pos;
      u.rounds_for_zombie = -1;
      zombies_.erase(id);
      player2alive_units[p].insert(id);

      Cell &c = grid[new_pos.i][new_pos.j];
      c.owner = p;
      c.id = id;
    }
  }
}

void Board::execute_conversion_alive_to_dead(vector<vector<int>> &alive_to_dead)
{
  for (int p = 0; p < num_players(); ++p)
  {
    for (int id : alive_to_dead[p])
    {
      _my_assert(units.count(id) != 0, "Unit which should be converted alive->dead not found in units");
      _my_assert(player2alive_units[p].count(id) != 0, "Unit which should be converted alive->dead not found in player2alive_units");
      _my_assert(units[id].type == Dead, "Unit in alive_to_dead should have already been markes as dead");
      Unit &u = units[id];
      u.type = Dead;
      u.player = p;
      u.rounds_for_zombie = rounds_before_becoming_zombie();
      player2alive_units[p].erase(id);
      player2dead_units[p].insert(id);
    }
  }
}

pair<int, int> Board::selectLargestSmallestClan()
{
  vector<pair<int, int>> alive_clan(num_players());
  for (uint p = 0; p < alive_clan.size(); ++p)
    alive_clan[p] = {player2alive_units[p].size(), p};
  sort(alive_clan.begin(), alive_clan.end(), greater<pair<int, int>>()); // sort descending

  if (alive_clan[0].first == alive_clan.back().first)
  { // All clans same number of alive units
    int clan_wins = random(0, 3);
    int clan_loses = random(0, 3);
    while (clan_loses == clan_wins)
      clan_loses = random(0, 3);
    return {clan_wins, clan_loses};
  }

  vector<int> largest_clans = {alive_clan[0].second};
  int i = 1;
  while (i < int(alive_clan.size()) and alive_clan[i].first == alive_clan[0].first)
  {
    largest_clans.push_back(alive_clan[i].second);
    ++i;
  }

  int clan_that_loses_unit = largest_clans[random(0, largest_clans.size() - 1)];

  vector<int> smallest_clans = {alive_clan.back().second};
  i = int(alive_clan.size()) - 2;
  while (i >= 0 and alive_clan[i].first == alive_clan.back().first)
  {
    smallest_clans.push_back(alive_clan[i].second);
    --i;
  }

  int clan_that_wins_unit = smallest_clans[random(0, smallest_clans.size() - 1)];
  return {clan_that_wins_unit, clan_that_loses_unit};
}

void Board::execute_random_conversion_live_unit()
{
  if (random(0, 4) != 0)
    return; // 20% probability of conversion

  pair<int, int> tmp = selectLargestSmallestClan();
  int wins = tmp.first;
  int loses = tmp.second;

  _my_assert(wins != loses, "A clan cannot win and lose a unit");

  if (player2alive_units[loses].size() == 0)
    return; // No alive unit (very strange)

  // Choose randomly a unit from clan "loses"
  int k = random(0, player2alive_units[loses].size() - 1);
  auto it = player2alive_units[loses].begin();
  advance(it, k);
  int u_t = *it; // unit transferred

  player2alive_units[loses].erase(it);
  player2alive_units[wins].insert(u_t);
  Unit &u = units[u_t];
  _my_assert(u.type == Alive, "Transferred unit should be alive");
  u.player = wins;
  grid[u.pos.i][u.pos.j].owner = wins;
}

void Board::decrement_rounds_for_becoming_zombie()
{
  for (auto &p : units)
  {
    Unit &u = p.second;
    if (u.rounds_for_zombie > 0)
      --u.rounds_for_zombie;
  }
}

void Board::generate_food_item()
{
  Pos p = get_random_pos_where_regenerate();
  Cell &c = grid[p.i][p.j];
  c.food = true;
  _my_assert(c.id == -1 and c.type == Street, "Generated food in already full cell");
}

void Board::regenerate_food_and_update_strength(vector<int> &food_to_regenerate)
{
  for (int p = 0; p < num_players(); ++p)
  {
    overall_strength[p] += food_strength() * food_to_regenerate[p];
    overall_strength[p] -= player2alive_units[p].size(); // One unit of food is eaten by each alive unit
    overall_strength[p] = max(0, overall_strength[p]);   // Strength >= 0
    for (int k = 0; k < food_to_regenerate[p]; ++k)
      generate_food_item();
  }

  // Food items eaten by zombies
  for (int k = 0; k < food_to_regenerate.back(); ++k)
    generate_food_item();
}

void Board::update_nb_cells()
{
  // Set all to zero
  for (auto &x : nb_cells)
    x = 0;

  // Add the ones in the grid
  for (int i = 0; i < board_rows(); ++i)
    for (int j = 0; j < board_cols(); ++j)
      if (grid[i][j].owner != -1)
        ++nb_cells[grid[i][j].owner];
}

void Board::update_score()
{
  for (int p = 0; p < num_players(); ++p)
    scr[p] = scr_accumulated[p] + nb_cells[p] * 1;
}

bool Board::cell_has_dead_unit(int i, int j)
{
  if (grid[i][j].id == -1)
    return false;
  Unit &u = units[grid[i][j].id];
  return (u.type == Dead);
}

bool Board::cell_has_zombie(int i, int j)
{
  if (grid[i][j].id == -1)
    return false;
  Unit &u = units[grid[i][j].id];
  return (u.type == Zombie);
}

void Board::move_zombies(vector<int> &food_to_regenerate, vector<vector<int>> &zombie_to_unit, vector<vector<int>> &alive_to_dead, vector<Command> &commands_done)
{
  // First compute distances
  int r = board_rows();
  int c = board_cols();

  int inf = 1e9;
  vector<vector<int>> T(r, vector<int>(c, inf));
  queue<Pos> Q;
  for (int i = 0; i < r; ++i)
    for (int j = 0; j < c; ++j)
    {
      const Cell &c = grid[i][j];
      if (c.id != -1 and units[c.id].type == Alive)
      {
        Q.push(Pos(i, j));
        T[i][j] = 0;
      }
    }

  while (not Q.empty())
  {
    Pos p = Q.front();
    Q.pop();
    for (auto d : {Down, DR, Right, RU, Up, UL, Left, LD})
    {
      Pos np = p + d;
      if (pos_ok(np) and
          not cell_has_dead_unit(np.i, np.j) and
          not cell_has_zombie(np.i, np.j) and
          grid[np.i][np.j].type != Waste and
          T[np.i][np.j] == inf)
      {
        T[np.i][np.j] = T[p.i][p.j] + 1;
        Q.push(np);
      }
    }
  }

  for (int z_id : zombies_)
  {
    if (units[z_id].pos != Pos(-1, -1))
    { // Not dead
      const Unit &u = units[z_id];
      Pos p1 = u.pos;
      vector<int> C;
      int minim = 1e8;
      for (int d = 0; d < 8; ++d)
      {
        Pos p2 = p1 + Dir(d);
        if (pos_ok(p2))
        {
          int dist = T[p2.i][p2.j];
          if (dist < minim)
          {
            minim = dist;
            C = {d};
          }
          else if (dist == minim)
            C.push_back(d);
        }
      }

      if (not C.empty())
      {
        Dir dir = Dir(C[random(0, C.size() - 1)]);
        Command com(z_id, Move, dir);
        if (execute(com, food_to_regenerate, zombie_to_unit, alive_to_dead))
        {
          commands_done.push_back(com);
        }
      }
    }
  }
}

vector<Dir> Board::dir_permutation()
{
  vector<Dir> dirs = {Up, Down, Left, Right};
  vector<int> p = random_permutation(4);
  vector<Dir> new_dirs(4);
  for (int i = 0; i < 4; ++i)
    new_dirs[i] = dirs[p[i]];
  return new_dirs;
}

//************************************************************
//                     BOARD GENERATION
//************************************************************

int Board::generate_waste(int s_id, int length)
{
  int filled = 0;
  vector<Dir> dirs = {Up, Down, Left, Right};
  Dir last_dir = dirs[random(0, dirs.size() - 1)];
  Pos p = get_ok_pos_for_initial_street();
  street_plan[p.i][p.j] = s_id;
  ++filled;
  while (length > 0)
  {
    shuffle_vector(dirs);
    // dirs = dir_permutation();
    Dir new_possible_dir = Up; // Explore the possibility of turning
    bool dir_found = false;
    for (auto &d : dirs)
    {
      if (pos_ok_for_street(s_id, p + d))
      {
        new_possible_dir = d;
        dir_found = true;
        break;
      }
    }

    if (random(1, 8) != 1 and pos_ok_for_street(s_id, p + last_dir))
    { // Continue same direction
      p += last_dir;
      street_plan[p.i][p.j] = s_id;
      --length;
      ++filled;
    }
    else if (dir_found)
    { // Turn
      last_dir = new_possible_dir;
      _my_assert(cell(p + new_possible_dir).is_empty(), "Cell no empty");
      p += new_possible_dir;
      _my_assert(pos_ok_for_street(s_id, p), "Pos not ok for street.");
      street_plan[p.i][p.j] = s_id;
      --length;
      ++filled;
    }
    else // Stop
      return filled;
  }
  return filled;
}

void Board::generate_all_waste(int num_waste_cells, int num_streets)
{
  street_plan = vector<vector<int>>(board_rows(), vector<int>(board_cols(), 0));

  int num_streets_pending = num_streets;
  while (num_streets_pending > 0)
  {
    int length;
    if (num_streets_pending != 1)
      length = num_waste_cells / num_streets_pending;
    else
      length = num_waste_cells;
    num_waste_cells -= generate_waste(num_streets_pending, length);
    --num_streets_pending;
  }

  for (int i = 0; i < board_rows(); ++i)
  {
    for (int j = 0; j < board_cols(); ++j)
    {
      if (street_plan[i][j] != 0)
      {
        grid[i][j].type = Waste;
      }
    }
  }
}

Pos Board::get_empty_pos()
{
  while (true)
  {
    int i = random(0, board_rows() - 1);
    int j = random(0, board_cols() - 1);
    if (cell(i, j).is_empty())
      return Pos(i, j);
  }
}

Pos Board::get_ok_pos_for_street(int s_id)
{
  while (true)
  {
    int i = random(1, board_rows() - 2);
    int j = random(1, board_cols() - 2);
    if (pos_ok_for_street(s_id, Pos(i, j)))
      return Pos(i, j);
  }
}

Pos Board::get_ok_pos_for_initial_street()
{
  while (true)
  {
    int i = random(1, board_rows() - 2);
    int j = random(1, board_cols() - 2);
    if (pos_ok_for_initial_street(Pos(i, j)))
      return Pos(i, j);
  }
}

bool Board::pos_ok_for_street(int s_id, const Pos &p)
{
  int i = p.i, j = p.j;
  if (not pos_ok(p))
    return false;
  if (street_plan[i][j] != 0)
    return false;
  if (i == 0)
    return false;
  if (i == board_rows() - 1)
    return false;
  if (j == 0)
    return false;
  if (j == board_cols() - 1)
    return false;

  int num_occupied = 0;
  vector<Dir> dirs = {Up, Down, Left, Right};
  for (auto &d : dirs)
  {
    Pos newPos = p + d; // Will exists because p is not on a border
    int ni = newPos.i, nj = newPos.j;
    if (street_plan[ni][nj] != 0 and street_plan[ni][nj] != s_id)
      return false;
    else if (street_plan[ni][nj] == s_id)
      ++num_occupied;
  }

  vector<pair<int, int>> diags = {{1, 1}, {1, -1}, {-1, 1}, {-1, -1}};
  for (auto &d : diags)
  {
    Pos newPos = Pos(p.i + d.first, p.j + d.second);
    int ni = newPos.i, nj = newPos.j;
    if (street_plan[ni][nj] != 0 and street_plan[ni][nj] != s_id)
      return false;
    else if (street_plan[ni][nj] == s_id)
      ++num_occupied;
  }

  return num_occupied <= 2;
}

bool Board::pos_ok_for_initial_street(const Pos &p)
{
  int i = p.i, j = p.j;
  if (not pos_ok(p))
    return false;
  if (street_plan[i][j] != 0)
    return false;
  if (i == 0)
    return false;
  if (i == board_rows() - 1)
    return false;
  if (j == 0)
    return false;
  if (j == board_cols() - 1)
    return false;

  int num_occupied = 0;
  vector<Dir> dirs = {Up, Down, Left, Right};
  for (auto &d : dirs)
  {
    Pos newPos = p + d; // Will exists because p is not on a border
    int n_i = newPos.i, n_j = newPos.j;
    if (street_plan[n_i][n_j] != 0)
      return false;
  }

  vector<pair<int, int>> diags = {{1, 1}, {1, -1}, {-1, 1}, {-1, -1}};
  for (auto &d : diags)
  {
    Pos newPos = Pos(p.i + d.first, p.j + d.second);
    int n_i = newPos.i, n_j = newPos.j;
    if (street_plan[n_i][n_j] != 0)
      return false;
  }

  return true;
}

void Board::explore_from(vector<vector<int>> &G, int i, int j, int n)
{
  G[i][j] = n;
  for (auto &d : {Up, Down, Left, Right})
  {
    Pos np = Pos(i, j) + d;
    if (pos_ok(np) and G[np.i][np.j] == -1)
      explore_from(G, np.i, np.j, n);
  }
}

int Board::num_connected_components()
{
  vector<vector<int>> G(board_rows(), vector<int>(board_cols(), -1));

  for (int i = 0; i < board_rows(); ++i)
    for (int j = 0; j < board_cols(); ++j)
      if (grid[i][j].type == Waste)
        G[i][j] = -2;

  int n = 0;
  for (int i = 0; i < board_rows(); ++i)
  {
    for (int j = 0; j < board_cols(); ++j)
    {
      if (G[i][j] == -1)
      {
        explore_from(G, i, j, n);
        ++n;
      }
    }
  }

  return n;
}

void Board::create_new_unit(Pos &p, int player)
{
  int id = fresh_id;
  ++fresh_id;
  _my_assert(not units.count(id), "Identifier is not fresh.");

  units[id] = Unit(Alive, id, player, p, -1);
  player2alive_units[player].insert(id);

  _my_assert(grid[p.i][p.j].is_empty(), "Cell is already full.");

  grid[p.i][p.j].id = id;
  grid[p.i][p.j].owner = player;
}

void Board::create_new_zombie(Pos &p)
{
  int id = fresh_id;
  ++fresh_id;
  _my_assert(not units.count(id), "Identifier is not fresh.");
  _my_assert(grid[p.i][p.j].is_empty(), "Cell is already full.");

  units[id] = Unit(Zombie, id, -1, p, -1);
  zombies_.insert(id);

  grid[p.i][p.j].id = id;
}

void Board::generate_random_board()
{
  int rows = board_rows();
  int cols = board_cols();

  // Generate buildings (leaving space for citizens)
  static const int num_waste_cells = 0.5 * rows * cols; // goal of 50% waste
  static const int num_streets = 8;

  do
  {
    // Create grid
    grid = vector<vector<Cell>>(rows, vector<Cell>(cols));
    generate_all_waste(num_waste_cells, num_streets);
  } while (num_connected_components() != 1);

  for (int i = 0; i < board_rows(); ++i)
    for (int j = 0; j < board_cols(); ++j)
      if (street_plan[i][j] != 0)
        grid[i][j].type = Waste;

  // Generate units
  for (int pl = 0; pl < num_players(); ++pl)
  {
    for (int i = 0; i < num_ini_units_per_clan(); ++i)
    {
      Pos p = get_random_pos_where_regenerate();
      create_new_unit(p, pl);
      ++nb_cells[pl];
    }
  }

  // Generate zombies
  for (int i = 0; i < num_ini_zombies(); ++i)
  {
    Pos p = get_random_pos_where_regenerate();
    create_new_zombie(p);
  }

  // Generate food
  for (int i = 0; i < num_ini_food(); ++i)
  {
    Pos p = get_random_pos_where_regenerate();
    grid[p.i][p.j].food = true;
  }
}
