import { type CompetitionLevel, GameCollection, type Stats } from "../model/game.js"
import type { Player } from "../model/player.js";
import { Season } from "../model/season.js";
import { type ChartOptions, Chart} from "chart.js/auto";
import ChartDataLabels from "chartjs-plugin-datalabels";

Chart.register(ChartDataLabels);


const absoluteStatFunctions: {[key: string]: (p: Stats) => number} = {
  "Games played": p => p.games_played,
  "Goals": p => p.goals,
  "Assists": p => p.assists,
  "Faults": p => p.faults,
  "Won": p => p.won,
  "Lost": p => p.lost,
  "Tie": p => p.tie
}


const ratioStatFunction:{[key: string]: (p: Stats) => number} = {
  "Games played": p => p.games_played == 0 ? 0 : 1,
  "Goals": p => p.games_played == 0 ? 0 : p.goals / p.games_played,
  "Assists": p => p.games_played == 0 ? 0 : p.assists / p.games_played,
  "Faults": p => p.games_played == 0 ? 0 : p.faults / p.games_played,
  "Won": p => p.games_played == 0 ? 0 : p.won / p.games_played,
  "Lost": p => p.games_played == 0 ? 0 : p.lost / p.games_played,
  "Tie": p => p.games_played == 0 ? 0 : p.tie / p.games_played
}

const colors: {[key: string]: string} = {
  "Games played": "rgba(54, 162, 235, 0.5)",
  "Goals": "rgba(7, 130, 7, 0.5)",
  "Assists": "rgba(230, 197, 12, 0.5)",
  "Faults": "rgba(236, 2, 2, 0.5)",
  "Won": "rgba(7, 130, 7, 0.5)",
  "Lost": "rgba(236, 10, 10, 0.5)",
  "Tie": "rgba(54, 162, 235, 0.5)"
}

class ChartContainer {
  static nextId = 0;

  id: number
  title: string
  div: HTMLDivElement
  canvas: HTMLCanvasElement
  loadSpinner: HTMLDivElement
  chart!: Chart

  constructor(readonly parent: HTMLElement, readonly players: Array<Player>) {
    this.id = ChartContainer.#getNextId()
    this.title = this.players.slice(0, Math.min(3, this.players.length)).map(p => p.getNameFormatted()).join(", ") + (3 >= this.players.length ? "" : ", ...")
    this.init()
  }

