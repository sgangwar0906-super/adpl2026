// script.js — unchanged (already handles leaderboard, profiles, theme sync)
// (Same as provided, works with new pages)
const sheet = "14C6hEU0LomlnzIKXzy7DqvfgsAQF0vmNNnDi3BovUOk";
const pointsURL = `https://opensheet.elk.sh/${sheet}/points`;
const matchURL = `https://opensheet.elk.sh/${sheet}/matches`;
const seasonURL = `https://opensheet.elk.sh/${sheet}/season`;

// Leaderboard
if (document.getElementById("leaderboard")) {
  fetch(pointsURL)
    .then(res => res.json())
    .then(data => {
      data.forEach(p => { p.Total = Number(p.WinnerPts) + Number(p.MOTMPts) + Number(p.SeasonPts); });
      data.sort((a, b) => b.Total - a.Total);
      const tbody = document.querySelector("#leaderboard tbody");
      tbody.innerHTML = "";
      data.forEach((p, i) => {
        const row = tbody.insertRow();
        row.insertCell(0).innerText = i + 1;
        const nameCell = row.insertCell(1);
        const link = document.createElement("a");
        link.href = `pp.html?player=${encodeURIComponent(p.Player)}`;
        link.textContent = p.Player;
        link.style.color = "inherit";
        link.style.textDecoration = "none";
        link.style.borderBottom = "1px dotted var(--accent-primary)";
        nameCell.appendChild(link);
        row.insertCell(2).innerText = p.WinnerPts;
        row.insertCell(3).innerText = p.MOTMPts;
        row.insertCell(4).innerText = p.SeasonPts;
        row.insertCell(5).innerText = p.Total;
      });
    });
}

// Player Profile Page (pp.html)
if (document.getElementById("playersGrid")) {
  const photoMap = {
    "Samarth Gangwar": "sg.png", "Divyansh Tyagi": "dt.png",
    "Saksham Rathore": "sr.png", "Dhairya Kumar": "dk.png",
    "Shubh Saxena": "ss.png", "Chirag Saxena": "cs.png",
    "Akshay Pratap": "ap.png", "Amrit Johri": "aj.png",
    "Syed Askari": "sa.png", "Hirdyansh Sahni": "hs.png"
  };
  const defaultPhoto = "images/default.jpg";
  let allPlayers = [], seasonData = [], matchData = [], dataLoaded = false, currentPlayer = null, gridRendered = false;
  const playersGrid = document.getElementById("playersGrid");
  const selectedSection = document.getElementById("selectedPlayerSection");
  const selectedNameSpan = document.getElementById("selectedPlayerName");
  const selectedPhotoImg = document.getElementById("selectedPhoto");
  const seasonTbody = document.querySelector("#seasonTable tbody");
  const matchTbody = document.querySelector("#matchTable tbody");

  Promise.all([
    fetch(pointsURL).then(res => res.json()),
    fetch(seasonURL).then(res => res.json()),
    fetch(matchURL).then(res => res.json())
  ]).then(([points, season, matches]) => {
    allPlayers = points.map(p => p.Player).filter((v,i,a)=>a.indexOf(v)===i);
    if (!allPlayers.length) allPlayers = Object.keys(photoMap);
    seasonData = season;
    matchData = matches;
    dataLoaded = true;
    renderPlayerGrid();
    const urlPlayer = new URLSearchParams(window.location.search).get("player");
    if (urlPlayer && allPlayers.includes(urlPlayer)) selectPlayer(urlPlayer);
  }).catch(err => { playersGrid.innerHTML = '<div class="loader">Error loading data</div>'; });

  function renderPlayerGrid() {
    if (gridRendered) return;
    playersGrid.innerHTML = "";
    allPlayers.forEach(player => {
      const card = document.createElement("div");
      card.className = "player-card";
      card.setAttribute("data-player", player);
      const img = document.createElement("img");
      img.src = photoMap[player] || defaultPhoto;
      img.className = "player-card-img";
      img.onerror = () => { img.src = defaultPhoto; };
      const nameSpan = document.createElement("div");
      nameSpan.className = "player-card-name";
      nameSpan.innerText = player;
      card.appendChild(img);
      card.appendChild(nameSpan);
      card.addEventListener("click", () => selectPlayer(player));
      playersGrid.appendChild(card);
    });
    gridRendered = true;
  }

  function selectPlayer(playerName) {
    if (!dataLoaded || currentPlayer === playerName) return;
    currentPlayer = playerName;
    const newUrl = new URL(window.location);
    newUrl.searchParams.set("player", playerName);
    window.history.pushState({}, "", newUrl);
    document.querySelectorAll(".player-card").forEach(card => {
      if (card.getAttribute("data-player") === playerName) card.classList.add("active");
      else card.classList.remove("active");
    });
    selectedSection.style.display = "block";
    selectedNameSpan.innerText = playerName;
    selectedPhotoImg.src = photoMap[playerName] || defaultPhoto;
    selectedPhotoImg.onerror = () => { selectedPhotoImg.src = defaultPhoto; };
    
    seasonTbody.innerHTML = "";
    const ps = seasonData.filter(x => x.Player === playerName);
    if (ps.length) {
      const s = ps[0];
      const row = seasonTbody.insertRow();
      [s.Orange1, s.Orange2, s.Orange3, s.Purple1, s.Purple2, s.Purple3, s.Winner,
       s.Playoff1, s.Playoff2, s.Playoff3, s.Playoff4, s.POTT1, s.POTT2, s.POTT3]
        .forEach(val => row.insertCell().innerText = val || "");
    } else seasonTbody.innerHTML = "<tr><td colspan='14'>No season predictions</td></tr>";
    
    matchTbody.innerHTML = "";
    const pm = matchData.filter(x => x.Player === playerName);
    if (pm.length) {
      pm.forEach(m => {
        const row = matchTbody.insertRow();
        [m.Match, m.WinnerPrediction, m.WinnerCorrect, m.WinnerPoints,
         m.MOTMPrediction, m.MOTMCorrect, m.MOTMPoints].forEach(val => row.insertCell().innerText = val || "");
      });
    } else matchTbody.innerHTML = "<tr><td colspan='7'>No match predictions</td></tr>";
  }
}

// Theme Switcher (global)
(function() {
  const themeSelector = document.getElementById('themeSelector');
  if (!themeSelector) return;
  const savedTheme = localStorage.getItem('adpl-theme') || 'green-silver';
  document.documentElement.setAttribute('data-theme', savedTheme);
  themeSelector.value = savedTheme;
  themeSelector.addEventListener('change', (e) => {
    const newTheme = e.target.value;
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('adpl-theme', newTheme);
  });
})();