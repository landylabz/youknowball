# YouKnowBall Player Pipeline

Seeds the `players` table from nflverse (MIT-licensed open NFL data) and keeps active-player info fresh via a weekly GitHub Actions cron.

---

## Tomorrow-morning runbook (one-time seed)

**1. Get your Supabase service role key**

Supabase dashboard → Project Settings → API → copy the `service_role` key (the secret one, NOT `anon`).

**2. Install + configure**

```powershell
cd C:\Users\Landon\Downloads\youknowball-v2-fix\youknowball-deploy\scripts\player-pipeline
npm install
Copy-Item .env.example .env
notepad .env
# Paste your service_role key into SUPABASE_SERVICE_KEY, save, close
```

**3. Run the full seed**

```powershell
npm run seed
```

That chains all 3 phases:
- `01-fetch-nflverse.js` — downloads 3 CSVs to `./data/` (~5MB total)
- `02-build-candidates.js` — filters, tiers, dedupes → writes `data/candidates.json`
- `03-upsert-supabase.js` — inserts new players as `validated=false`, enriches existing rows

**Want to preview before committing?**

```powershell
npm run fetch     # download CSVs
npm run build     # see the tier breakdown + candidate count
node 03-upsert-supabase.js --dry-run   # inspect what would be written
```

**4. Validate in admin.html**

Go to `youknowball.io/admin.html`, click **Needs Validation**. The seed does not touch any existing `validated=true` player — only enriches them with `draft_year`, `pfr_id`, etc.

---

## Weekly refresh (GitHub Actions)

**One-time setup:**

1. In the GitHub repo → Settings → Secrets and variables → Actions → New repository secret:
   - `SUPABASE_URL` = `https://qoxgmscwbtdcvztksjtx.supabase.co`
   - `SUPABASE_SERVICE_KEY` = (same service role key as `.env`)

2. Push this folder to the repo (see commands below). The workflow runs every Tuesday at 6am ET automatically. You can also trigger it manually from the GitHub Actions tab.

---

## Safety guarantees (built into the code)

1. **No new row is ever `validated=true`** — product rule #1 enforced in `03-upsert-supabase.js` line ~105.
2. **Games only pull validated players** (existing app logic). New seeds are invisible to live games until you validate them.
3. **Human-validated rows are never overwritten** on bio fields (name, college, position, tier). Only enrichment fields (`draft_year`, `pfr_id`, `gsis_id`, `last_enriched_at`) get updated.
4. **Weekly refresh never inserts rows** — only updates `active`, `nfl_team`, `jersey_number` for existing rows.
5. **Failed batches are written to `data/failed_insert_batch_*.json`** for debugging rather than lost.

---

## Data source

- [nflverse/nflverse-data](https://github.com/nflverse/nflverse-data) — MIT licensed
- Files used: `draft_picks.csv`, `players.csv`, `roster_YYYY.csv`
- **No Pro Football Reference scraping** (their ToS prohibits it; creates legal exposure pre-monetization)

---

## Git push sequence (after copying folder in)

```powershell
cd C:\Users\Landon\Downloads\youknowball-v2-fix\youknowball-deploy
git add scripts/player-pipeline .github/workflows/weekly-roster-refresh.yml
git commit -m "Add nflverse player seed + weekly roster refresh pipeline"
git push origin main
```

Note: the `.github/workflows/` folder belongs at the **repo root**, not inside `scripts/player-pipeline/`. See the "Copy to laptop" commands below — they handle this.
