import { PlayerGame } from "./game.js";

Chart.register(ChartDataLabels);

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
  new Chart(ctx, {
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

  window.myBar = new Chart(ctx, {
    type: "bar",
    data: barChartData,
    options: chartOptions,
    plugins: plugins,
  });
}

export { drawStackedBarChart, drawGroupedBarChart, ChartInput };
