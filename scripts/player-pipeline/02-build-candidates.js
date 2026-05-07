// ============================================================
// 02-build-candidates.js
// Reads raw nflverse CSVs → filters to game-worthy players →
// assigns difficulty tier → outputs candidates.json.
//
// Filter logic (inclusive OR):
//   • Pro Bowl appearance (any)
//   • All-Pro selection (any)
//   • Hall of Fame
//   • Round 1 pick with 20+ career games
//   • Round 2-3 pick with 40+ career games and 15+ career AV
//   • Currently on an active roster (via players.csv status=ACT)
//
// Tier logic:
//   T1 (STARS):     3+ Pro Bowls OR 1+ All-Pro OR HOF
//   T2 (STARTERS):  1-2 Pro Bowls OR (R1-R2 + 50+ games) OR (active + 2+ starting seasons)
//   T3 (ROLE):      everything else that qualified
// ============================================================

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { normalizeCollege } = require('./lib/colleges');
const { lookupTeam } = require('./lib/teams');

const DATA_DIR = path.join(__dirname, 'data');
const MIN_YEAR = parseInt(process.env.MIN_YEAR || '1980', 10);
const MIN_CAREER_GAMES = parseInt(process.env.MIN_CAREER_GAMES || '20', 10);

function readCsv(name) {
  const full = path.join(DATA_DIR, name);
  if (!fs.existsSync(full)) throw new Error(`Missing ${name} — run 01-fetch-nflverse.js first`);
  const raw = fs.readFileSync(full, 'utf8');
  return parse(raw, { columns: true, skip_empty_lines: true, relax_quotes: true, relax_column_count: true });
}

function findRosterFile() {
  const files = fs.readdirSync(DATA_DIR).filter(f => /^roster_\d{4}\.csv$/.test(f));
  if (!files.length) throw new Error('No roster_YYYY.csv in /data');
  files.sort().reverse();
  return files[0];
}

function num(v) { const n = Number(v); return Number.isFinite(n) ? n : 0; }

// ── Tier classification ────────────────────────────────────
function assignTier(pick) {
  const pb = num(pick.probowls);
  const ap = num(pick.allpro);
  const games = num(pick.games);
  const round = num(pick.round);
  const hof = String(pick.hof || '').trim() === '1' || String(pick.hof || '').toLowerCase() === 'true';
  const startedSeasons = num(pick.seasons_started);

  if (hof || ap >= 1 || pb >= 3) return 'T1';
  if (pb >= 1 || (round <= 2 && games >= 50) || startedSeasons >= 4) return 'T2';
  return 'T3';
}

// ── Game-worthy filter ─────────────────────────────────────
function isGameWorthy(pick) {
  const pb = num(pick.probowls);
  const ap = num(pick.allpro);
  const hof = String(pick.hof || '').trim() === '1';
  const games = num(pick.games);
  const round = num(pick.round);
  const av = num(pick.car_av || pick.career_av || pick.w_av);

  if (hof || pb >= 1 || ap >= 1) return true;
  if (round === 1 && games >= MIN_CAREER_GAMES) return true;
  if (round >= 2 && round <= 3 && games >= 40 && av >= 15) return true;
  return false;
}

// ── Position whitelist ─────────────────────────────────────
// Games focus on offensive skill + headline defense + K. Skip O-line, LS, P by default.
const INCLUDED_POSITIONS = new Set([
  'QB', 'RB', 'FB', 'WR', 'TE',
  'DE', 'DT', 'EDGE', 'NT', 'LB', 'ILB', 'OLB', 'MLB',
  'CB', 'S', 'SS', 'FS', 'DB',
  'K',
]);

function normalizePosition(p) {
  if (!p) return null;
  const up = p.trim().toUpperCase();
  // Map common variants
  const map = { 'HB': 'RB', 'SE': 'WR', 'FL': 'WR', 'TB': 'RB', 'DEF': null };
  return map[up] !== undefined ? map[up] : up;
}

