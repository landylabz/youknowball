$c = Get-Content "game.html" -Raw

# WRITE: record result after correct answer
$c = $c -replace "state\.results\.push\(\{ player, correct: true, hintsUsed: state\.hints, tier \}\);", "state.results.push({ player, correct: true, hintsUsed: state.hints, tier });`n      sb.from('player_results').insert({ day_number: dayNum, player_name: player.name, correct: true, hints_used: state.hints }).then(() => {});"

# WRITE: record result after 3 wrong guesses
$c = $c -replace "state\.results\.push\(\{ player, correct: false, hintsUsed: state\.hints, tier \}\);`n        state\.suggestions = \[\];`n        state\.wrongGuesses = 0;", "state.results.push({ player, correct: false, hintsUsed: state.hints, tier });`n        state.suggestions = [];`n        state.wrongGuesses = 0;`n        sb.from('player_results').insert({ day_number: dayNum, player_name: player.name, correct: false, hints_used: state.hints }).then(() => {});"

# READ: show crowd insight on between-card
$c = $c -replace "<div class=""next-pulse"">Next player loading\.\.\.</div>", "<div class=""next-pulse"">Next player loading...</div>`n        <div id=""crowd-insight"" style=""font-size:11px;font-weight:700;letter-spacing:2px;color:#444;text-transform:uppercase;margin-top:-12px""></div>"

$c | Set-Content "game.html"