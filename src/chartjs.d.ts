export * from 'chart.js/auto'

declare module 'chart.js/auto' {
  interface TooltipPositionerMap {
    chartCenter: TooltipPositionerFunction<ChartType>;
  }
}
