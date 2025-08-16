import { GameCollection, Stats } from "../model/game";
import { Player } from "../model/player";
import { type ActiveElement, Chart, Tooltip, type ChartOptions, type Point } from "chart.js/auto";
import { COLORS } from "./config";
import { getStackedBarChartOptions } from "./display_bar_chart";
import { roundNumber } from "./utils";

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

  static async createSinglePlayerCard(player: Player): Promise<void> {
    if (this.displayedPlayerIds.has(player.id))
      return;
    this.displayedPlayerIds.add(player.id)
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
          <li class="list-group-item bg-info-subtle">${player.currentClubId}</li>
          <li class="list-group-item bg-secondary-subtle"">${stats.gamesPlayed} games played</li>
          <li class="list-group-item">First game played: ${sortedGames.length > 0 ? sortedGames[0].date.toLocaleDateString() : "Never played yet"}</li>
          <li class="list-group-item">Last game played: ${sortedGames.length > 0 ? sortedGames[sortedGames.length - 1].date.toLocaleDateString() : "Never played yet"}</li>
          <li class="list-group-item">Number of matches D1 / D2 / D3</li>
        </ul>
        <div class="card-body" id="goals-involvement-div-${player.id}">
        </div>
        <div class="card-body">
        </div>
      </div>
    `)
      
    // <li class="list-group-item bg-danger-subtle">${stats.goalsConceded} goals conceded</li>
    // <li class="list-group-item bg-success-subtle">${stats.goalsByTeam} goals scored by team</li>

    this.container.querySelector(`#close-card-button-${player.id}`).addEventListener("click", () => {
      this.container.querySelector(`#player-card-${player.id}`).remove()
      this.displayedPlayerIds.delete(player.id)
    })

    
    if (stats.gamesPlayed > 0) {
      this.#createWonTieLostChart(player, stats)
      this.#createGoalInvolvementBarChart(player, stats)
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
  
    const title = `${roundNumber(100 * stats.won / stats.gamesPlayed)} % of games won`
    const options = getSmallHorizontalBarChartOptions(title, stats.gamesPlayed)
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


export { PlayerCardsView };