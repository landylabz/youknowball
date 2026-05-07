// NFL team abbreviation -> { fullName, conference, division }
// Abbreviations match nflverse's canonical codes (LAR, LAC, LV, JAX, etc.)

const TEAMS = {
  // AFC East
  BUF: { name: 'Buffalo Bills', conference: 'AFC', division: 'East' },
  MIA: { name: 'Miami Dolphins', conference: 'AFC', division: 'East' },
  NE:  { name: 'New England Patriots', conference: 'AFC', division: 'East' },
  NYJ: { name: 'New York Jets', conference: 'AFC', division: 'East' },

  // AFC North
  BAL: { name: 'Baltimore Ravens', conference: 'AFC', division: 'North' },
  CIN: { name: 'Cincinnati Bengals', conference: 'AFC', division: 'North' },
  CLE: { name: 'Cleveland Browns', conference: 'AFC', division: 'North' },
  PIT: { name: 'Pittsburgh Steelers', conference: 'AFC', division: 'North' },

  // AFC South
  HOU: { name: 'Houston Texans', conference: 'AFC', division: 'South' },
  IND: { name: 'Indianapolis Colts', conference: 'AFC', division: 'South' },
  JAX: { name: 'Jacksonville Jaguars', conference: 'AFC', division: 'South' },
  JAC: { name: 'Jacksonville Jaguars', conference: 'AFC', division: 'South' },
  TEN: { name: 'Tennessee Titans', conference: 'AFC', division: 'South' },

  // AFC West
  DEN: { name: 'Denver Broncos', conference: 'AFC', division: 'West' },
  KC:  { name: 'Kansas City Chiefs', conference: 'AFC', division: 'West' },
  LV:  { name: 'Las Vegas Raiders', conference: 'AFC', division: 'West' },
  LVR: { name: 'Las Vegas Raiders', conference: 'AFC', division: 'West' },
  OAK: { name: 'Las Vegas Raiders', conference: 'AFC', division: 'West' }, // legacy
  LAC: { name: 'Los Angeles Chargers', conference: 'AFC', division: 'West' },
  SD:  { name: 'Los Angeles Chargers', conference: 'AFC', division: 'West' }, // legacy

  // NFC East
  DAL: { name: 'Dallas Cowboys', conference: 'NFC', division: 'East' },
  NYG: { name: 'New York Giants', conference: 'NFC', division: 'East' },
  PHI: { name: 'Philadelphia Eagles', conference: 'NFC', division: 'East' },
  WAS: { name: 'Washington Commanders', conference: 'NFC', division: 'East' },

  // NFC North
  CHI: { name: 'Chicago Bears', conference: 'NFC', division: 'North' },
  DET: { name: 'Detroit Lions', conference: 'NFC', division: 'North' },
  GB:  { name: 'Green Bay Packers', conference: 'NFC', division: 'North' },
  MIN: { name: 'Minnesota Vikings', conference: 'NFC', division: 'North' },

  // NFC South
  ATL: { name: 'Atlanta Falcons', conference: 'NFC', division: 'South' },
  CAR: { name: 'Carolina Panthers', conference: 'NFC', division: 'South' },
  NO:  { name: 'New Orleans Saints', conference: 'NFC', division: 'South' },
  TB:  { name: 'Tampa Bay Buccaneers', conference: 'NFC', division: 'South' },

  // NFC West
  ARI: { name: 'Arizona Cardinals', conference: 'NFC', division: 'West' },
  LA:  { name: 'Los Angeles Rams', conference: 'NFC', division: 'West' },
  LAR: { name: 'Los Angeles Rams', conference: 'NFC', division: 'West' },
  STL: { name: 'Los Angeles Rams', conference: 'NFC', division: 'West' }, // legacy
  SF:  { name: 'San Francisco 49ers', conference: 'NFC', division: 'West' },
  SEA: { name: 'Seattle Seahawks', conference: 'NFC', division: 'West' },
};

function lookupTeam(abbr) {
  if (!abbr) return null;
  return TEAMS[abbr.trim().toUpperCase()] || null;
}

module.exports = { TEAMS, lookupTeam };
