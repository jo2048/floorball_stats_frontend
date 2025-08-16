import { Season } from "../model/season.js"
import { Player } from "../model/player.js"
import { ChartContainer } from "./chart_container.js"
import { getTeamPlayers } from "../model/fetch_player_data.js"
import { createPlayerSelectionCard, createSearchPlayerDiv, fillSelect, Modal, PlayerSelectionCard } from "./utils.js";

const seasonSelect = document.getElementById("season-select") as HTMLSelectElement
const clubSelect = document.getElementById("club-select") as HTMLSelectElement
const teamSelect = document.getElementById("team-select") as HTMLSelectElement
const searchTeamPlayersButton = document.getElementById("search-team-players-btn") as HTMLButtonElement

const playersPoolDiv = document.getElementById("players-pool-div") as HTMLDivElement
const unselectAllButton = document.getElementById("player-pool-unselect-all-button") as HTMLButtonElement
const selectAllButton = document.getElementById("player-pool-select-all-button") as HTMLButtonElement
const removeUnselectedButton = document.getElementById("player-pool-remove-unselected-button") as HTMLButtonElement
const createChartButton = document.getElementById("create-chart-button") as HTMLButtonElement
const displayChartButton = document.getElementById("display-chart-button") as HTMLButtonElement
// const displayCardsButton = document.getElementById("display-cards-button") as HTMLButtonElement

async function initPage(): Promise<void> {
  const seasons = Season.getSeasonsSorted()
  const currentSeason = Season.getCurrentSeason()

  fillSelect(seasonSelect, Season.sortSeasons(seasons))
  seasonSelect.selectedIndex = Array.from(seasonSelect.options).filter(option => parseInt(option.value) == currentSeason.id)[0].index

  seasonSelect.addEventListener("change", async () => {
    const clubs = await Season.getClubsBySeason(parseInt(seasonSelect.value))
    fillSelect(clubSelect, clubs)
    clubSelect.dispatchEvent(new Event("change"))
  })
  
  clubSelect.addEventListener("change", async () => {
    const teams = await Season.getTeamsBySeasonAndClub(parseInt(seasonSelect.value), parseInt(clubSelect.value))
    fillSelect(teamSelect, teams)
  })
  
  
  searchTeamPlayersButton.addEventListener("click", async () => {
    const data = await getTeamPlayers(parseInt(teamSelect.value))
    const players: Array<Player> = await Promise.all(data.map((e: unknown) => Player.registerPlayer(e)))
    players.forEach(p => p.currentClubId = parseInt(clubSelect.value))
    players.forEach(p => addPlayerInPool(p))
  })
  
  seasonSelect.dispatchEvent(new Event("change"))

  const div = createSearchPlayerDiv((player: Player) => addPlayerInPool(player))
  document.getElementById("search-by-name-h5").insertAdjacentElement('afterend', div)

  /* ---------------------------------------------------------------------------- */


  unselectAllButton.addEventListener("click", () => {
    playerInPool.forEach((v, _) => v.unselect());
    updateCreateChartButton()
  })

  selectAllButton.addEventListener("click", () => {
    playerInPool.forEach((v, _) => v.select());
    updateCreateChartButton()
  })

  removeUnselectedButton.addEventListener("click", () => {
    Array.from(playerInPool.entries())
      .filter(([_, v]) => v.getAttribute("status") != "selected")
      .forEach(([k, v]) => {
        v.remove()
        playerInPool.delete(k)
      })
  })

  createChartButton.addEventListener("click", async () => {
    const selectedPlayers = getSelectedPlayers()

    if (selectedPlayers.length > 0 && selectedPlayers.length <= 20) 
      await createCollapsibleChart(selectedPlayers)
  })

  displayChartButton.addEventListener("click", async () => {
    const selectedPlayers = getSelectedPlayers()

    if (selectedPlayers.length > 0 && selectedPlayers.length <= 20) {
      const chartContainer = new ChartContainer(selectedPlayers);
      Modal.showContent(chartContainer.div)
      Modal.setText(selectedPlayers.length == 1 ? "Chart - " + chartContainer.title : "Chart")
      await chartContainer.display()
    }
  })

  // displayCardsButton.addEventListener("click", async () => {
  //   const selectedPlayers = getSelectedPlayers()
  //   if (selectedPlayers.length > 0 && selectedPlayers.length <= 20) {
  //     await Promise.all(selectedPlayers.map(async player => await PlayerCardsView.createSinglePlayerCard(player)))
  //   }
  //   document.getElementById("player-cards-view-link").dispatchEvent(new Event("click"));
  // })


  updateCreateChartButton()
}

async function createCollapsibleChart(players: Array<Player>) {
  const details = document.createElement("details")
  const chartContainer = new ChartContainer(players);
  chartContainer.delete = () => details.remove()
  details.appendChild(chartContainer.div)
  //TODO : remove details when deleting chartContainer
  details.classList.add("chart-container", "m-2")
  details.setAttribute("open", "true")
  const chartSummary = document.createElement("summary")
  chartSummary.classList.add("px-3", "py-2")
  chartSummary.textContent = chartContainer.title
  details.appendChild(chartSummary)
  document.getElementById("chartsDiv").appendChild(details)
  details.scrollIntoView()
  await chartContainer.display()
  chartContainer.scrollIntoView()
}

var playerInPool: Map<number, PlayerSelectionCard> = new Map()

function addPlayerInPool(player: Player) {
  if (!playerInPool.has(player.id)) {
    const card = createPlayerSelectionCard(player)
    card.select()
    card.addEventListener("click", () => {
      if (card.status == "selected") card.unselect(); else card.select()
      updateCreateChartButton()
    })
    playerInPool.set(player.id, card)
    document.getElementById("selected-players-labels").appendChild(card)
    updateCreateChartButton()
  }
}

function updateCreateChartButton() {
  const selectedPlayersCount = getSelectedPlayers().length
  
  if (selectedPlayersCount > 0 && selectedPlayersCount <= 20) {
    playersPoolDiv.querySelectorAll(".create-chart-btn").forEach(btn => {
      (btn as HTMLButtonElement).disabled = false
      btn.classList.remove("btn-secondary")
      btn.classList.add("btn-success")
    });
    playersPoolDiv.querySelectorAll(".selected-players-badge").forEach(e => {
      e.classList.remove("bg-danger")
      e.classList.add("bg-success")
    });
  }
  else {
    playersPoolDiv.querySelectorAll(".create-chart-btn").forEach(btn => {
      (btn as HTMLButtonElement).disabled = true
      btn.classList.remove("btn-success")
      btn.classList.add("btn-secondary")
    });
    playersPoolDiv.querySelectorAll(".selected-players-badge").forEach(e => {
      e.classList.remove("bg-success")
      e.classList.add("bg-danger")
    });
  }

  playersPoolDiv.querySelectorAll(".selected-players-badge").forEach(e => e.textContent = selectedPlayersCount.toString())
}

function getSelectedPlayers(): Array<Player> {
  return Array.from(playerInPool.values())
    .filter(card => card.status == "selected")
    .map(card => card.player)
}


export { initPage };