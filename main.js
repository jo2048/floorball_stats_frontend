import { Season } from "./modules/season.js";
import { Player } from "./modules/player.js";
import { searchPlayerByName, fetchTeamPlayers } from "./modules/fetch_player_data.js";
import { ChartContainer } from "./modules/display.js";


const seasonSelect = document.getElementById("season-select")
fillSelect(seasonSelect, await Season.getSeasonsSorted())

seasonSelect.addEventListener("change", async () => {
  const clubs = await Season.fetchSeasonClubs(seasonSelect.value)
  fillSelect(document.getElementById("club-select"), clubs)
  document.getElementById("club-select").dispatchEvent(new Event("change"))
})

function fillSelect(select, values) {
  select.querySelectorAll("option").forEach(e => e.remove())
  for (const elt of values) {
    const opt = document.createElement("option");
    opt.value = elt["id"]
    opt.textContent = elt["name"];
    select.appendChild(opt);
  }
}

document.getElementById("club-select").addEventListener("change", async () => {
  const [_, teams] = await Season.fetchTeamsBySeasonAndClub(seasonSelect.value, document.getElementById("club-select").value)
  teams.forEach(t => t.name = `${t.name} (${t.category})`)
  fillSelect(document.getElementById("team-select"), teams)
})

document.getElementById("search-team-players-btn").addEventListener("click", async () => {
  const [_ ,data] = await fetchTeamPlayers(document.getElementById("team-select").value)
  const clubName = document.getElementById("club-select").options[document.getElementById("club-select").selectedIndex].text
  data.forEach(e => e.clubname = clubName)
  const players = await Promise.all(data.map((e) => Player.registerPlayer(e)))
  players.forEach(p => addPlayerInPool(p))
})

seasonSelect.dispatchEvent(new Event("change"))


function createPlayerSpan(player) {
  const span = document.createElement("span")
  span.innerHTML = `${player.name}</br>${player.getAge()} years old</br>${player.clubName}`
  span.setAttribute("class", "badge text-bg-success")
  span.addEventListener("click", () => {
    span.setAttribute("class", span.getAttribute("class") == "badge text-bg-success" ? "badge text-bg-secondary" : "badge text-bg-success")
    updateCreateChartButton()
  })
  return span
}

var playerInPool = new Map()
updateCreateChartButton()

function addPlayerInPool(player) {
  if (!playerInPool.has(player.id)) {
    playerInPool.set(player.id, createPlayerSpan(player))
    document.getElementById("selected-players-labels").appendChild(playerInPool.get(player.id))
    updateCreateChartButton()
  }
}

function updateCreateChartButton() {
  const createChartButton = document.getElementById("create-chart-button")
  const selectedPlayersIds = getSelectedPlayersIds()
  
  if (selectedPlayersIds.length > 0 && selectedPlayersIds.length <= 20) {
    createChartButton.disabled = false
    createChartButton.setAttribute("class", "btn btn-success")
  }
  else {
    createChartButton.disabled = true
    createChartButton.setAttribute("class", "btn btn-secondary")
  }
}

document.getElementById("search-player-button").addEventListener("click", async (event) => {
  event.preventDefault()
  if (document.getElementById("search-player-input").checkValidity()) {
    const [_, result] = await searchPlayerByName(document.getElementById("search-player-input").value)
    const players = await Promise.all(result.map((data) => Player.registerPlayer(data)))
    players.forEach(p => addPlayerInPool(p))
  }
})

document.getElementById("player-pool-unselect-all-button").addEventListener("click", () => {
  playerInPool.forEach((v, k) => {
    v.setAttribute("class", "badge text-bg-secondary")
  });
})

document.getElementById("player-pool-select-all-button").addEventListener("click", () => {
  playerInPool.forEach((v, k) => {
    v.setAttribute("class", "badge text-bg-success")
  });
})

document.getElementById("player-pool-remove-unselected-button").addEventListener("click", () => {
  playerInPool.entries()
    .filter(([_, v]) => v.getAttribute("class") != "badge text-bg-success")
    .forEach(([k, v]) => {
      v.remove()
      playerInPool.delete(k)
    })
})

function getSelectedPlayersIds() {
  return Array.from(playerInPool.entries()
    .filter(([_, v]) => v.getAttribute("class") === "badge text-bg-success")
    .map(([k, _]) => k))
}

document.getElementById("create-chart-button").addEventListener("click", async () => {
  const selectedPlayersIds = getSelectedPlayersIds()

  if (selectedPlayersIds.length > 0 && selectedPlayersIds.length <= 20) {
    const selectedPlayers = await Promise.all(selectedPlayersIds.map(async id => await Player.getPlayerById(id)))
    const chartContainer = new ChartContainer(document.getElementById("chartsDiv"), selectedPlayers);
    await chartContainer.display()
  }
})
