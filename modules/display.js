import { GameCollection } from "./game.js"

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
  "Games played": p => 1,
  "Goals": p => p.goals / p.games_played,
  "Assists": p => p.assists / p.games_played,
  "Faults": p => p.faults / p.games_played,
  "Won": p => p.won / p.games_played,
  "Lost": p => p.lost / p.games_played,
  "Tie": p => p.tie / p.games_played
}

class ChartContainer {
  static nextId = 0;

  constructor(parent, players, sortedSeasons) {
    this.id = ChartContainer.#getNextId()
    this.sortedSeasons = sortedSeasons
    this.parent = parent
    this.players = players
    this.groupBy = "Player"
    this.playersGames = null
    this.title = this.players.length == 1 ? "Stats " + this.players[0].getNameFormatted() : null
    this.init()
  }

  static #getNextId() {
    this.nextId += 1
    return this.nextId
  }

  init() {
    this.div = document.createElement("div")
    this.div.classList.add("chart-container")
    const details = document.createElement("details")
    this.div.appendChild(details)
    this.canvas = document.createElement("canvas")
    this.chart = new Chart(this.canvas , {
      type: "bar"
    })
    this.div.appendChild(this.canvas)

    const summary = document.createElement("summary")
    summary.innerHTML = "Chart parameters"
    details.appendChild(summary)

    // Template literals
    details.insertAdjacentHTML("beforeend", `
      <div class="container-fluid">
        <div class="row">
          <div class="btn-group col" role="group" aria-label="Basic radio toggle button group">
            <input type="radio" id="stats-btn-${this.id}" class="btn-check" name="btnradio" autocomplete="off" checked>
            <label class="btn btn-outline-primary" for="stats-btn-${this.id}">Stats</label>
            <input type="radio" id="won-tie-lost-btn-${this.id}" class="btn-check" name="btnradio" autocomplete="off">
            <label class="btn btn-outline-primary" for="won-tie-lost-btn-${this.id}">Won, tie, lost</label>
          </div>
          <div class="form-check col form-switch">
            <input class="form-check-input" type="checkbox" id="ratioCheckbox-${this.id}">
            <label class="form-check-label" for="ratioCheckbox-${this.id}">Ratios</label>
          </div>
          <div class="col column-gap-2 d-flex flex-row justify-content-end">
            <button class="btn btn-warning" id="hide-btn-${this.id}">Hide chart</button>
            <button class="btn btn-danger" id="delete-btn-${this.id}">Delete chart</button>
          </div>
        </div>
        <div class="column-gap-2 d-inline-flex flex-row mt-2" id="season-filter-group-${this.id}">
          <div class="btn-group" role="group" aria-label="Button group with nested dropdown">
            <input type="checkbox" class="btn-check" id="season-checkbox-${this.id}" autocomplete="off">
            <label class="btn btn-outline-primary" for="season-checkbox-${this.id}">Filter on season</label>
            <div>
              <select class="form-select" id="season-select-${this.id}" style="display: none"></select>
            </div>
          </div>    

        </div>
        <div id="subparams" class="checkbox-group g-2 mt-2">
          <span id="games-played-span-${this.id}">
            <input type="checkbox" name="games_played" id="games-played-checkbox-${this.id}" checked/>
            <label for="games-played-checkbox-${this.id}">Total games played</label>
          </span>        
          <span>
            <input type="checkbox" name="goals" id="goals-checkbox-${this.id}" checked/>
            <label for="goals-checkbox-${this.id}">Goals</label>
          </span>
          <span>
            <input type="checkbox" name="assists" id="assists-checkbox-${this.id}" checked/>
            <label for"assits-checkbox-${this.id}"=>Assists</label>
          </span>
          <span>
            <input type="checkbox" name="faults" id="faults-checkbox-${this.id}" checked />
            <label for="faults-checkbox-${this.id}">Faults</label>
          </span>
        </div>
      </div>     
    `);

    if ((this.players.length == 1))
      this.div.querySelector(`#season-filter-group-${this.id}`).remove()
    else {
      const seasonSelect = this.div.querySelector(`#season-select-${this.id}`)
      fillSelect(seasonSelect, this.sortedSeasons)
  
      this.div.querySelector(`#season-checkbox-${this.id}`).addEventListener("click", () => {
        console.log( this.div.querySelector(`#season-checkbox-${this.id}`).checked)
        seasonSelect.style.display = this.div.querySelector(`#season-checkbox-${this.id}`).checked ? "block" : "none"
      })

      seasonSelect.addEventListener("change", () => {

      })
    }

    this.div.querySelectorAll("input").forEach(e => e.addEventListener("click", () => this.display()));
    const hideButton = details.querySelector(`#hide-btn-${this.id}`)
    hideButton.addEventListener("click", () => {
      if (this.canvas.style.display == "block") {
        this.canvas.style.display = "none"
        hideButton.textContent = "Display chart"
      }
      else {
        this.canvas.style.display = "block"
        hideButton.textContent = "Hide chart"
      }

    })
    details.querySelector(`#delete-btn-${this.id}`).addEventListener("click", () => this.div.remove())
    this.parent.appendChild(this.div)
  }

  async #getPlayersStats() {
    if (this.playersStats == null) {
      const playersGames = await Promise.all(this.players.map(async p => (await GameCollection.loadPlayerGameCollection(p))))
      this.playersStats = this.players.length == 1 
        ? playersGames[0].getStatsGroupedBy("SEASON")
        : playersGames.map(gc => [gc.player, gc.computeStats()]);
    }
    return this.playersStats
  }

  async display() {
    var wonTieLost = false
    var statsToDisplay = []
    document.getElementById(`games-played-checkbox-${this.id}`).disabled = false
    if (document.getElementById(`stats-btn-${this.id}`).checked) {
      this.div.querySelector("#subparams").removeAttribute("style")
      document.getElementById(`games-played-span-${this.id}`).removeAttribute("style")
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
      wonTieLost = true
      statsToDisplay = ["Won", "Tie", "Lost"]
    }

    const statFunctions = document.getElementById(`ratioCheckbox-${this.id}`).checked ? ratioStatFunction : absoluteStatFunctions

    const playersStats = await this.#getPlayersStats()
    
    const sortedStats = this.players.length != 1
      ? playersStats.sort((a1, a2) => a1[1].games_played - a2[1].games_played)
      : playersStats.sort((a1, a2) => a1[1].startDate - a2[1].startDate)

    
    var chartInput = new ChartInput(
      sortedStats.map(([p, _]) => p.getNameFormatted()),
      Object.fromEntries(statsToDisplay.map(statType => [statType, sortedStats.map(([_, stats]) => statFunctions[statType](stats))]))
    )

    this.chart.data = {
      labels: chartInput.x_labels,
      datasets: convertChartInputStatsToDataset(chartInput.stats)
    }

    if(wonTieLost) 
      this.chart.options = getStackedBarChartOptions(this.title);
    else
      this.chart.options = getGroupedBarChartOptions(this.title);

    this.chart.update()
  }

}

class ChartInput {
  constructor(x_labels, stats) {
    if (!x_labels || !stats)
      throw new Error("Invalid arguments for ChartInput")
    this.x_labels = x_labels
    this.stats = stats
    /*
      title = "title"
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
      // backgroundColor: "pink",
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
