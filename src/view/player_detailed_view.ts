import { Chart, type ChartOptions } from "chart.js"
import { GameCollection, Stats } from "../model/game"
import { Player } from "../model/player"
import { createDoughnutChart, createPlayerSelectionCard, createSearchPlayerDiv, roundNumber, type PlayerSelectionCard } from "./utils"
import { getGamePlayersFilteredByTeam } from "../model/fetch_player_data"
import { Spinner } from "./spinner"
import { ChartContainer } from "./chart_container"

function createContainer() {
  const template = document.createElement("template")
  template.insertAdjacentHTML("beforeend", `<div class="view col-12 col-xl-10">
  <div class="main-div container-fluid">
    <h5>Search player</h5>
    <div class="container-fluid d-flex flex-wrap gap-3 m-3 justify-content-center cards-div"></div>
  </div>
  <div class="main-div container-fluid">
    <div class="row m-2">
      <div class="col-sm-4">
        <div class="won-tie-lost-div lighter d-flex justify-content-center p-3"></div>
      </div>
      <div class="col-sm-4">
        <div class="goal-involvement-div lighter d-flex justify-content-center p-3"></div>
      </div>
        <div class="col-sm-4">
        <div class="sporthall-div lighter d-flex justify-content-center  p-3"></div>
      </div>
    </div>
    <div class="row m-2 mt-3">
      <div class="col-sm-12">
        <div class="teammates-div lighter p-2"></div>
      </div>
    </div>
    <div class="row m-2 mt-3">
      <div class="col-sm-12">
        <div class="bar-chart-div lighter p-2"></div>
      </div>
    </div>
  </div>
</div>`
  )
  return template.firstElementChild as HTMLDivElement
}

class PlayerDetailedView {
  static instance = new PlayerDetailedView()

  readonly container: HTMLDivElement
  title: HTMLHeadingElement
  public focusedCard: PlayerSelectionCard
  cardsDiv: HTMLDivElement
  wonTieLostDiv: HTMLDivElement
  goalInvolvementDiv: HTMLDivElement
  sporthallDiv: HTMLDivElement
  teammatesDiv: HTMLDivElement
  barChartDiv: HTMLDivElement

  private constructor() {
    this.container = createContainer();
    this.cardsDiv = this.container.querySelector("div.cards-div")

    const div = createSearchPlayerDiv((player: Player) => this.addPlayer(player))
    this.cardsDiv.insertAdjacentElement('beforebegin', div)
    this.wonTieLostDiv = this.container.querySelector("div.won-tie-lost-div")
    this.goalInvolvementDiv = this.container.querySelector("div.goal-involvement-div")
    this.sporthallDiv = this.container.querySelector("div.sporthall-div")
    this.teammatesDiv = this.container.querySelector("div.teammates-div")
    this.barChartDiv = this.container.querySelector("div.bar-chart-div")
  }

  addPlayer(player: Player) {
    const card = createPlayerSelectionCard(player)

    card.addEventListener("click", async () => {
      const currentFocusedCard = PlayerDetailedView.instance.focusedCard
      if (currentFocusedCard != null && currentFocusedCard.player.id != player.id) {
        PlayerDetailedView.instance.focusedCard.unselect()
      }
      if (currentFocusedCard == null || currentFocusedCard.player.id != player.id) {
        PlayerDetailedView.instance.focusedCard = card
        card.select()
        const gameCollection = await GameCollection.loadPlayerGameCollection(card.player)
        const stats = gameCollection.computeStats()
        this.#createWonTieLostChart(card.player, stats)
        this.#createGoalInvolvementChart(card.player, stats)
        this.#createSporthallChart(card.player, gameCollection)
        this.#createTeammatesChart(card.player, stats)
        this.#createStatsChart(card.player)
      }
    })
    this.cardsDiv.appendChild(card)
  }

  #createWonTieLostChart(player: Player, stats: Stats): Chart {
    this.wonTieLostDiv.childNodes.forEach(element => element.remove());
    const canvas = document.createElement("canvas")
    this.wonTieLostDiv.appendChild(canvas)
  
    const title = `${roundNumber(100 * stats.won / stats.gamesPlayed)} % of games won`
    return createDoughnutChart(canvas, ["Won", "Tie", "Lost"], [stats.won, stats.tie, stats.lost], title)
  }

  #createGoalInvolvementChart(player: Player, stats: Stats): Chart {
    this.goalInvolvementDiv.innerHTML = "";
    const canvas = document.createElement("canvas")
    this.goalInvolvementDiv.appendChild(canvas)

    const participationRateInGoals = roundNumber(stats.goalsInvolvementRate * 100)
    const title = `Direct involvement in ${participationRateInGoals} % of goals`
    return createDoughnutChart(canvas, ["Goals", "Assists", "Goals not involved"], [stats.goals, stats.assists, stats.goalsByTeam - (stats.goals + stats.assists)], title)
  }

  #createSporthallChart(player: Player, gameCollection: GameCollection) {
    this.sporthallDiv.innerHTML = "";
    const canvas = document.createElement("canvas")
    this.sporthallDiv.appendChild(canvas)
    const map = gameCollection.getSportHallsCount()
    const chart = createDoughnutChart(canvas, Array.from(map.keys()), Array.from(map.values()), "Sporthalls")
    chart.options.plugins.legend.display = false
    chart.update()
  }

  async #createTeammatesChart(player: Player, stats: Stats) {
    this.teammatesDiv.innerHTML = "";
    const spinner = new Spinner()
    this.teammatesDiv.appendChild(spinner.container)
    const playerCount = await getPlayerCount(player, Math.round(stats.gamesPlayed * 0.2))
    const canvas = createPolarAreaChart(player, playerCount)
    spinner.hide()
    this.teammatesDiv.appendChild(canvas)
  }

  async #createStatsChart(player: Player) {
    this.barChartDiv.innerHTML = ""
    const chartContainer = new ChartContainer([player]);
    this.barChartDiv.appendChild(chartContainer.div)
    chartContainer.removeDeleteButton()
    await chartContainer.display()
  }
}

async function getPlayerCount(player: Player, threshold: number): Promise<Record<string, number>> {
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
  return playerCount
}

function createPolarAreaChart(player: Player, playerCount: Record<string, number>): HTMLCanvasElement {
  const canvas = document.createElement("canvas")
  const chart = new Chart(canvas , {
    type: "polarArea", 
    data: {
      labels: Array.from(Object.keys(playerCount)),
      datasets: [{
        data: Array.from(Object.values(playerCount))
      }]
    }, 
    options: getPolarOptions("Most frequent teammates")
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


export { PlayerDetailedView }