import { Season } from "./modules/season.js";
import { Player } from "./modules/player.js";
import { searchPlayerByName } from "./modules/fetch_player_data.js";
import { GameCollection } from "./modules/game.js";
import { ChartInput, drawStackedBarChart, drawGroupedBarChart } from "./modules/display.js";



Season.fillHtmlSelect(document.getElementById("seasonSelect"))

function createPlayerSpan(player) {
  const span = document.createElement("span")
  const text = document.createTextNode(player.name);
  span.appendChild(text)
  span.setAttribute("class", "player-pool-span")
  span.setAttribute("state", "selected")
  span.addEventListener("click", () => span.setAttribute("state", span.getAttribute("state") == "selected" ? "not-selected" : "selected"))
  return span
}

var playerInPool = new Map()

document.getElementById("search-player-button").addEventListener("click", async (event) => {
  event.preventDefault()
  if (document.getElementById("search-player-input").checkValidity()) {
    const [_, result] = await searchPlayerByName(document.getElementById("search-player-input").value)
    const players = await Promise.all(result.map((data) => Player.registerPlayer(data)))
    for (const p of players) {
      if (!playerInPool.has(p.id)) {
        playerInPool.set(p.id, createPlayerSpan(p))
        document.getElementById("selected-players-labels").appendChild(playerInPool.get(p.id))
      }
    }
  }
})

document.getElementById("player-pool-unselect-all-button").addEventListener("click", () => {
  playerInPool.forEach((v, k) => {
    v.setAttribute("state", "not-selected")
  });
})

document.getElementById("player-pool-select-all-button").addEventListener("click", () => {
  playerInPool.forEach((v, k) => {
    v.setAttribute("state", "selected")
  });
})

document.getElementById("player-pool-remove-unselected-button").addEventListener("click", () => {
  playerInPool.entries()
    .filter(([_, v]) => v.getAttribute("state") != "selected")
    .forEach(([k, v]) => {
      v.remove()
      playerInPool.delete(k)
    })
})

const statFunctions = {
  "Games played": p => p.games_played,
  "Goals": p => p.goals,
  "Assists": p => p.assists,
  "Faults": p => p.faults,
  "Won": p => p.won,
  "Lost": p => p.lost,
  "Tie": p => p.tie
}


document.getElementById("create-chart-button").addEventListener("click", async () => {

  const selectedPlayersIds = Array.from(playerInPool.entries()
    .filter(([_, v]) => v.getAttribute("state") === "selected")
    .map(([k, _]) => k));
  
  if (selectedPlayersIds.length > 0 && selectedPlayersIds.length < 10) {
    const selectedPlayers = await Promise.all(selectedPlayersIds.map(async id => await Player.getPlayerById(id)))
    const playerGames = await Promise.all(selectedPlayers.map(async p => (await GameCollection.loadPlayerGameCollection(p))))
    const playersStats = playerGames.map(gc => [gc.player, gc.computeStats()])
    const sortedPlayers = playersStats.sort((a1, a2) => a1[1].games_played - a2[1].games_played)
    const wonTieLost = ["Won", "Tie", "Lost"]

    const statsToDisplay = ["Games played", "Goals", "Assists", "Faults"]
    const groupedChartInput = new ChartInput(
      "Stats by player",
      sortedPlayers.map(([p, _]) => p.getNameFormatted()),
      Object.fromEntries(statsToDisplay.map(statType => [statType, sortedPlayers.map(([_, stats]) => statFunctions[statType](stats))]))      
    )
    
    const stackedChartInput = new ChartInput(
      "Won, tie, lost by player", 
      sortedPlayers.map(([p, _]) => p.getNameFormatted()),
      Object.fromEntries(wonTieLost.map(statType => [statType, sortedPlayers.map(([_, stats]) => statFunctions[statType](stats))]))
    )

    drawGroupedBarChart(document.getElementById("myChart"), groupedChartInput);
    drawStackedBarChart(document.getElementById("myChart2"), stackedChartInput);
  }
})

//   
/*
  title = "title"
  x_labels = ["player 1", "player 2", "player 3", "player 4"]
  stats = {
    "Goals": [4,5,6,9],
    "Assists": [2,8,3,0]
  }
*/