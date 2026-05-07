// ============================================================
// weekly-roster-refresh.js
// Runs weekly (GitHub Actions cron).
// Updates ONLY: active status, nfl_team, nfl_conference, nfl_division,
// jersey_number — for players already in the DB.
//
// Never inserts new rows. Never touches validated=true rows' bio.
// ============================================================

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { createClient } = require('@supabase/supabase-js');
const { lookupTeam } = require('./lib/teams');

const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const CURRENT_SEASON = new Date().getFullYear();
const ROSTER_URL = `https://github.com/nflverse/nflverse-data/releases/download/rosters/roster_${CURRENT_SEASON}.csv`;
const PLAYERS_URL = 'https://github.com/nflverse/nflverse-data/releases/download/players/players.csv';

async function fetchCsv(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  const text = await res.text();
  return parse(text, { columns: true, skip_empty_lines: true, relax_quotes: true, relax_column_count: true });
}

(async () => {
  const startedAt = new Date();
  console.log(`🔄 Weekly roster refresh · ${startedAt.toISOString()}\n`);

  let roster;
  try {
    roster = await fetchCsv(ROSTER_URL);
  } catch (err) {
    console.log(`⚠  ${CURRENT_SEASON} roster not available — falling back to players.csv`);
    roster = await fetchCsv(PLAYERS_URL);
  }
  console.log(`   Loaded ${roster.length.toLocaleString()} roster rows\n`);

  // Build lookup by pfr_id + gsis_id + full_name
  const byPfr = new Map(), byGsis = new Map(), byName = new Map();
  for (const r of roster) {
    if (r.pfr_id) byPfr.set(r.pfr_id, r);
    if (r.gsis_id) byGsis.set(r.gsis_id, r);
    const nm = (r.full_name || r.player_name || '').trim().toLowerCase();
    if (nm) byName.set(nm, r);
  }

  // Fetch all players from DB (only fields we need)
  const existing = [];
  let page = 0;
  while (true) {
    const { data, error } = await sb
      .from('players')
      .select('id, name, college, position, active, nfl_team, jersey_number, pfr_id, gsis_id, validated')
      .range(page * 1000, page * 1000 + 999);
    if (error) throw error;
    existing.push(...data);
    if (data.length < 1000) break;
    page++;
  }
  console.log(`   ${existing.length.toLocaleString()} players in DB\n`);

  let updated = 0, unchanged = 0, departed = 0, failed = 0;
  for (const p of existing) {
    const r = (p.pfr_id && byPfr.get(p.pfr_id))
      || (p.gsis_id && byGsis.get(p.gsis_id))
      || byName.get(p.name.toLowerCase());

    const status = String(r?.status || '').toUpperCase();
    const isActive = !!r && (status.includes('ACT') || status === 'A01');
    const teamAbbr = r?.team || r?.team_abbr || r?.latest_team || null;
    const teamInfo = lookupTeam(teamAbbr);

    const nextFields = {
      active: isActive,
      last_enriched_at: new Date().toISOString(),
    };
    // Only update NFL team/jersey/division if not human-validated
    if (!p.validated) {
      nextFields.nfl_team = teamInfo?.name || (isActive ? teamAbbr : null);
      nextFields.nfl_conference = teamInfo?.conference || null;
      nextFields.nfl_division = teamInfo?.division || null;
      nextFields.jersey_number = (isActive && r?.jersey_number) ? (Number(r.jersey_number) || null) : null;
    }

    // Backfill pfr_id / gsis_id if we matched via name
    if (r?.pfr_id && !p.pfr_id) nextFields.pfr_id = r.pfr_id;
    if (r?.gsis_id && !p.gsis_id) nextFields.gsis_id = r.gsis_id;

    // Skip no-op updates
    if (nextFields.active === p.active && !nextFields.pfr_id && !nextFields.gsis_id) {
      unchanged++; continue;
    }

    const { error } = await sb.from('players').update(nextFields).eq('id', p.id);
    if (error) { failed++; continue; }
    if (p.active && !isActive) departed++;
    updated++;
  }

  const elapsed = ((Date.now() - startedAt.getTime()) / 1000).toFixed(1);
  console.log(`✅ Roster refresh complete in ${elapsed}s`);
  console.log(`   Updated         : ${updated.toLocaleString()}`);
  console.log(`   Unchanged       : ${unchanged.toLocaleString()}`);
  console.log(`   Flagged inactive: ${departed.toLocaleString()}`);
  console.log(`   Failed          : ${failed.toLocaleString()}`);
})().catch(err => { console.error('❌', err.message); process.exit(1); });
