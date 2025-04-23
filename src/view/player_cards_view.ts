import { GameCollection, Stats } from "../model/game";
import { Player } from "../model/player";
import { Chart, ChartOptions } from "chart.js/auto";
import { COLORS } from "./config";
import { getStackedBarChartOptions } from "./display_bar_chart";
import { Modal, roundNumber, Spinner } from "./utils";
import { getGamePlayersFilteredByTeam } from "../model/fetch_player_data";


class PlayerCardsView {
  static playerCardsDiv = this.#createPlayersCardDiv()
  static displayedPlayerIds: Set<number> = new Set()

  static #createPlayersCardDiv() {
    const playerCardsDiv = document.createElement("div")
    playerCardsDiv.classList.add("main-div","container-fluid","d-inline-flex","gap-3","m-3","flex-row","flex-wrap","justify-content-start")
    return playerCardsDiv
  }

  static #computeInvolvementRateInGoals(stats: Stats) {
    return stats.goalsByTeam == 0 ? 0 : (stats.goals + stats.assists) / stats.goalsByTeam
  }

  static async createSinglePlayerCard(playerId: number): Promise<void> {
    if (this.displayedPlayerIds.has(playerId))
      return;
    this.displayedPlayerIds.add(playerId)
    const player: Player = await Player.getPlayerById(playerId)
    const gameCollection = await GameCollection.loadPlayerGameCollection(player)
    const stats = gameCollection.computeStats()

    const sortedGames = gameCollection.games.toSorted((g1, g2) => g1.date.getTime() - g2.date.getTime())
    if (player.name == "Couvreur Axel") {
      console.log(gameCollection.games)
      console.log(sortedGames)
      console.log(gameCollection.games.sort((a, b) => a.date.getDate() - b.date.getDate()))
    }

    // participationRateInGoals: goalsByTeam == 0 ? 0 : (goals + assists) / goalsByTeam
    const participationRateInGoals = roundNumber(this.#computeInvolvementRateInGoals(stats) * 100)
  
    this.playerCardsDiv.insertAdjacentHTML("beforeend",`
      <div class="card w-22" id="player-card-${player.id}">
        <div class="card-header d-flex justify-content-between">
            <h5 class="card-title">${player.name}</h5>
            <button type="button" class="btn-close" aria-label="Close" id="close-card-button-${player.id}"></button>
        </div>
        <div class="card-body" id="game-outcome-div-${player.id}">
        </div>
        <ul class="list-group list-group-flush">
          <li class="list-group-item">${player.getAge()} years old</li>
          <li class="list-group-item bg-info-subtle">${player.currentClubName}</li>
          <li class="list-group-item bg-secondary-subtle"">${stats.gamesPlayed} games played</li>
          <li class="list-group-item">First game played: ${sortedGames[0].date.toLocaleDateString()}</li>
          <li class="list-group-item">Last game played: ${sortedGames[sortedGames.length - 1].date.toLocaleDateString()}</li>
          <li class="list-group-item">Direct involvement in ${participationRateInGoals} % of goals</li>
        </ul>
        <div class="card-body" id="goals-involvement-div-${player.id}">
        </div>
        <div class="card-body" id="goals-involvement-div-${player.id}">
          <button type="button" class="btn btn-primary" id="player-network-btn-${player.id}">Display most frequent teammates</button>
        </div>
      </div>
    `)
      
    // <li class="list-group-item bg-danger-subtle">${stats.goalsConceded} goals conceded</li>
    // <li class="list-group-item bg-success-subtle">${stats.goalsByTeam} goals scored by team</li>

    this.playerCardsDiv.querySelector(`#close-card-button-${player.id}`).addEventListener("click", () => {
      this.playerCardsDiv.querySelector(`#player-card-${player.id}`).remove()
      this.displayedPlayerIds.delete(player.id)
    })

    this.playerCardsDiv.querySelector(`#player-network-btn-${player.id}`).addEventListener("click", async () => {
      const div = document.createElement("div")
      const spinner = new Spinner()
      div.appendChild(spinner.container)
      Modal.showContent(div)
      Modal.setText("Number of games played with most frequent teammates - " + player.name)
      const canvas = await createPolarAreaChart(player, Math.round(stats.gamesPlayed * 0.2))
      spinner.hide()
      div.appendChild(canvas)
    })
    
    if (stats.gamesPlayed > 0) {
      this.#createDoughnutChart(player, stats)
      this.#createHorizontalBarChart(player, stats)
    } else {
      // this.playerCardsDiv.querySelector(`#goals-involvement-div-${player.id}`).remove()
      // this.playerCardsDiv.querySelector(`#game-outcome-div-${player.id}`).remove()
    }
  }

  static #createDoughnutChart(player: Player, stats: Stats): Chart {
    const div = this.playerCardsDiv.querySelector(`#game-outcome-div-${player.id}`) as HTMLDivElement
    const canvas = document.createElement("canvas")
    div.appendChild(canvas)
    const gameOutcomes = ['Won', 'Tie', 'Lost']
    const gameOutcomesData = {
      labels: gameOutcomes,
      datasets: [{
        label: player.name,
        data: [stats.won, stats.tie, stats.lost],
        backgroundColor: gameOutcomes.map(e => COLORS[e]),
        hoverOffset: 4,
      }]
    };
  
    const doughnutOptions: ChartOptions = {
      plugins: {
        tooltip: {
          enabled: false
        }
      }
    }
    return new Chart(canvas, {
      type: "doughnut", data: gameOutcomesData, options: doughnutOptions
    })
  }

  static #createHorizontalBarChart(player: Player, stats: Stats): Chart {
    const div = this.playerCardsDiv.querySelector(`#goals-involvement-div-${player.id}`) as HTMLDivElement
    const canvas = document.createElement("canvas")
    div.appendChild(canvas)
    const data = {
      labels: [''],
      datasets: [{
          label: 'Goals',
          data: [stats.goals]
        },{
          label: 'Assists',
          data: [stats.assists]
        },{
          label: 'Goals not involved',
          data: [stats.goalsByTeam - (stats.goals + stats.assists)]
        }
      ]
    };
  
    const options = getStackedBarChartOptions(null, false)
    options.indexAxis = "y"
    options.scales.x.display = false
    options.scales.y.display = false
    options.scales.x.max = stats.goalsByTeam
    options.aspectRatio = 5
    options.plugins.tooltip = {
      callbacks: {
        label: (tooltipItem: any) => {
          return tooltipItem.dataset.data[0].toString() + " (" + roundNumber(tooltipItem.dataset.data[0] * 100 / stats.goalsByTeam)  + "%)"
        },
      }
    }
    return new Chart(canvas , {
      type: "bar", 
      data: data, 
      options: options
    })
  }
}


