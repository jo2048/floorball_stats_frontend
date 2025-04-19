import { initPage } from "./view/player_selection.js";
import { Config } from "./view/config.js";

Array.from(document.getElementsByClassName("main-title")).forEach(element => {
    const textChildNode = Array.from(element.childNodes.values())
        .findLast((child: HTMLElement) => child.nodeType === Node.TEXT_NODE);
    textChildNode.textContent = Config.getInstance().title
});

document.getElementById("source-site-link").setAttribute("href", Config.getInstance().originalSiteUrl)
document.getElementById("source-site-link").innerText = Config.getInstance().originalSiteName

await initPage();