import { initPage } from "./view/player_selection.js";
import { Config } from "./view/config.js";

// CONFIG TOOLTIPS
declare var bootstrap: any

const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
const _ = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))


// CONFIG CHARTJS
import { Chart } from "chart.js/auto";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { PlayerCardsView } from "./view/player_cards_view.js";

Chart.register(ChartDataLabels);


// UPDATE LABELS DEPENDING ON CONFIG
Array.from(document.getElementsByClassName("main-title")).forEach(element => {
    const textChildNode = Array.from(element.childNodes.values())
        .findLast((child: HTMLElement) => child.nodeType === Node.TEXT_NODE);
    textChildNode.textContent = Config.getInstance().title
});

document.getElementById("source-site-link").setAttribute("href", Config.getInstance().originalSiteUrl)
document.getElementById("source-site-link").innerText = Config.getInstance().originalSiteName

// SETUP NAVBAR TO CHANGE VIEW
const main = document.getElementsByTagName("main")[0]
const homeView = document.getElementById("home-view")
let focusedView = homeView

document.getElementById("home-view-link").addEventListener("click", () => {
    if (focusedView !== homeView) {
        focusedView = homeView
        main.removeChild(PlayerCardsView.playerCardsDiv)
        main.appendChild(homeView)
    }
})


document.getElementById("player-cards-view-link").addEventListener("click", () => {
    if (focusedView === homeView) {
        focusedView = PlayerCardsView.playerCardsDiv
        main.removeChild(homeView)
        main.appendChild(focusedView)
    }
})

await initPage();