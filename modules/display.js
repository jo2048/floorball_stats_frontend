import { GameCollection } from "./game.js"

Chart.register(ChartDataLabels);


const statFunctions = {
  "Games played": p => p.games_played,
  "Goals": p => p.goals,
  "Assists": p => p.assists,
  "Faults": p => p.faults,
  "Goal by match": p => p.goals_ratio,
  "Assist by match": p => p.assists_ratio,
  "Faults by match": p => p.faults_ratio,
  "Won": p => p.won,
  "Lost": p => p.lost,
  "Tie": p => p.tie
}



class ChartContainer {
  static nextId = 0;

  constructor(parent, players) {
    this.id = ChartContainer.#getNextId()
    this.parent = parent
    this.players = players
    this.groupBy = "Player" 
    this.playersStats = null
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
    this.div.appendChild(this.canvas)

    const summary = document.createElement("summary")
    summary.innerHTML = "Chart parameters"
    details.appendChild(summary)

    // Template literals
    details.insertAdjacentHTML("beforeend", `
      <div class="chart-container">
        <fieldset>
          <div class="btn-group" role="group" aria-label="Basic radio toggle button group">
            <input type="radio" id="stats-btn-${this.id}" class="btn-check" name="btnradio" autocomplete="off" checked>
            <label class="btn btn-outline-primary" for="stats-btn-${this.id}">Stats</label>
            <input type="radio" id="stats-ratios-btn-${this.id}" class="btn-check" name="btnradio" autocomplete="off">
            <label class="btn btn-outline-primary" for="stats-ratios-btn-${this.id}">Stats ratios</label>
            <input type="radio" id="won-tie-lost-btn-${this.id}" class="btn-check" name="btnradio" autocomplete="off">
            <label class="btn btn-outline-primary" for="won-tie-lost-btn-${this.id}">Won, tie, lost</label>
          </div>
          <div>
            <span>
              <input type="checkbox" name="games_played" id="games-played-checkbox-${this.id}" checked/>
              <label for="games-played-checkbox-${this.id}">Total games played</label>
            </span>        
            <span>
              <input type="checkbox" name="goals" id="goals-checkbox-${this.id}" checked/>
              <label for="goals-checkbox-${this.id}">Goals</label>
            </span>
            <span>
              <input type="checkbox" name="assists" id="assits-checkbox-${this.id}" checked/>
              <label for"assits-checkbox-${this.id}"=>Assists</label>
            </span>
            <span>
              <input type="checkbox" name="faults" id="faults-checkbox-${this.id}" checked />
              <label for="faults-checkbox-${this.id}">Faults</label>
            </span>
          </div>
        </fieldset>        
    `);
    
    
    this.div.querySelectorAll("input").forEach(e => e.addEventListener("click", () => this.display()));
    this.parent.appendChild(this.div)
  }

            // <div>
          //   <label>Select season</label>
          //   <select name="seasons" id="seasonSelect"></select>
          // </div>
          // <div>
          //   <label>Filter on</label>
          // </div>
          // <div>
          //   <label>Group by</label>
          //   <select name="groupBy" id="groupBySelect">
          //     <option value="Season">Season</option>
          //     <option value="Competition">Competition</option>
          //   </select>
          // </div>

  #clearCanvas() {
    if (this.chart)
      this.chart.destroy()
  }

  async #getPlayerStats() {
    if (this.playersStats == null) {
      const playerGames = await Promise.all(this.players.map(async p => (await GameCollection.loadPlayerGameCollection(p))))
      this.playersStats = playerGames.map(gc => [gc.player, gc.computeStats()])
    }
    return this.playersStats
  }

  async display() {
    this.#clearCanvas()

    var title = "Stats by player"
    var wonTieLost = false
    var statsToDisplay = []
    document.getElementById(`games-played-checkbox-${this.id}`).disabled = false
    if (document.getElementById(`stats-btn-${this.id}`).checked) {
      statsToDisplay = []
      if (document.getElementById(`games-played-checkbox-${this.id}`).checked)
        statsToDisplay.push("Games played")
      statsToDisplay.push("Goals")
      statsToDisplay.push("Assists")
      statsToDisplay.push("Faults")
    } else if (document.getElementById(`stats-ratios-btn-${this.id}`).checked) {
      document.getElementById(`games-played-checkbox-${this.id}`).checked = false
      document.getElementById(`games-played-checkbox-${this.id}`).disabled = true
      statsToDisplay = ["Goal by match", "Assist by match", "Faults by match"]
    } else {
      title = "Won, tie, lost by player"
      wonTieLost = true
      statsToDisplay = ["Won", "Tie", "Lost"]
    }

    const playersStats = await this.#getPlayerStats()
    const sortedPlayers = playersStats.sort((a1, a2) => a1[1].games_played - a2[1].games_played)

    const chartInput = new ChartInput(
      title,
      sortedPlayers.map(([p, _]) => p.getNameFormatted()),
      Object.fromEntries(statsToDisplay.map(statType => [statType, sortedPlayers.map(([_, stats]) => statFunctions[statType](stats))]))      
    )

    if(wonTieLost)
      this.chart = drawStackedBarChart(this.canvas, chartInput)
    else
      this.chart = drawGroupedBarChart(this.canvas, chartInput)
  }

}


const plugins = {
  legend: {
    display: true,
  },
  datalabels: {
    anchor: "center", // Position of the labels (start, end, center, etc.)
    align: "center", // Alignment of the labels (start, end, center, etc.)
    // color: 'blue', // Color of the labels
    // font: {
    //     weight: 'bold',
    // },
    formatter: function (value, context) {
      return value == 0 ? "" : value; // Display the actual data value
    },
  },
};

function drawStackedBarChart(ctx, chartInput) {
  return new Chart(ctx, {
    type: "bar",
    data: {
      labels: chartInput.x_labels,
      datasets: convertChartInputStatsToDataset(chartInput.stats)
    },
    options: {
      responsive: true,
      legend: {
        position: "top",
      },
      plugins: {
        title: {
          display: true,
          text: chartInput.title,
        }
      },
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
      plugins: plugins,
    },
  });
}

class ChartInput {
  constructor(title, x_labels, stats) {
    if (!title || !x_labels || !stats)
      throw new Error("Invalid arguments for ChartInput")
    this.title = title
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
  })
)
}


function drawGroupedBarChart(ctx, chartInput) {
  let barChartData = {
    labels: chartInput.x_labels,
    datasets: convertChartInputStatsToDataset(chartInput.stats)
  };

  let chartOptions = {
    responsive: true,
    legend: {
      position: "top",
    },
    title: {
      display: true,
      text: chartInput.title,
    },
    scales: {
      x: {
        ticks: {
          font: {
            weight: "bold",
          },
        },
      },
      yAxes: [
        {
          ticks: {
            beginAtZero: true,
          },
        },
      ],
    },
  };

  return new Chart(ctx, {
    type: "bar",
    data: barChartData,
    options: chartOptions,
    plugins: plugins,
  });
}

export { drawStackedBarChart, drawGroupedBarChart, ChartInput, ChartContainer };
