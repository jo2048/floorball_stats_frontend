import { initPage } from "./view/player_selection.js";
import { Config } from "./view/config.js";
import { Chart } from "chart.js/auto";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { PlayerCardsView } from "./view/player_cards_view.js";
import { configTooltips } from "./view/utils.js";
import { CompareTeamsView } from "./view/compare_teams_view.js";
import { PlayerDetailedView } from "./view/player_detailed_view.js";

// CONFIG TOOLTIPS
configTooltips()

// CONFIG CHARTJS
Chart.register(ChartDataLabels);


// UPDATE LABELS DEPENDING ON CONFIG
Array.from(document.getElementsByClassName("main-title")).forEach(element => {
  const textChildNode = Array.from(element.childNodes.values())
    .findLast((child: HTMLElement) => child.nodeType === Node.TEXT_NODE);
  textChildNode.textContent = Config.getInstance().title
});

Array.from(document.getElementsByClassName("source-site-link")).forEach((element: HTMLLinkElement) => {
  element.setAttribute("href", Config.getInstance().originalSiteUrl)
  element.innerText = Config.getInstance().originalSiteName
})


// SETUP NAVBAR TO CHANGE VIEW
const main = document.getElementsByTagName("main")[0]
const homeView = document.getElementById("home-view")
let focusedView = homeView

function setFocusedView(view: HTMLElement) {
  if (focusedView !== view) {
    main.removeChild(focusedView)
    focusedView = view
    main.appendChild(focusedView)
  }
} 

document.getElementById("home-view-link").addEventListener("click", () => setFocusedView(homeView))

document.getElementById("player-cards-view-link").addEventListener("click", () => setFocusedView(PlayerCardsView.container))

document.getElementById("player-detailed-view-link").addEventListener("click", () => setFocusedView(PlayerDetailedView.instance.container))

CompareTeamsView.instance.init()
document.getElementById("compare-teams-view-link").addEventListener("click", () => setFocusedView(CompareTeamsView.instance.container))

await initPage();