  static #getNextId(): number {
    this.nextId += 1
    return this.nextId
  }

  init() {
    this.div = document.createElement("div")
    // this.div.classList.add("chart-container")
    this.div.classList.add("container-fluid")
    this.div.classList.add("my-3")

    this.parent.appendChild(this.div)
    
    this.div.insertAdjacentHTML("beforeend", `
      <div class="row">
        <div id="main-parameters-div-${this.id}" class="col-10 d-flex flex-wrap flex-row gap-2 align-self-start">
          <div class="btn-group" role="group" aria-label="Basic radio toggle button group">
            <input type="radio" id="stats-btn-${this.id}" class="btn-check" name="btnradio${this.id}" autocomplete="off" checked/>
            <label class="btn btn-outline-primary" for="stats-btn-${this.id}">Stats</label>
            <input type="radio" id="won-tie-lost-btn-${this.id}" class="btn-check" name="btnradio${this.id}" autocomplete="off"/>
            <label class="btn btn-outline-primary" for="won-tie-lost-btn-${this.id}">Won, tie, lost</label>
          </div>
          <div class="btn-group" role="group" aria-label="Basic radio toggle button group">
            <input type="checkbox" class="btn-check" id="ratio-checkbox-${this.id}" autocomplete="off">
            <label class="btn btn-outline-success" for="ratio-checkbox-${this.id}">Ratios</label>
          </div>
          <div id="subparams" class="btn-group flex-wrap" role="group" aria-label="Basic checkbox toggle button group">
            <input type="checkbox" class="btn-check" name="games_played" id="games-played-checkbox-${this.id}" checked autocomplete="off"/>
            <label class="btn btn-outline-success" for="games-played-checkbox-${this.id}">Games played</label>
            <input type="checkbox" class="btn-check" name="goals" id="goals-checkbox-${this.id}" checked autocomplete="off"/>
            <label class="btn btn-outline-success" for="goals-checkbox-${this.id}">Goals</label>
            <input type="checkbox" class="btn-check" name="assists" id="assists-checkbox-${this.id}" checked autocomplete="off"/>
            <label class="btn btn-outline-success" for="assists-checkbox-${this.id}">Assists</label>
            <input type="checkbox"  class="btn-check" name="faults" id="faults-checkbox-${this.id}" checked autocomplete="off"/>
            <label class="btn btn-outline-success" for="faults-checkbox-${this.id}">Faults</label>
          </div>
        </div>
        <div class="col-2 d-flex justify-content-end align-self-end">
          <button class="btn btn-danger align-self-end d-none d-lg-block" id="delete-btn-${this.id}">Delete chart</button>
        </div>
      </div>
    `);

    if ((this.players.length == 1)) {
      this.div.querySelector(`#main-parameters-div-${this.id}`).insertAdjacentHTML('beforeend',`
        <div class="btn-group" role="group" aria-label="Basic radio toggle button group">
          <input type="radio" id="group-season-btn-${this.id}" class="btn-check" name="grouping-radio${this.id}" autocomplete="off" checked/>
          <label class="btn btn-outline-primary" for="group-season-btn-${this.id}">Group by season</label>
          <input type="radio" id="group-tournament-btn-${this.id}" class="btn-check" name="grouping-radio${this.id}" autocomplete="off"/>
          <label class="btn btn-outline-primary" for="group-tournament-btn-${this.id}">Group by tournament</label>
        </div>`
      )
    }
    else {
      this.div.querySelector(`#main-parameters-div-${this.id}`).insertAdjacentHTML('beforeend',`
        <div class="gap-2 d-inline-flex flex-row" id="season-filter-group-${this.id}">
          <input type="checkbox" class="btn-check" id="season-checkbox-${this.id}" autocomplete="off">
          <label class="btn btn-outline-success" for="season-checkbox-${this.id}">Filter by season</label>
          <div>
            <select class="form-select" id="season-select-${this.id}" style="display: none"></select>
          </div>
        </div>`
      )

      const seasonSelect: HTMLSelectElement = this.div.querySelector(`#season-select-${this.id}`)
      const seasonCheckbox: HTMLInputElement = this.div.querySelector(`#season-checkbox-${this.id}`)

      seasonCheckbox.addEventListener("click", async () => {
        seasonSelect.style.display = seasonCheckbox.checked ? "block" : "none"
        const seasons = await this.#getDistinctSeasons()
        fillSelect(seasonSelect, Array.from(seasons).toSorted(Season.compare))
      })
      seasonSelect.addEventListener("change", () => this.display())
    }

    this.div.insertAdjacentHTML('beforeend', `
      <div class="d-flex justify-content-center">
        <div class="spinner-border" id="load-spinner-${this.id}" role="status" style="width: 3rem; height: 3rem;">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>`
    )

    this.loadSpinner = this.div.querySelector(`#load-spinner-${this.id}`)
    this.loadSpinner.style.display = "none"

    this.canvas = document.createElement("canvas")
    this.chart = new Chart(this.canvas , {
      type: "bar", data: { datasets: []}
    })
    this.div.appendChild(this.canvas)

    this.div.querySelectorAll("input").forEach(e => e.addEventListener("change", () => this.display()));
    this.div.querySelector(`#delete-btn-${this.id}`).addEventListener("click", () => this.parent.remove())
  }

  async #getPlayersStats(filterSeason: Season, groupingCriterion: CompetitionLevel) {
    const playersGames = await Promise.all(this.players.map(async p => (await GameCollection.loadPlayerGameCollection(p))))
    if (filterSeason != null) 
      return playersGames.map(gc => gc.filterOnSeason(filterSeason)).map(gc => [gc.player, gc.computeStats()])

    if (this.players.length == 1 && groupingCriterion != null) 
      return playersGames[0].getStatsGroupedBy(groupingCriterion)
    
    return playersGames.map(gc => [gc.player, gc.computeStats()])
  }

  async #getDistinctSeasons(): Promise<Set<Season>> {
    const allGames = await Promise.all(this.players.map(async p => (await GameCollection.loadPlayerGameCollection(p))))
    return new Set(allGames.flatMap(gc => Array.from(gc.getDistinctSeasons())))
  }

  async display() {
    this.loadSpinner.style.display = "block"

    var displayWonTieLost = !(document.getElementById(`stats-btn-${this.id}`) as HTMLInputElement).checked;
    const subparams = this.div.querySelector("#subparams") as HTMLDivElement
    var statsToDisplay: Array<string> = [];
    (document.getElementById(`games-played-checkbox-${this.id}`) as HTMLInputElement).disabled = false
    if (!displayWonTieLost) {
      subparams.removeAttribute("style")
      if ((document.getElementById(`games-played-checkbox-${this.id}`) as HTMLInputElement).checked)
        statsToDisplay.push("Games played")
      if ((document.getElementById(`goals-checkbox-${this.id}`) as HTMLInputElement).checked)
        statsToDisplay.push("Goals")
      if ((document.getElementById(`assists-checkbox-${this.id}`) as HTMLInputElement).checked)
        statsToDisplay.push("Assists")
      if ((document.getElementById(`faults-checkbox-${this.id}`) as HTMLInputElement).checked)
        statsToDisplay.push("Faults")
    } else {
      subparams.style.display = "none"
      statsToDisplay = ["Lost", "Tie", "Won"]
    }

    const ratioCheckbox = this.div.querySelector(`#ratio-checkbox-${this.id}`) as HTMLInputElement
    const statFunctions = ratioCheckbox.checked ? ratioStatFunction : absoluteStatFunctions

    
    const seasonFilter = (this.players.length != 1 && (this.div.querySelector(`#season-checkbox-${this.id}`) as HTMLInputElement).checked) 
      ? await Season.getSeasonById(parseInt((this.div.querySelector(`#season-select-${this.id}`) as HTMLSelectElement).value)) 
      : null 

    const groupingKey = this.players.length == 1
      ? ((this.div.querySelector(`#group-season-btn-${this.id}`) as HTMLInputElement).checked ? "SEASON" : "TOURNAMENT")
      : null
    const playersStats = await this.#getPlayersStats(seasonFilter, groupingKey)
    
    const sortedStats = this.players.length != 1
      ? playersStats.sort((a1, a2) => a1[1].games_played - a2[1].games_played)
      : playersStats.sort((a1, a2) => a1[1].startDate - a2[1].startDate)
    
    var chartInput: ChartInput = {
      xLabels: sortedStats.map(([p, _]) => p.getNameFormatted()),
      stats: Object.fromEntries(statsToDisplay.map(statType => [statType, sortedStats.map(([_, stats]) => statFunctions[statType](stats))]))
    }

    let datasets = convertChartInputStatsToDataset(chartInput.stats)
    // datasets.push({
    //   label: 'Dataset 2',
    //   data: Array(this.players.length).fill(1),
    //   backgroundColor: "blue",
    //   borderColor: "blue",
    //   borderWidth: .5,
    //   pointRadius: Array(this.players.length).fill(0),
    //   type: 'line',
    //   order: 0,
    //   datalabels: {
    //     labels: {
    //       title: null
    //     }

    //   }
    // })

    this.chart.data = {
      labels: chartInput.xLabels,
      datasets: datasets
    }

    this.chart.options = displayWonTieLost ? getStackedBarChartOptions(this.title) : getGroupedBarChartOptions(this.title);
    this.chart.update()
    this.loadSpinner.style.display = "none"
  }

}