// ── MAIN ────────────────────────────────────────────────────
(function main() {
  console.log('🔨 Building player candidates from nflverse data\n');

  const drafts = readCsv('draft_picks.csv');
  const players = readCsv('players.csv');
  const rosterFile = findRosterFile();
  const roster = readCsv(rosterFile);
  console.log(`  draft_picks.csv : ${drafts.length.toLocaleString()} rows`);
  console.log(`  players.csv     : ${players.length.toLocaleString()} rows`);
  console.log(`  ${rosterFile.padEnd(16)}: ${roster.length.toLocaleString()} rows\n`);

  // Index active roster by pfr_id / gsis_id / full_name for cross-referencing
  const activeByPfr = new Map();
  const activeByGsis = new Map();
  const activeByName = new Map();
  for (const r of roster) {
    const status = String(r.status || '').toUpperCase();
    if (!['ACT', 'ACTIVE', 'A01'].some(s => status.includes(s))) continue;
    if (r.pfr_id) activeByPfr.set(r.pfr_id, r);
    if (r.gsis_id) activeByGsis.set(r.gsis_id, r);
    if (r.full_name) activeByName.set(r.full_name.toLowerCase(), r);
  }

  // Index players.csv for bio enrichment (current team, jersey, status)
  const playersByPfr = new Map();
  const playersByGsis = new Map();
  for (const p of players) {
    if (p.pfr_id) playersByPfr.set(p.pfr_id, p);
    if (p.gsis_id) playersByGsis.set(p.gsis_id, p);
  }

  // Build candidates
  const candidates = new Map(); // key: "name|college|position"
  let filteredByYear = 0, filteredByPos = 0, filteredByWorthy = 0, filteredNoCollege = 0;

  for (const d of drafts) {
    const season = num(d.season);
    if (season < MIN_YEAR) { filteredByYear++; continue; }

    const pos = normalizePosition(d.position);
    if (!pos || !INCLUDED_POSITIONS.has(pos)) { filteredByPos++; continue; }

    if (!isGameWorthy(d)) { filteredByWorthy++; continue; }

    const college = normalizeCollege(d.college);
    if (!college) { filteredNoCollege++; continue; }

    const name = (d.pfr_player_name || '').trim();
    if (!name) continue;

    // Cross-reference players.csv for current team/jersey/status
    const bio = (d.pfr_id && playersByPfr.get(d.pfr_id)) || null;
    const activeRow = (d.pfr_id && activeByPfr.get(d.pfr_id))
      || (d.pfr_id && activeByPfr.get(d.pfr_id))
      || activeByName.get(name.toLowerCase())
      || null;

    const isActive = !!activeRow;
    const teamAbbr = activeRow?.team || bio?.team_abbr || bio?.latest_team || null;
    const teamInfo = lookupTeam(teamAbbr);
    const jersey = activeRow?.jersey_number || bio?.jersey_number || null;

    const key = `${name}|${college}|${pos}`;
    // Dedupe: prefer the row with the better career stats
    if (candidates.has(key)) {
      const existing = candidates.get(key);
      if (num(d.games) <= num(existing._games)) continue;
    }

    candidates.set(key, {
      name,
      college,
      position: pos,
      nfl_team: teamInfo?.name || (isActive ? teamAbbr : null),
      nfl_conference: teamInfo?.conference || null,
      nfl_division: teamInfo?.division || null,
      jersey_number: isActive && jersey ? Number(jersey) || null : null,
      active: isActive,
      draft_year: season || null,
      draft_round: num(d.round) || null,
      draft_pick: num(d.pick) || null,
      difficulty_tier: assignTier(d),
      pfr_id: d.pfr_id || null,
      gsis_id: bio?.gsis_id || activeRow?.gsis_id || null,
      seed_source: 'nflverse-draft_picks',
      // internal, stripped before write
      _games: num(d.games),
      _pb: num(d.probowls),
      _ap: num(d.allpro),
    });
  }

  // Also seed active-roster-only players who weren't drafted (UDFA stars)
  let udfaCount = 0;
  for (const r of roster) {
    const status = String(r.status || '').toUpperCase();
    if (!['ACT', 'ACTIVE'].some(s => status.includes(s))) continue;

    const pos = normalizePosition(r.position);
    if (!pos || !INCLUDED_POSITIONS.has(pos)) continue;

    const college = normalizeCollege(r.college);
    if (!college) continue;

    const name = (r.full_name || '').trim();
    if (!name) continue;

    const key = `${name}|${college}|${pos}`;
    if (candidates.has(key)) continue; // already covered by draft pipeline

    const teamInfo = lookupTeam(r.team);
    candidates.set(key, {
      name,
      college,
      position: pos,
      nfl_team: teamInfo?.name || r.team || null,
      nfl_conference: teamInfo?.conference || null,
      nfl_division: teamInfo?.division || null,
      jersey_number: r.jersey_number ? Number(r.jersey_number) || null : null,
      active: true,
      draft_year: null,
      draft_round: null,
      draft_pick: null,
      difficulty_tier: 'T3', // UDFAs default to T3; admin can promote
      pfr_id: r.pfr_id || null,
      gsis_id: r.gsis_id || null,
      seed_source: 'nflverse-roster-udfa',
      _games: 0, _pb: 0, _ap: 0,
    });
    udfaCount++;
  }

  // Strip internal fields before write
  const out = Array.from(candidates.values()).map(c => {
    const { _games, _pb, _ap, ...clean } = c;
    return clean;
  });

  // Tier breakdown
  const tiers = { T1: 0, T2: 0, T3: 0 };
  for (const c of out) tiers[c.difficulty_tier]++;

  const outPath = path.join(DATA_DIR, 'candidates.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));

  console.log('📊 Filter results:');
  console.log(`  filtered (pre-${MIN_YEAR})       : ${filteredByYear.toLocaleString()}`);
  console.log(`  filtered (position)          : ${filteredByPos.toLocaleString()}`);
  console.log(`  filtered (not game-worthy)   : ${filteredByWorthy.toLocaleString()}`);
  console.log(`  filtered (no college)        : ${filteredNoCollege.toLocaleString()}`);
  console.log(`  + active UDFAs added         : ${udfaCount.toLocaleString()}`);
  console.log('');
  console.log('📈 Candidates:');
  console.log(`  Total            : ${out.length.toLocaleString()}`);
  console.log(`  T1 (STARS)       : ${tiers.T1.toLocaleString()}`);
  console.log(`  T2 (STARTERS)    : ${tiers.T2.toLocaleString()}`);
  console.log(`  T3 (ROLE)        : ${tiers.T3.toLocaleString()}`);
  console.log(`  Currently active : ${out.filter(c => c.active).length.toLocaleString()}`);
  console.log('');
  console.log(`✅ Wrote ${outPath}`);
  console.log('   Next: node 03-upsert-supabase.js');
})();
