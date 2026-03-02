# YouKnowBall.io — Deployment Package

## Files
- `index.html` — Landing page (youknowball.io)
- `game.html`  — The game (youknowball.io/game)
- `vercel.json` — Routing config

## Deploy in 4 steps

### 1. Create a new GitHub repo
Go to github.com → New repository → Name it `youknowball` → Public → Create

### 2. Push these files
Open PowerShell in this folder:
```
git init
git add .
git commit -m "launch"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/youknowball.git
git push -u origin main
```

### 3. Deploy on Vercel
- Go to vercel.com → Add New Project
- Import your `youknowball` GitHub repo
- Framework Preset: **Other**
- Root Directory: `.` (leave as default)
- Click Deploy

### 4. Connect youknowball.io
- In Vercel dashboard → your project → Settings → Domains
- Add `youknowball.io`
- Add `www.youknowball.io`
- Vercel shows you 2 DNS records to add in Namecheap
- In Namecheap → youknowball.io → Advanced DNS → add those records
- Live in ~5 minutes

## That's it.
youknowball.io → landing page
youknowball.io/game → the game
