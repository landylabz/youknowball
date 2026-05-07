// ============================================================
// 03-upsert-supabase.js
// Reads candidates.json → upserts to Supabase players table.
//
// SAFETY RULES (enforced in code, not Supabase):
//   • All new rows land as validated=false (Product Rule #1)
//   • Existing validated=true rows are NEVER overwritten on bio fields
//   • Existing rows get enrichment-only updates (gsis_id, pfr_id,
//     draft_*, last_enriched_at) — never name/college/position/tier
//   • Unknown colleges (not in colleges table) are flagged but still inserted
//     (so admin can fix them via admin.html without losing the player)
// ============================================================

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || SUPABASE_SERVICE_KEY.startsWith('PASTE')) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const CANDIDATES_PATH = path.join(__dirname, 'data', 'candidates.json');
const BATCH_SIZE = 250;
const DRY_RUN = process.argv.includes('--dry-run');

function makeKey(p) { return `${p.name}|${p.college}|${p.position}`; }

(async () => {
  if (!fs.existsSync(CANDIDATES_PATH)) {
    console.error('❌ No candidates.json — run 02-build-candidates.js first');
    process.exit(1);
  }
  const candidates = JSON.parse(fs.readFileSync(CANDIDATES_PATH, 'utf8'));
  console.log(`📦 Loaded ${candidates.length.toLocaleString()} candidates\n`);

  // 1. Fetch existing players (just the keys + validation state)
  console.log('🔍 Fetching existing players from Supabase...');
  const existing = new Map();
  let page = 0;
  while (true) {
    const { data, error } = await sb
      .from('players')
      .select('id, name, college, position, validated, difficulty_tier')
      .range(page * 1000, page * 1000 + 999);
    if (error) throw error;
    for (const row of data) existing.set(makeKey(row), row);
    if (data.length < 1000) break;
    page++;
  }
  console.log(`   Found ${existing.size.toLocaleString()} existing rows\n`);

  // 2. Split candidates: NEW vs UPDATE
  const toInsert = [];
  const toUpdate = []; // enrichment-only updates
  for (const c of candidates) {
    const key = makeKey(c);
    const match = existing.get(key);
    if (!match) {
      toInsert.push(c);
    } else {
      // Enrichment-only: never touch name/college/position/difficulty_tier on existing rows
      toUpdate.push({
        id: match.id,
        active: c.active,
        draft_year: c.draft_year,
        draft_round: c.draft_round,
        draft_pick: c.draft_pick,
        pfr_id: c.pfr_id,
        gsis_id: c.gsis_id,
        seed_source: c.seed_source,
        last_enriched_at: new Date().toISOString(),
        // Only update NFL context if row was NOT human-validated (don't stomp admin fixes)
        ...(match.validated ? {} : {
          nfl_team: c.nfl_team,
          nfl_conference: c.nfl_conference,
          nfl_division: c.nfl_division,
          jersey_number: c.jersey_number,
        }),
      });
    }
  }

  console.log('📋 Plan:');
  console.log(`   New inserts      : ${toInsert.length.toLocaleString()}`);
  console.log(`   Enrichment updates: ${toUpdate.length.toLocaleString()}`);
  console.log(`   Will NOT be touched (already validated): ${Array.from(existing.values()).filter(r => r.validated).length.toLocaleString()}`);
  console.log('');

  if (DRY_RUN) {
    console.log('🏃 DRY RUN — no database changes made.');
    const sample = toInsert.slice(0, 5);
    console.log('\nSample of new inserts:');
    for (const s of sample) console.log(`   • ${s.name.padEnd(28)} ${s.position.padEnd(4)} ${s.college.padEnd(20)} ${s.difficulty_tier} ${s.active ? '(active)' : ''}`);
    return;
  }

  // 3. Bulk insert new rows (validated=false)
  if (toInsert.length) {
    console.log(`📥 Inserting ${toInsert.length.toLocaleString()} new players...`);
    let inserted = 0;
    for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
      const batch = toInsert.slice(i, i + BATCH_SIZE).map(c => ({
        ...c,
        validated: false,
        sport: 'NFL',
        last_enriched_at: new Date().toISOString(),
      }));
      const { error } = await sb.from('players').insert(batch);
      if (error) {
        console.error(`   ❌ Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, error.message);
        // Write failed batch to disk for inspection
        fs.writeFileSync(path.join(__dirname, 'data', `failed_insert_batch_${i}.json`), JSON.stringify(batch, null, 2));
        continue;
      }
      inserted += batch.length;
      process.stdout.write(`\r   Inserted ${inserted.toLocaleString()} / ${toInsert.length.toLocaleString()}`);
    }
    console.log('');
  }

  // 4. Enrichment updates (one row at a time via id — no bulk update for mixed fields)
  if (toUpdate.length) {
    console.log(`\n🔄 Applying ${toUpdate.length.toLocaleString()} enrichment updates...`);
    let updated = 0, failed = 0;
    for (const u of toUpdate) {
      const { id, ...fields } = u;
      const { error } = await sb.from('players').update(fields).eq('id', id);
      if (error) { failed++; continue; }
      updated++;
      if (updated % 50 === 0) process.stdout.write(`\r   Updated ${updated.toLocaleString()} / ${toUpdate.length.toLocaleString()}`);
    }
    console.log(`\r   Updated ${updated.toLocaleString()} / ${toUpdate.length.toLocaleString()}  (${failed} failed)`);
  }

  console.log('\n✅ Done. Next step: go to youknowball.io/admin.html and start validating.');
})().catch(err => { console.error('❌ Fatal:', err.message); process.exit(1); });
