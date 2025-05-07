import { Player } from "../model/player"

function createContainer() {
  const container = document.createElement("div")
  container.classList.add("main-div","container-fluid","gap-3","m-3")
  return container
}

class PlayerDetailedView {
  static instance = new PlayerDetailedView()

  readonly container: HTMLDivElement
  title: HTMLHeadingElement
  player: Player

  private constructor() {
    this.container = createContainer();
    this.title = document.createElement("h5")
    this.title.innerHTML = "No player currently selected"
    this.container.insertAdjacentElement("beforeend", this.title)

    this.container.insertAdjacentHTML("beforeend",`
      <div class="container row gap-2">

      </div>`
    );

  }

  setPlayer(player: Player) {
    this.player = player
  }
}


export { PlayerDetailedView }