import { initPage } from "./view/player_selection.js";
import { Config } from "./view/config.js";

Array.from(document.getElementsByClassName("main-title")).forEach(element => {
    element.textContent = Config.getInstance().title
});

document.getElementById("source-site-link").setAttribute("href", Config.getInstance().originalSiteUrl)
document.getElementById("source-site-link").textContent = Config.getInstance().originalSiteName

await initPage();