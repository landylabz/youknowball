// ============================================================
// 01-fetch-nflverse.js
// Downloads raw CSVs from nflverse releases (MIT licensed, no ToS risk).
// Caches to ./data/ so reruns are fast.
// ============================================================

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const CURRENT_SEASON = new Date().getFullYear();

const FILES = [
  {
    name: 'draft_picks.csv',
    url: 'https://github.com/nflverse/nflverse-data/releases/download/draft_picks/draft_picks.csv',
    desc: 'Every NFL draft pick 1936-present with career stats + Pro Bowl/All-Pro counts',
  },
  {
    name: 'players.csv',
    url: 'https://github.com/nflverse/nflverse-data/releases/download/players/players.csv',
    desc: 'Current player bio + team + jersey + status',
  },
  {
    name: `roster_${CURRENT_SEASON}.csv`,
    url: `https://github.com/nflverse/nflverse-data/releases/download/rosters/roster_${CURRENT_SEASON}.csv`,
    desc: `${CURRENT_SEASON} season roster snapshot`,
  },
];

async function download(url, dest) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  return buf.length;
}

(async () => {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log(`📥 Fetching nflverse data → ${DATA_DIR}\n`);

  for (const f of FILES) {
    const dest = path.join(DATA_DIR, f.name);
    process.stdout.write(`  ${f.name.padEnd(28)} ... `);
    try {
      const bytes = await download(f.url, dest);
      console.log(`✓ ${(bytes / 1024).toFixed(0)} KB`);
    } catch (err) {
      // Current-season roster may not exist yet (e.g. preseason before draft)
      if (f.name.startsWith('roster_')) {
        const fallbackYear = CURRENT_SEASON - 1;
        const fallbackUrl = f.url.replace(String(CURRENT_SEASON), String(fallbackYear));
        const fallbackName = `roster_${fallbackYear}.csv`;
        console.log(`⚠  ${err.message}`);
        process.stdout.write(`  ${fallbackName.padEnd(28)} (fallback) ... `);
        const bytes = await download(fallbackUrl, path.join(DATA_DIR, fallbackName));
        console.log(`✓ ${(bytes / 1024).toFixed(0)} KB`);
      } else {
        throw err;
      }
    }
  }
  console.log('\n✅ Fetch complete. Next: node 02-build-candidates.js');
})().catch(err => { console.error('❌', err.message); process.exit(1); });
