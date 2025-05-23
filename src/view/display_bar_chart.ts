import { type ChartOptions } from "chart.js/auto";
import { COLORS } from "./config.js";
import { roundNumber } from "./utils.js";

interface ChartInput {
  xLabels: Array<string>;
  stats: {
    [key: string]: Array<number>;
  };
}

class BarChartInput implements ChartInput {
  constructor(readonly xLabels: string[], readonly stats: { [key: string]: number[]; }) {}

  getDataset(): Array<any> {
    return Array.from(
      Object.entries(this.stats).map(([stat_type, stat_array]) => {
        return {
          label: stat_type,
          backgroundColor: COLORS[stat_type],
          // borderColor: "red",
          // borderWidth: 1,
          data: stat_array,
        };
      })
    );
  }
}

function getCommonBarChartOptions(title: string, displayLegend: boolean): ChartOptions {
  return {
    responsive: true,
    plugins: {
      legend: {
        display: displayLegend,
        position: "top",
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
        formatter: function (value: number, context: any): string {
          return value == 0 ? "" : roundNumber(value).toString();
        },
      },
    },
  };
}

function getGroupedBarChartOptions(title: string, displayLegend=true): ChartOptions {
  return {
    scales: {
      x: {
        ticks: {
          font: {
            weight: "bold",
          },
        },
      },
    },
    ...getCommonBarChartOptions(title, displayLegend),
  };
}

function getStackedBarChartOptions(title: string, displayLegend=true): ChartOptions {
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
    ...getCommonBarChartOptions(title, displayLegend),
  };
}

export { getGroupedBarChartOptions, getStackedBarChartOptions, BarChartInput}