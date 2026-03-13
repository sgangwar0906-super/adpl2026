const sheet="14C6hEU0LomlnzIKXzy7DqvfgsAQF0vmNNnDi3BovUOk"

const pointsURL=`https://opensheet.elk.sh/${sheet}/points`
const matchURL=`https://opensheet.elk.sh/${sheet}/matches`
const seasonURL=`https://opensheet.elk.sh/${sheet}/season`

if(document.getElementById("leaderboard")){

fetch(pointsURL)
.then(res=>res.json())
.then(data=>{

data.forEach(p=>{
p.Total=Number(p.WinnerPts)+Number(p.MOTMPts)+Number(p.SeasonPts)
})

data.sort((a,b)=>b.Total-a.Total)

let table=document.getElementById("leaderboard")

data.forEach((p,i)=>{

table.innerHTML+=`
<tr>
<td>${i+1}</td>
<td><a href="player.html?name=${p.Player}">${p.Player}</a></td>
<td>${p.WinnerPts}</td>
<td>${p.MOTMPts}</td>
<td>${p.SeasonPts}</td>
<td>${p.Total}</td>
</tr>
`

})

})

}

const params=new URLSearchParams(window.location.search)
const player=params.get("name")

if(player){

document.getElementById("playerName").innerText=player

fetch(matchURL)
.then(res=>res.json())
.then(data=>{

let table=document.getElementById("matchTable")

data.filter(x=>x.Player==player).forEach(p=>{

table.innerHTML+=`
<tr>
<td>${p.Match}</td>
<td>${p.WinnerPrediction}</td>
<td>${p.WinnerCorrect}</td>
<td>${p.WinnerPoints}</td>
<td>${p.MOTMPrediction}</td>
<td>${p.MOTMCorrect}</td>
<td>${p.MOTMPoints}</td>
</tr>
`

})

})

fetch(seasonURL)
.then(res=>res.json())
.then(data=>{

let table=document.getElementById("seasonTable")

data.filter(x=>x.Player==player).forEach(p=>{

table.innerHTML+=`
<tr>
<td>${p.Orange1}</td>
<td>${p.Orange2}</td>
<td>${p.Orange3}</td>
<td>${p.Purple1}</td>
<td>${p.Purple2}</td>
<td>${p.Purple3}</td>
<td>${p.Winner}</td>
<td>${p.Playoff1}</td>
<td>${p.Playoff2}</td>
<td>${p.Playoff3}</td>
<td>${p.Playoff4}</td>
</tr>
`

})

})

}