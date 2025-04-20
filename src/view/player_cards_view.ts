import { GameCollection } from "../model/game";
import { Player } from "../model/player";
import { Chart } from "chart.js/auto";
import { COLORS } from "./config";



class PlayerCardsView {
  static playerCardsDiv = this.#createPlayersCardDiv()
  static displayedPlayerIds: Array<number> = []

  static #createPlayersCardDiv() {
    const playerCardsDiv = document.createElement("div")
    playerCardsDiv.classList.add("main-div","container-fluid","d-inline-flex","gap-3","m-3","flex-row","flex-wrap","justify-content-start")
    return playerCardsDiv
  }

  static async createSinglePlayerCard(playerId: number): Promise<void> {
    if (this.displayedPlayerIds.includes(playerId))
      return;
    this.displayedPlayerIds.push(playerId)
    const player: Player = await Player.getPlayerById(playerId)
    const gameCollection = await GameCollection.loadPlayerGameCollection(player)
    const stats = gameCollection.computeStats()
    // const firstGame = gameCollection.games.toSorted((g1, g2) => g1.date.getDate() - g2.date.getDate())[0]
    const participationRateInGoals = Math.round(((stats.goals + stats.assists) * 100) / stats.goalsByTeam * 100 + Number.EPSILON ) / 100
  
    this.playerCardsDiv.insertAdjacentHTML("beforeend",`
      <div class="card w-20">
        <div class="card-header">
          <h5 class="card-title">${player.name}</h5>
        </div>
        <div class="card-body">
          <canvas id="game-output-canvas-${player.id}"></canvas>
        </div>
        <ul class="list-group list-group-flush">
          <li class="list-group-item">${player.getAge()} years old</li>
          <li class="list-group-item bg-info-subtle">${player.clubName}</li>
          <li class="list-group-item bg-secondary-subtle"">${stats.gamesPlayed} games played</li>
  
          <li class="list-group-item bg-danger-subtle">${stats.goalsConceded} goals conceded</li>
          <li class="list-group-item bg-success-subtle">${stats.goalsByTeam} goals scored by team</li>
          <li class="list-group-item">Direct participation in ${participationRateInGoals} % of goals</li>
        </ul>
        <div class="card-body">
          <canvas id="goals-involvement-canvas-${player.id}"></canvas>
        </div>
      </div>
    `)
    // <li class="list-group-item">First match: ${firstGame.date}</li>
    
    const gameOutcomeCanvas = this.playerCardsDiv.querySelector(`#game-output-canvas-${player.id}`) as HTMLCanvasElement
    const gameOutcomes = ['Won', 'Tie', 'Lost']
    const gameOutcomesData = {
      labels: gameOutcomes,
      datasets: [{
        label: player.name,
        data: [stats.won, stats.tie, stats.lost],
        backgroundColor: gameOutcomes.map(e => COLORS[e]),
        hoverOffset: 4
      }]
    };
  
    const gameOutputChart = new Chart(gameOutcomeCanvas, {
      type: "doughnut", data: gameOutcomesData
    })

    const goalsInvolvementCanvas = this.playerCardsDiv.querySelector(`#goals-involvement-canvas-${player.id}`) as HTMLCanvasElement
    const data = {
      labels: ['Goals', 'Assists', 'Goals with no involvement'],
      datasets: [{
        label: player.name,
        data: [stats.goals, stats.assists, stats.goalsByTeam - (stats.goals + stats.assists)],
        // backgroundColor: gameOutcomes.map(e => COLORS[e]),
        hoverOffset: 4
      }]
    };
  
    const _ = new Chart(goalsInvolvementCanvas , {
      type: "doughnut", data: data
    })
  }
}

export { PlayerCardsView };