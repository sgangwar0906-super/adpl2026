const sheetId = "14C6hEU0LomlnzIKXzy7DqvfgsAQF0vmNNnDi3BovUOk";
const elkPointsURL = `https://opensheet.elk.sh/${sheetId}/points`;
const elkMatchURL = `https://opensheet.elk.sh/${sheetId}/matches`;
const elkSeasonURL = `https://opensheet.elk.sh/${sheetId}/season`;

function getMatchNumber(matchStr) {
  if (!matchStr) return 999;
  const num = parseInt(matchStr);
  if (!isNaN(num)) return num;
  const match = matchStr.match(/\d+/);
  return match ? parseInt(match[0]) : 999;
}

// ========== LEADERBOARD ==========
if (document.getElementById("leaderboard")) {
  Promise.all([fetch(elkPointsURL), fetch(elkMatchURL)])
    .then(async ([pointsRes, matchRes]) => {
      const points = await pointsRes.json();
      points.forEach(p => p.Total = Number(p.WinnerPts) + Number(p.MOTMPts) + Number(p.SeasonPts));
      points.sort((a,b) => b.Total - a.Total);
      const tbody = document.querySelector("#leaderboard tbody");
      tbody.innerHTML = "";
      points.forEach((p, i) => {
        const row = tbody.insertRow();
        row.insertCell(0).innerText = i+1;
        const nameCell = row.insertCell(1);
        const link = document.createElement("a");
        link.href = `pp.html?player=${encodeURIComponent(p.Player)}`;
        link.textContent = p.Player;
        link.style.cssText = "color:inherit; text-decoration:none; border-bottom:1px dotted var(--accent-primary);";
        nameCell.appendChild(link);
        row.insertCell(2).innerText = p.WinnerPts || 0;
        row.insertCell(3).innerText = p.MOTMPts || 0;
        row.insertCell(4).innerText = p.SeasonPts || 0;
        row.insertCell(5).innerText = p.Total;
      });
    }).catch(err => console.error("Leaderboard error:", err));
}

// ========== PLAYER PROFILE ==========
if (document.getElementById("playerName") && window.location.pathname.includes("pp.html")) {
  const urlParams = new URLSearchParams(window.location.search);
  const player = urlParams.get("player");
  if (player) {
    document.getElementById("playerName").innerText = player;
    const photoMap = {
      "Rohit Sharma": "images/rohit.jpg", "Virat Kohli": "images/virat.jpg",
      "Hardik Pandya": "images/hardik.jpg", "Jasprit Bumrah": "images/bumrah.jpg",
      "Shubman Gill": "images/gill.jpg", "KL Rahul": "images/rahul.jpg",
      "Suryakumar Yadav": "images/sky.jpg", "Ravindra Jadeja": "images/jadeja.jpg",
      "Jos Buttler": "images/buttler.jpg", "MS Dhoni": "images/dhoni.jpg",
      "Rashid Khan": "images/rashid.jpg", "Ben Stokes": "images/stokes.jpg"
    };
    const img = document.getElementById("playerPhoto");
    if (img) { img.src = photoMap[player] || "images/default.jpg"; img.onerror = () => img.src = "images/default.jpg"; }
    fetch(elkMatchURL).then(res => res.json()).then(data => {
      const tbody = document.querySelector("#matchTable tbody");
      if (tbody) {
        tbody.innerHTML = "";
        const matches = data.filter(m => m.Player === player).sort((a,b) => getMatchNumber(a.Match) - getMatchNumber(b.Match));
        if (!matches.length) tbody.innerHTML = "</table><td colspan='7'>No match predictions</td></tr>";
        else matches.forEach(m => {
          const row = tbody.insertRow();
          row.insertCell(0).innerText = m.Match || "";
          row.insertCell(1).innerText = m.WinnerPrediction || "";
          row.insertCell(2).innerText = m.WinnerCorrect || "";
          row.insertCell(3).innerText = m.WinnerPoints || "0";
          row.insertCell(4).innerText = m.MOTMPrediction || "";
          row.insertCell(5).innerText = m.MOTMCorrect || "";
          row.insertCell(6).innerText = m.MOTMPoints || "0";
        });
      }
    });
    fetch(elkSeasonURL).then(res => res.json()).then(data => {
      const tbody = document.querySelector("#seasonTable tbody");
      if (tbody) {
        tbody.innerHTML = "";
        const season = data.filter(s => s.Player === player);
        if (!season.length) tbody.innerHTML = "<tr><td colspan='14'>No season predictions</td></tr>";
        else {
          const s = season[0];
          const row = tbody.insertRow();
          row.insertCell(0).innerText = s.Orange1 || ""; row.insertCell(1).innerText = s.Orange2 || ""; row.insertCell(2).innerText = s.Orange3 || "";
          row.insertCell(3).innerText = s.Purple1 || ""; row.insertCell(4).innerText = s.Purple2 || ""; row.insertCell(5).innerText = s.Purple3 || "";
          row.insertCell(6).innerText = s.Winner || ""; row.insertCell(7).innerText = s.Playoff1 || ""; row.insertCell(8).innerText = s.Playoff2 || "";
          row.insertCell(9).innerText = s.Playoff3 || ""; row.insertCell(10).innerText = s.Playoff4 || ""; row.insertCell(11).innerText = s.POTT1 || "";
          row.insertCell(12).innerText = s.POTT2 || ""; row.insertCell(13).innerText = s.POTT3 || "";
        }
      }
    });
  }
}

