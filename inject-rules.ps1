$rules = @'
function showRules() {
  const m = document.getElementById("modal-root");
  m.innerHTML = '<div class="modal-overlay" id="rulesOverlay"><div class="modal"><div class="modal-pill"></div><div class="modal-eyebrow">How To Play</div><div class="modal-title">Daily Game.</div><div style="display:flex;flex-direction:column;gap:0"><div style="display:flex;gap:14px;align-items:flex-start;padding:14px 0;border-bottom:1px solid var(--slate)"><div style="font-size:20px;min-width:28px">&#x1F3C8;</div><div><div style="font-family:var(--font-h);font-size:14px;font-weight:900;text-transform:uppercase;color:var(--white);margin-bottom:3px">10 Players Daily</div><div style="font-size:12px;color:var(--ash);line-height:1.5">A new set of 10 NFL players every day. Guess which college they attended.</div></div></div><div style="display:flex;gap:14px;align-items:flex-start;padding:14px 0;border-bottom:1px solid var(--slate)"><div style="font-size:20px;min-width:28px">&#x1F7E5;</div><div><div style="font-family:var(--font-h);font-size:14px;font-weight:900;text-transform:uppercase;color:var(--white);margin-bottom:3px">One Hint</div><div style="font-size:12px;color:var(--ash);line-height:1.5">Reveal the player conference. Costs you your tier for that player.</div></div></div><div style="display:flex;gap:14px;align-items:flex-start;padding:14px 0;border-bottom:1px solid var(--slate)"><div style="font-size:20px;min-width:28px">&#x1F6AB;</div><div><div style="font-family:var(--font-h);font-size:14px;font-weight:900;text-transform:uppercase;color:var(--white);margin-bottom:3px">3 Wrong = Fail</div><div style="font-size:12px;color:var(--ash);line-height:1.5">Three wrong guesses on one player and you automatically move on. That one is a loss.</div></div></div><div style="display:flex;gap:14px;align-items:flex-start;padding:14px 0"><div style="font-size:20px;min-width:28px">&#x2705;</div><div><div style="font-family:var(--font-h);font-size:14px;font-weight:900;text-transform:uppercase;color:var(--white);margin-bottom:3px">Tiers</div><div style="font-size:12px;color:var(--ash);line-height:1.5">&#x2705; Ball Knower &middot; &#x1F7E6; Scholar (hint used) &middot; &#x1F7E5; Wrong &middot; &#x1F7EA; Burned</div></div></div></div><button onclick="document.getElementById(chr39modal-rootchr39).innerHTML=chr39chr39" style="width:100%;background:var(--red);border:none;border-radius:12px;padding:16px;font-family:var(--font-d);font-size:20px;letter-spacing:4px;color:var(--white);cursor:pointer;margin-top:16px">Got It</button></div></div>';
  m.innerHTML = m.innerHTML.replace(/chr39/g, String.fromCharCode(39));
  document.getElementById("rulesOverlay")?.addEventListener("click", e => { if(e.target.id==="rulesOverlay") m.innerHTML=""; });
}

init();
'@

$content = Get-Content "game.html" -Raw
$content = $content -replace 'init\(\);', $rules
$content | Set-Content "game.html" -Encoding UTF8
Write-Host "Done"
