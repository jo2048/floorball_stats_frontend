import { Season } from "./modules/season.js";
import { Player } from "./modules/player.js";
import { searchPlayerByName, fetchTeamPlayers } from "./modules/fetch_player_data.js";
import { ChartContainer, fillSelect } from "./modules/display.js";


const seasonSelect = document.getElementById("season-select")
const seasonsSorted = await Season.getSeasonsSorted()
fillSelect(seasonSelect, seasonsSorted)

seasonSelect.addEventListener("change", async () => {
  const clubs = await Season.fetchSeasonClubs(seasonSelect.value)
  fillSelect(document.getElementById("club-select"), clubs)
  document.getElementById("club-select").dispatchEvent(new Event("change"))
})


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
  span.setAttribute("status", "selected")
  span.changeStatus = (newStatus) => {
    span.setAttribute("status", newStatus)
    if (newStatus == "selected") {
      span.classList.remove("text-bg-secondary")
      span.classList.add("text-bg-success")
    } else {
      span.classList.remove("text-bg-success")
      span.classList.add("text-bg-secondary")
    }
  }
  span.addEventListener("click", () => {
    const newStatus = span.getAttribute("status") == "selected" ? "not-selected" : "selected"
    span.changeStatus(newStatus)
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
  const playersCountBadge = document.getElementById("selected-players-button-count")
  const selectedPlayersIds = getSelectedPlayersIds()
  
  if (selectedPlayersIds.length > 0 && selectedPlayersIds.length <= 20) {
    createChartButton.disabled = false
    createChartButton.classList.remove("btn-secondary")
    createChartButton.classList.add("btn-success")
    playersCountBadge.classList.remove("bg-danger")
    playersCountBadge.classList.add("bg-success")
  }
  else {
    createChartButton.disabled = true
    createChartButton.classList.remove("btn-success")
    createChartButton.classList.add("btn-secondary")
    playersCountBadge.classList.remove("bg-success")
    playersCountBadge.classList.add("bg-danger")
  }

  document.getElementById("selected-players-button-count").textContent = selectedPlayersIds.length
}

const searchPlayerInput = document.getElementById("search-player-input")
const searchPlayerButton = document.getElementById("search-player-button")

function updateSearchPlayerBtn() {  
  searchPlayerInput.classList.remove("border-danger")
  if (!searchPlayerInput.checkValidity()) {
    searchPlayerButton.disabled = true
    searchPlayerButton.classList.remove("btn-success")
    searchPlayerButton.classList.add("btn-secondary")
    if (searchPlayerInput.value) 
      searchPlayerInput.classList.add("border-danger")
  }
  else {
    searchPlayerButton.disabled = false
    searchPlayerButton.classList.remove("btn-secondary")
    searchPlayerButton.classList.add("btn-success")
  }
}

searchPlayerInput.addEventListener("change", () => updateSearchPlayerBtn())
searchPlayerInput.addEventListener("keyup", () => updateSearchPlayerBtn())


searchPlayerInput.dispatchEvent(new Event("keyup"))

searchPlayerButton.addEventListener("click", async () => {
  if (searchPlayerInput.checkValidity()) {
    const [_, result] = await searchPlayerByName(searchPlayerInput.value)
    const players = await Promise.all(result.map((data) => Player.registerPlayer(data)))
    players.forEach(p => addPlayerInPool(p))
  }
})

document.getElementById("player-pool-unselect-all-button").addEventListener("click", () => {
  playerInPool.forEach((v, k) => {
    v.changeStatus("not-selected")
  });
  updateCreateChartButton()
})

document.getElementById("player-pool-select-all-button").addEventListener("click", () => {
  playerInPool.forEach((v, k) => {
    v.changeStatus("selected")
  });
  updateCreateChartButton()
})

document.getElementById("player-pool-remove-unselected-button").addEventListener("click", () => {
  Array.from(playerInPool.entries())
    .filter(([_, v]) => v.getAttribute("status") != "selected")
    .forEach(([k, v]) => {
      v.remove()
      playerInPool.delete(k)
    })
})

function getSelectedPlayersIds() {
  return Array.from(playerInPool.entries())
    .filter(([_, v]) => v.getAttribute("status") == "selected")
    .map(([k, _]) => k)
}

document.getElementById("create-chart-button").addEventListener("click", async () => {
  const selectedPlayersIds = getSelectedPlayersIds()

  if (selectedPlayersIds.length > 0 && selectedPlayersIds.length <= 20) {
    const selectedPlayers = await Promise.all(selectedPlayersIds.map(async id => await Player.getPlayerById(id)))
    const chartContainer = new ChartContainer(document.getElementById("chartsDiv"), selectedPlayers, seasonsSorted);
    await chartContainer.display()
  }
})