// ========== STATS PAGE ==========
if (document.getElementById("winnerChart")) {
  (async function() {
    try {
      const [seasonRes, matchRes, pointsRes] = await Promise.all([
        fetch(elkSeasonURL).then(r => r.json()),
        fetch(elkMatchURL).then(r => r.json()),
        fetch(elkPointsURL).then(r => r.json())
      ]);
      const seasonData = seasonRes;
      const matchData = matchRes;
      const allPlayers = [...new Set(pointsRes.map(p => p.Player))].sort();

      console.log("=== DEBUG: Sample match row ===");
      if (matchData.length) {
        console.log(matchData[0]);
        console.log("WinnerPoints raw value:", matchData[0].WinnerPoints, "type:", typeof matchData[0].WinnerPoints);
      }

      // --- Compute streaks with detailed logging ---
      function computeStreaks(matches) {
        const winnerStreaks = {}, motmStreaks = {}, winnerLosingStreaks = {};
        const playerMatches = {};
        matches.forEach(m => {
          if (!playerMatches[m.Player]) playerMatches[m.Player] = [];
          playerMatches[m.Player].push(m);
        });
        for (let player in playerMatches) {
          playerMatches[player].sort((a,b) => getMatchNumber(a.Match) - getMatchNumber(b.Match));
          let currWinnerStreak = 0, maxWinnerStreak = 0;
          let currMotmStreak = 0, maxMotmStreak = 0;
          let currWinnerLosing = 0, maxWinnerLosing = 0;
          console.log(`\n--- ${player} ---`);
          for (let m of playerMatches[player]) {
            const winnerPoints = parseFloat(m.WinnerPoints);
            const motmPoints = parseFloat(m.MOTMPoints);
            // Handle NaN (if empty or non-numeric)
            const winnerOk = !isNaN(winnerPoints) && winnerPoints >= 2;
            const motmOk = !isNaN(motmPoints) && motmPoints >= 5;
            const winnerZero = !isNaN(winnerPoints) && winnerPoints === 0;
            console.log(`Match ${m.Match}: WinnerPoints=${m.WinnerPoints} (parsed=${winnerPoints}) -> ok=${winnerOk}, zero=${winnerZero}; MOTMPoints=${m.MOTMPoints} -> ok=${motmOk}`);
            if (winnerOk) {
              currWinnerStreak++;
              maxWinnerStreak = Math.max(maxWinnerStreak, currWinnerStreak);
            } else {
              currWinnerStreak = 0;
            }
            if (motmOk) {
              currMotmStreak++;
              maxMotmStreak = Math.max(maxMotmStreak, currMotmStreak);
            } else {
              currMotmStreak = 0;
            }
            if (winnerZero) {
              currWinnerLosing++;
              maxWinnerLosing = Math.max(maxWinnerLosing, currWinnerLosing);
            } else {
              currWinnerLosing = 0;
            }
          }
          console.log(`Winner streak: ${maxWinnerStreak}, MOTM streak: ${maxMotmStreak}, Winner losing streak (zeroes): ${maxWinnerLosing}`);
          winnerStreaks[player] = maxWinnerStreak;
          motmStreaks[player] = maxMotmStreak;
          winnerLosingStreaks[player] = maxWinnerLosing;
        }
        return { winnerStreaks, motmStreaks, winnerLosingStreaks };
      }

      const { winnerStreaks, motmStreaks, winnerLosingStreaks } = computeStreaks(matchData);
      const topWinnerStreaks = Object.entries(winnerStreaks).sort((a,b)=>b[1]-a[1]).slice(0,3);
      const topMotmStreaks = Object.entries(motmStreaks).sort((a,b)=>b[1]-a[1]).slice(0,3);
      const topWinnerLosingStreaks = Object.entries(winnerLosingStreaks).sort((a,b)=>b[1]-a[1]).slice(0,3);

      console.log("\n=== Top Winner Streaks ===", topWinnerStreaks);
      console.log("=== Top MOTM Streaks ===", topMotmStreaks);
      console.log("=== Top Winner Losing Streaks (zeroes) ===", topWinnerLosingStreaks);

      const winnerStreakDiv = document.getElementById("winnerStreakList");
      const motmStreakDiv = document.getElementById("motmStreakList");
      const winnerLosingDiv = document.getElementById("winnerLosingStreakList");

      if (winnerStreakDiv) {
        winnerStreakDiv.innerHTML = topWinnerStreaks.length ?
          `<ul class="streak-list">${topWinnerStreaks.map(([p,s])=>`<li><span>${p}</span><span class="streak-count">${s} match${s!==1?'es':''}</span></li>`).join('')}</ul>` :
          "<p>No data</p>";
      }
      if (motmStreakDiv) {
        motmStreakDiv.innerHTML = topMotmStreaks.length ?
          `<ul class="streak-list">${topMotmStreaks.map(([p,s])=>`<li><span>${p}</span><span class="streak-count">${s} match${s!==1?'es':''}</span></li>`).join('')}</ul>` :
          "<p>No data</p>";
      }
      if (winnerLosingDiv) {
        winnerLosingDiv.innerHTML = topWinnerLosingStreaks.length ?
          `<ul class="streak-list">${topWinnerLosingStreaks.map(([p,s])=>`<li><span>${p}</span><span class="streak-count">${s} match${s!==1?'es':''}</span></li>`).join('')}</ul>` :
          "<p>No data</p>";
      }

      // ---- All charts (unchanged) ----
      function renderChart(ctxId, dataObj, label, limit=8) {
        const sorted = Object.entries(dataObj).sort((a,b)=>b[1]-a[1]).slice(0,limit);
        const ctx = document.getElementById(ctxId).getContext('2d');
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: sorted.map(x=>x[0]),
            datasets: [{
              label, data: sorted.map(x=>x[1]),
              backgroundColor: 'rgba(192, 192, 192, 0.6)',
              borderColor: 'var(--accent-primary)',
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            plugins: { legend: { labels: { color: 'var(--text-primary)' } } },
            scales: {
              y: { beginAtZero: true, grid: { color: 'var(--border-soft)' }, ticks: { color: 'var(--text-secondary)' } },
              x: { ticks: { color: 'var(--text-primary)' } }
            }
          }
        });
      }

      const winnerCounts = {};
      seasonData.forEach(r=>{ if(r.Winner) winnerCounts[r.Winner] = (winnerCounts[r.Winner]||0)+1; });
      renderChart('winnerChart', winnerCounts, 'Times predicted as Winner');
      
      const orangeCounts = {};
      seasonData.forEach(r=>{ ['Orange1','Orange2','Orange3'].forEach(k=>{ if(r[k]) orangeCounts[r[k]] = (orangeCounts[r[k]]||0)+1; }); });
      renderChart('orangeChart', orangeCounts, 'Orange Cap picks');
      
      const purpleCounts = {};
      seasonData.forEach(r=>{ ['Purple1','Purple2','Purple3'].forEach(k=>{ if(r[k]) purpleCounts[r[k]] = (purpleCounts[r[k]]||0)+1; }); });
      renderChart('purpleChart', purpleCounts, 'Purple Cap picks');
      
      const playoffCounts = {};
      seasonData.forEach(r=>{ ['Playoff1','Playoff2','Playoff3','Playoff4'].forEach(k=>{ if(r[k]) playoffCounts[r[k]] = (playoffCounts[r[k]]||0)+1; }); });
      renderChart('playoffChart', playoffCounts, 'Playoff team selections', 10);
      
      const pottCounts = {};
      seasonData.forEach(r=>{ ['POTT1','POTT2','POTT3'].forEach(k=>{ if(r[k]) pottCounts[r[k]] = (pottCounts[r[k]]||0)+1; }); });
      renderChart('pottChart', pottCounts, 'POTT selections', 8);
      
      const motmCounts = {};
      matchData.forEach(r=>{ if(r.MOTMPrediction) motmCounts[r.MOTMPrediction] = (motmCounts[r.MOTMPrediction]||0)+1; });
      renderChart('motmChart', motmCounts, 'MOTM predictions', 10);

      // Individual selector
      const select = document.getElementById('playerStatsSelect');
      const individualDiv = document.getElementById('individualStatsDisplay');
      if (select && individualDiv) {
        select.innerHTML = '<option value="">-- Select Contestant --</option>' + allPlayers.map(p=>`<option value="${p}">${p}</option>`).join('');
        select.addEventListener('change', (e) => {
          if (!e.target.value) return;
          const player = e.target.value;
          const playerMOTMs = matchData.filter(m=>m.Player===player).map(m=>m.MOTMPrediction).filter(v=>v);
          const motmFreq = {};
          playerMOTMs.forEach(m=>motmFreq[m]=(motmFreq[m]||0)+1);
          const topMOTM = Object.entries(motmFreq).sort((a,b)=>b[1]-a[1])[0];
          const playerWinners = matchData.filter(m=>m.Player===player).map(m=>m.WinnerPrediction).filter(v=>v);
          const winnerFreq = {};
          playerWinners.forEach(w=>winnerFreq[w]=(winnerFreq[w]||0)+1);
          const topWinner = Object.entries(winnerFreq).sort((a,b)=>b[1]-a[1])[0];
          const seasonPick = seasonData.find(s=>s.Player===player);
          const seasonWinner = seasonPick ? seasonPick.Winner : 'N/A';
          individualDiv.innerHTML = `
            <p><strong>${player}</strong> most predicted:</p>
            <p>🏆 MOTM: <span style="color:var(--accent-secondary);">${topMOTM ? `${topMOTM[0]} (${topMOTM[1]} times)` : 'None'}</span></p>
            <p>🎯 Match Winner: <span style="color:var(--accent-secondary);">${topWinner ? `${topWinner[0]} (${topWinner[1]} times)` : 'None'}</span></p>
            <p>🏁 Season Winner Pick: <span style="color:var(--accent-secondary);">${seasonWinner}</span></p>
          `;
        });
        if (allPlayers.length) { select.value = allPlayers[0]; select.dispatchEvent(new Event('change')); }
      }
    } catch(e) { console.error("Stats page error:", e); }
  })();
}

// ========== THEME SELECTOR ==========
(function() {
  const sel = document.getElementById('themeSelector');
  if (!sel) return;
  const saved = localStorage.getItem('adpl-theme') || 'csk';
  document.documentElement.setAttribute('data-theme', saved);
  sel.value = saved;
  sel.addEventListener('change', (e) => {
    document.documentElement.setAttribute('data-theme', e.target.value);
    localStorage.setItem('adpl-theme', e.target.value);
  });
})();