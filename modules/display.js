import { GameCollection } from "./game.js"
import { Season } from "./season.js";

Chart.register(ChartDataLabels);


const absoluteStatFunctions = {
  "Games played": p => p.games_played,
  "Goals": p => p.goals,
  "Assists": p => p.assists,
  "Faults": p => p.faults,
  "Won": p => p.won,
  "Lost": p => p.lost,
  "Tie": p => p.tie
}

const ratioStatFunction = {
  "Games played": p => p.games_played == 0 ? 0 : 1,
  "Goals": p => p.games_played == 0 ? 0 : p.goals / p.games_played,
  "Assists": p => p.games_played == 0 ? 0 : p.assists / p.games_played,
  "Faults": p => p.games_played == 0 ? 0 : p.faults / p.games_played,
  "Won": p => p.games_played == 0 ? 0 : p.won / p.games_played,
  "Lost": p => p.games_played == 0 ? 0 : p.lost / p.games_played,
  "Tie": p => p.games_played == 0 ? 0 : p.tie / p.games_played
}

const colors = {
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

  constructor(parent, players, sortedSeasons) {
    this.id = ChartContainer.#getNextId()
    this.sortedSeasons = sortedSeasons
    this.parent = parent
    this.players = players
    this.title = this.players.slice(0, Math.min(3, this.players.length)).map(p => p.getNameFormatted()).join(", ") + (3 >= this.players.length ? "" : ", ...")
    this.init()
  }

  static #getNextId() {
    this.nextId += 1
    return this.nextId
  }

  init() {
    this.div = document.createElement("details")
    this.div.classList.add("chart-container")
    this.div.setAttribute("open", true)
    const chartSummary = document.createElement("summary")
    chartSummary.textContent = this.title
    this.div.appendChild(chartSummary)
    
    this.div.insertAdjacentHTML("beforeend", `
      <div class="container-fluid my-3" id="parameters-div-${this.id}">
        <div class="row">
          <div id="main-parameters-div-${this.id}" class="col-9 d-flex flex-wrap flex-row gap-2 align-self-start">
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
          <div class="col-3 gap-2 d-flex flex-row flex-wrap justify-content-end align-self-end">
            <button class="btn btn-warning align-self-end d-md-none" id="expand-btn-${this.id}">Expand chart</button>
            <button class="btn btn-danger align-self-end" id="delete-btn-${this.id}">Delete chart</button>
          </div>
        </div>
      </div>     
    `);

    this.div.querySelector(`#expand-btn-${this.id}`).addEventListener("click", () => {
      this.div.style.minWidth = "768px"
      this.div.querySelector(`#expand-btn-${this.id}`).style.display = "none"
    })

    const parametersDiv = this.div.querySelector(`#parameters-div-${this.id}`)

    if ((this.players.length == 1)) {
      parametersDiv.querySelector(`#main-parameters-div-${this.id}`).insertAdjacentHTML('beforeend',`
        <div class="btn-group" role="group" aria-label="Basic radio toggle button group">
          <input type="radio" id="group-season-btn-${this.id}" class="btn-check" name="grouping-radio${this.id}" autocomplete="off" checked/>
          <label class="btn btn-outline-primary" for="group-season-btn-${this.id}">Group by season</label>
          <input type="radio" id="group-tournament-btn-${this.id}" class="btn-check" name="grouping-radio${this.id}" autocomplete="off"/>
          <label class="btn btn-outline-primary" for="group-tournament-btn-${this.id}">Group by tournament</label>
        </div>`
      )
    }
    else {
      parametersDiv.querySelector(`#main-parameters-div-${this.id}`).insertAdjacentHTML('beforeend',`
        <div class="gap-2 d-inline-flex flex-row" id="season-filter-group-${this.id}">
          <input type="checkbox" class="btn-check" id="season-checkbox-${this.id}" autocomplete="off">
          <label class="btn btn-outline-success" for="season-checkbox-${this.id}">Filter by season</label>
          <div>
            <select class="form-select" id="season-select-${this.id}" style="display: none"></select>
          </div>
        </div>`
      )

      const seasonSelect = parametersDiv.querySelector(`#season-select-${this.id}`)
      fillSelect(seasonSelect, this.sortedSeasons)
  
      this.div.querySelector(`#season-checkbox-${this.id}`).addEventListener("click", () => {
        seasonSelect.style.display = this.div.querySelector(`#season-checkbox-${this.id}`).checked ? "block" : "none"
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
      type: "bar"
    })
    this.div.appendChild(this.canvas)

    this.div.querySelectorAll("input").forEach(e => e.addEventListener("click", () => this.display()));
    parametersDiv.querySelector(`#delete-btn-${this.id}`).addEventListener("click", () => this.div.remove())
    this.parent.appendChild(this.div)
  }

  async #getPlayersStats(filterSeason, groupingCriterion) {
    const playersGames = await Promise.all(this.players.map(async p => (await GameCollection.loadPlayerGameCollection(p))))
    if (filterSeason != null) 
      return playersGames.map(gc => gc.filterOnSeason(filterSeason)).map(gc => [gc.player, gc.computeStats()])

    if (this.players.length == 1 && groupingCriterion != null) 
      return playersGames[0].getStatsGroupedBy(groupingCriterion)
    
    return playersGames.map(gc => [gc.player, gc.computeStats()])
  }

  async display() {
    this.loadSpinner.style.display = "block"
    this.div.scrollIntoView()

    var displayWonTieLost = !document.getElementById(`stats-btn-${this.id}`).checked
    var statsToDisplay = []
    document.getElementById(`games-played-checkbox-${this.id}`).disabled = false
    if (!displayWonTieLost) {
      this.div.querySelector("#subparams").removeAttribute("style")
      if (document.getElementById(`games-played-checkbox-${this.id}`).checked)
        statsToDisplay.push("Games played")
      if (document.getElementById(`goals-checkbox-${this.id}`).checked)
        statsToDisplay.push("Goals")
      if (document.getElementById(`assists-checkbox-${this.id}`).checked)
        statsToDisplay.push("Assists")
      if (document.getElementById(`faults-checkbox-${this.id}`).checked)
        statsToDisplay.push("Faults")
    } else {
      this.div.querySelector("#subparams").style.display = "none"
      statsToDisplay = ["Lost", "Tie", "Won"]
    }

    const statFunctions = document.getElementById(`ratio-checkbox-${this.id}`).checked ? ratioStatFunction : absoluteStatFunctions

    
    const seasonFilter = (this.players.length != 1 && this.div.querySelector(`#season-checkbox-${this.id}`).checked) 
      ? await Season.getSeasonById(this.div.querySelector(`#season-select-${this.id}`).value) 
      : null 

    const groupingKey = this.players.length == 1
      ? (this.div.querySelector(`#group-season-btn-${this.id}`).checked ? "SEASON" : "TOURNAMENT")
      : null
    const playersStats = await this.#getPlayersStats(seasonFilter, groupingKey)
    
    const sortedStats = this.players.length != 1
      ? playersStats.sort((a1, a2) => a1[1].games_played - a2[1].games_played)
      : playersStats.sort((a1, a2) => a1[1].startDate - a2[1].startDate)

    
    var chartInput = new ChartInput(
      sortedStats.map(([p, _]) => p.getNameFormatted()),
      Object.fromEntries(statsToDisplay.map(statType => [statType, sortedStats.map(([_, stats]) => statFunctions[statType](stats))]))
    )

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
      labels: chartInput.x_labels,
      datasets: datasets
    }

    this.chart.options = displayWonTieLost ? getStackedBarChartOptions(this.title) : getGroupedBarChartOptions(this.title);
    this.chart.update()
    this.loadSpinner.style.display = "none"
    this.div.scrollIntoView()
  }

}

class ChartInput {
  constructor(x_labels, stats) {
    if (!x_labels || !stats)
      throw new Error("Invalid arguments for ChartInput")
    this.x_labels = x_labels
    this.stats = stats
    /*
      x_labels = ["player 1", "player 2", "player 3", "player 4"]
      stats = {
        "Goals": [4,5,6,9],
        "Assists": [2,8,3,0]
      }
    */
  }
}

function convertChartInputStatsToDataset(stats) {
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

function roundNumber(number) {
  return Math.round(number * 100 + Number.EPSILON ) / 100
}

function getCommonBarChartOptions(title) {
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
        formatter: function (value, context) {
          return value == 0 ? "" : roundNumber(value); // Display the actual data value
        },
      },
    }
  }
}

function getGroupedBarChartOptions(title) {
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

function getStackedBarChartOptions(title) {
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

function fillSelect(select, values) {
  select.querySelectorAll("option").forEach(e => e.remove())
  for (const elt of values) {
    const opt = document.createElement("option");
    opt.value = elt["id"]
    opt.textContent = elt["name"];
    select.appendChild(opt);
  }
}


export { ChartInput, ChartContainer, fillSelect };
