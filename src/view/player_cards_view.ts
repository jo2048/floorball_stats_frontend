import { GameCollection, Stats } from "../model/game";
import { Player } from "../model/player";
import { type ActiveElement, Chart, Tooltip, type ChartOptions, type Point } from "chart.js/auto";
import { COLORS } from "./config";
import { getStackedBarChartOptions } from "./display_bar_chart";
import { Modal, roundNumber, Spinner } from "./utils";
import { getGamePlayersFilteredByTeam } from "../model/fetch_player_data";

Tooltip.positioners.chartCenter = function(items: ActiveElement[], eventPosition: Point) {
  const chart: Chart = this.chart;

  return {
    x: (chart.chartArea.left + chart.chartArea.right) / 2,
    y: chart.chartArea.bottom,
    xAlign: 'center',
    yAlign: 'top',
  };
};

function createContainer() {
  const container = document.createElement("div")
  container.classList.add("main-div","container-fluid","d-inline-flex","gap-3","m-3","flex-row","flex-wrap","justify-content-start")
  return container
}

class PlayerCardsView {
  static container = createContainer()
  static displayedPlayerIds: Set<number> = new Set()

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

    // participationRateInGoals: goalsByTeam == 0 ? 0 : (goals + assists) / goalsByTeam

  
    this.container.insertAdjacentHTML("beforeend",`
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
          <li class="list-group-item">First game played: ${sortedGames.length > 0 ? sortedGames[0].date.toLocaleDateString() : "Never played yet"}</li>
          <li class="list-group-item">Last game played: ${sortedGames.length > 0 ? sortedGames[sortedGames.length - 1].date.toLocaleDateString() : "Never played yet"}</li>
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

    this.container.querySelector(`#close-card-button-${player.id}`).addEventListener("click", () => {
      this.container.querySelector(`#player-card-${player.id}`).remove()
      this.displayedPlayerIds.delete(player.id)
    })

    const playerTeammatesButton = this.container.querySelector(`#player-network-btn-${player.id}`) as HTMLButtonElement
    playerTeammatesButton.addEventListener("click", async () => {
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
      this.#createWonTieLostChart(player, stats)
      this.#createGoalInvolvementBarChart(player, stats)
    } else {
      playerTeammatesButton.remove()
      // this.playerCardsDiv.querySelector(`#goals-involvement-div-${player.id}`).remove()
      // this.playerCardsDiv.querySelector(`#game-outcome-div-${player.id}`).remove()
    }
  }

  static #createWonTieLostChart(player: Player, stats: Stats): Chart {
    const div = this.container.querySelector(`#game-outcome-div-${player.id}`) as HTMLDivElement
    const canvas = document.createElement("canvas")
    div.appendChild(canvas)
    const data = {
      labels: [''],
      datasets: [{
          label: 'Won',
          data: [stats.won],
          backgroundColor: COLORS["Won"],
        },{
          label: 'Tie',
          data: [stats.tie],
          backgroundColor: COLORS["Tie"]
        },{
          label: 'Lost',
          data: [stats.lost],
          backgroundColor: COLORS["Lost"]
        }
      ]
    };
  
    const options = getSmallHorizontalBarChartOptions("Won, tie, lost", stats.gamesPlayed)
    return new Chart(canvas , {
      type: "bar", 
      data: data, 
      options: options
    })
  }

  static #createGoalInvolvementBarChart(player: Player, stats: Stats): Chart {
    const div = this.container.querySelector(`#goals-involvement-div-${player.id}`) as HTMLDivElement
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
  
    const participationRateInGoals = roundNumber(this.#computeInvolvementRateInGoals(stats) * 100)
    const title = `Direct involvement in ${participationRateInGoals} % of goals`
    const options = getSmallHorizontalBarChartOptions(title, stats.goalsByTeam)
    return new Chart(canvas , {
      type: "bar", 
      data: data, 
      options: options
    })
  }
}

function getSmallHorizontalBarChartOptions(title: string, totalItems: number): ChartOptions {
  const options = getStackedBarChartOptions(title, false)
  options.indexAxis = "y"
  options.scales.x.display = false
  options.scales.y.display = false
  options.scales.x.max = totalItems
  options.aspectRatio = 3.2
  options.interaction = {
    axis: 'xy',
    mode: "index"
  }
  options.plugins.tooltip = {
    position: "chartCenter",
    callbacks: {
      label: (tooltipItem: any) => {
        return tooltipItem.dataset.label + ": " + tooltipItem.dataset.data[0].toString() + " (" + roundNumber(tooltipItem.dataset.data[0] * 100 / totalItems)  + "%)"
      },
    },
  }
  return options;
}


async function createPolarAreaChart(player: Player, threshold: number): Promise<HTMLCanvasElement> {
  const gameCollection = await GameCollection.loadPlayerGameCollection(player)
  const playerIdsArray = await Promise.all(gameCollection.games.map(g => getGamePlayersFilteredByTeam(g.id, player.id)))
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