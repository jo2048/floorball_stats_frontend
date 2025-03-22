import { Season } from "./modules/season.js";
import { Player } from "./modules/player.js";
import { searchPlayerByName } from "./modules/fetch_player_data.js";
import { ChartContainer } from "./modules/display.js";



// Season.fillHtmlSelect(document.getElementById("seasonSelect"))

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



document.getElementById("create-chart-button").addEventListener("click", async () => {
  const selectedPlayersIds = Array.from(playerInPool.entries()
    .filter(([_, v]) => v.getAttribute("state") === "selected")
    .map(([k, _]) => k));
  
  if (selectedPlayersIds.length > 0 && selectedPlayersIds.length < 10) {
    const selectedPlayers = await Promise.all(selectedPlayersIds.map(async id => await Player.getPlayerById(id)))
    const chartContainer = new ChartContainer(document.getElementById("chartsDiv"), selectedPlayers);
    await chartContainer.display()
  }
})