interface ChartInput {
  xLabels: Array<string>
  stats: {
    [key: string]: Array<number>
  }
}

function convertChartInputStatsToDataset(stats: {[key: string]: Array<number>}) {
return Array.from(
  Object.entries(stats).map(([stat_type, stat_array]) => {
    return {
      label: stat_type,
      backgroundColor: colors[stat_type],
      // borderColor: "red",
      // borderWidth: 1,
      data: stat_array
    }
  }))
}

function roundNumber(number: number) {
  return Math.round(number * 100 + Number.EPSILON ) / 100
}

function getCommonBarChartOptions(title: string): ChartOptions {
  return {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: "top"
      },
      title: {
        display: title != null,
        text: title
      },
      datalabels: {
        anchor: "center", // Position of the labels (start, end, center, etc.)
        align: "center", // Alignment of the labels (start, end, center, etc.)
        // color: 'blue', // Color of the labels
        // font: {
        //     weight: 'bold',
        // },
        formatter: function (value: number, context: any) {
          return value == 0 ? "" : roundNumber(value); // Display the actual data value
        },
      },
    }
  }
}

function getGroupedBarChartOptions(title: string): ChartOptions {
  return {
    scales: {
      x: {
        ticks: {
          font: {
            weight: "bold",
          },
        },
      }
    },
    ...getCommonBarChartOptions(title)
  }
} 

function getStackedBarChartOptions(title: string): ChartOptions {
  return {
    scales: {
      x: {
        stacked: true,
        ticks: {
          font: {
            weight: "bold",
          },
        },
      },
      y: {
        stacked: true,
        beginAtZero: true,
      },
    },
    ...getCommonBarChartOptions(title)
  }
}

function fillSelect(select: HTMLSelectElement, values: Array<any>) {
  select.querySelectorAll("option").forEach(e => e.remove())
  for (const elt of values) {
    const opt = document.createElement("option");
    opt.value = elt["id"]
    opt.textContent = elt["name"];
    select.appendChild(opt);
  }
}


export { ChartInput, ChartContainer, fillSelect };