async function createPolarAreaChart(player: Player, threshold: number): Promise<HTMLCanvasElement> {
  const gameCollection = await GameCollection.loadPlayerGameCollection(player)
  const playerIdsArray = await Promise.all(gameCollection.games.map(g => getGamePlayersFilteredByTeam(player.id, g.id)))
  let count: Record<number, number> = {};
  playerIdsArray.flat().forEach((val: number) => count[val] = (count[val] || 0) + 1);

  const x = await Promise.all(
    Object.entries(count)
      .filter(([key, value]) => parseInt(key) != player.id)
      .filter(([_, value]) => value > threshold)
      .map(async ([key, value]) => {
        const p = await Player.getPlayerById(parseInt(key));
        return [p.name, value];
      })
  );
  const playerCount: Record<string, number> = Object.fromEntries(x)

  const canvas = document.createElement("canvas")

  const chart = new Chart(canvas , {
    type: "polarArea", 
    data: {
      labels: Array.from(Object.keys(playerCount)),
      datasets: [{
        data: Array.from(Object.values(playerCount))
      }]
    }, 
    options: getPolarOptions(player.name)
  })

  return canvas
}

function getPolarOptions(title: string): ChartOptions {
  return {
    responsive: true,
    scales: {
      r: {
        pointLabels: {
          display: true,
          centerPointLabels: true,
          font: {
            size: 18
          }
        }
      }
    },
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: title
      }
    }
  }
};

export { PlayerCardsView };