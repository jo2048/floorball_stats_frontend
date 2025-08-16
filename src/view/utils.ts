declare var bootstrap: any;

import { Chart } from "chart.js";
import { searchPlayerByName } from "../model/fetch_player_data.js"
import { Player } from "../model/player";
import { COLORS } from "./config.js";
import { ClubRegistry } from "../model/club.js";

function fillSelect(select: HTMLSelectElement, values: Array<any>) {
  select.querySelectorAll("option").forEach((e) => e.remove());
  for (const elt of values) {
    const opt = document.createElement("option");
    opt.value = elt["id"];
    opt.textContent = elt.getNameFormatted();
    select.appendChild(opt);
  }
}

function roundNumber(number: number) {
  return Math.round(number * 100 + Number.EPSILON) / 100;
}

function configTooltips() {
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
  const _ = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
}

function createSearchPlayerDiv(addPlayerFunction: CallableFunction): HTMLDivElement {
  const template = document.createElement("template")
  template.innerHTML = `<div class="mb-3 d-flex flex-row column-gap-2" >
          <input type="search" required minlength="3" maxlength="15" size="15" placeholder="Doe John" pattern="[a-zA-Z \\-]+">
          <button class="btn btn-secondary" type="button">Search players by name</button>
        </div>`
  
  const divElement = template.content.firstChild as HTMLDivElement
  const inputElement = divElement.querySelector("input")
  const buttonElement = divElement.querySelector("button")


  function updateSearchPlayerBtn() {  
    inputElement.classList.remove("border-danger")
    if (!inputElement.checkValidity()) {
      buttonElement.disabled = true
      buttonElement.classList.remove("btn-success")
      buttonElement.classList.add("btn-secondary")
      if (inputElement.value) 
        inputElement.classList.add("border-danger")
    }
    else {
      buttonElement.disabled = false
      buttonElement.classList.remove("btn-secondary")
      buttonElement.classList.add("btn-success")
    }
  }

  inputElement.addEventListener("change", () => updateSearchPlayerBtn())
  inputElement.addEventListener("keyup", () => updateSearchPlayerBtn())
  inputElement.dispatchEvent(new Event("keyup"))

  buttonElement.addEventListener("click", async () => {
    if (inputElement.checkValidity()) {
      const [_, result] = await searchPlayerByName(inputElement.value)
      const players: Array<Player> = result.map((data: unknown) => Player.registerPlayer(data))
      players.forEach(p => addPlayerFunction(p))
    }
  })

  return divElement
}


interface PlayerSelectionCard extends HTMLDivElement {
  select: () => void
  unselect: () => void
  status: "selected" | "not selected"
  player: Player
}


function createPlayerSelectionCard(player: Player): PlayerSelectionCard {
  const template = document.createElement("template")
  const club = ClubRegistry.getClubById(player.currentClubId)
  const teamSpanStr = `<h6 class="mb-0">
    <span class="badge px-3 py-2 text-secondary-emphasis border rounded-pill bg-warning-subtle">
      ${club?.name}
    </span>
  </h6>`
  template.insertAdjacentHTML("beforeend", `<div 
    class="card bg-secondary-subtle rounded-5 scale-on-hover">
    <div class="card-body p-3 sm:p-6 pe-auto" role="button">
      <div class="flex-1 min-w-0 gap-2">
        <h4 class="card-title text-lg sm:text-xl mb-3">
          ${player.getNameFormatted()}
        </h4>
        <h6 cslass="mb-0">
          <span class="badge px-3 py-2 text-secondary-emphasis border rounded-pill bg-warning-subtle">
            ${player.getAge() > 100 ? "age unknown" : player.getAge() + " years old"}
          </span>
        </h6>
        ${player.currentClubId ? teamSpanStr : ""}
      </div>
    </div>
  </div>
   `
  )
  // <img with="28" height="28" class="rounded-pill" src=${club?.logo}>

  const card = template.firstElementChild as PlayerSelectionCard

  card.player = player
  card.status = "not selected"

  card.select = () => {
    // span.classList.remove("text-secondary-emphasis", "bg-secondary-subtle", "border-secondary-subtle")
    // span.classList.add("text-primary-emphasis", "bg-primary-subtle", "border-primary-subtle")
    // selectIcon.classList.remove("bi-circle")
    // selectIcon.classList.add("bi-check-circle")
    card.classList.remove("bg-secondary-subtle")
    card.classList.add("bg-success-subtle")
    card.status = "selected"
  }

  card.unselect = () => {
    card.classList.remove("bg-success-subtle")
    card.classList.add("bg-secondary-subtle")
    card.status = "not selected"
  }
  return card
}


class ErrorToast {
  static toastContainer: HTMLDivElement
  
  readonly toast: HTMLDivElement

  static #initToastContainer(): void {
    this.toastContainer = document.createElement("div")
    this.toastContainer.classList.add("toast-container","position-fixed","bottom-0","end-0","p-3")
    document.getElementsByTagName("main")[0].appendChild(this.toastContainer)
  }
  
  constructor(playerName: string) {
    if (!ErrorToast.toastContainer)
      ErrorToast.#initToastContainer()

    const date = new Date(Date.now())

    this.toast = document.createElement("div")
    this.toast.classList.add("toast")
    this.toast.setAttribute("role", "alert")
    this.toast.setAttribute("aria-live", "assertive")
    this.toast.setAttribute("aria-atomic", "true")
    this.toast.setAttribute("data-bs-autohide", "false")
    ErrorToast.toastContainer.appendChild(this.toast)

    this.toast.insertAdjacentHTML("beforeend", `
      <div class="toast-header bg-danger">
        <strong class="me-auto">Server error</strong>
        <small>${date.toLocaleTimeString()}</small>
        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body">
        Server error : can not retrieve games for ${playerName}
      </div>`)
  }

  show() {
    const toastBootstrap = bootstrap.Toast.getOrCreateInstance(this.toast)
    toastBootstrap.show()
  }
}

class Modal {
  static modalElement: HTMLDivElement = document.getElementById('chart-modal') as HTMLDivElement
  static modal: any = this.#getModal()
  static modalBody: HTMLDivElement = this.modalElement.querySelector("#chart-modal-body")
  static modalLabel = this.modalElement.querySelector("#chart-modal-label")
  
  static #getModal() {
    return new bootstrap.Modal(this.modalElement)
  }

  static showContent(content: HTMLElement) {
    this.modalBody.childNodes.forEach(element => {
      element.remove()
    });
    this.modalBody.appendChild(content)
    this.modal.show()
  }

  static setText(newText: string) {
    this.modalLabel.textContent = newText
  }
}


function createDoughnutChart(canvas: HTMLCanvasElement, labels: Array<string>, data: Array<number>, title: string): Chart {
  return new Chart(canvas, {
    type: "doughnut", 
    data: {
      labels: labels,
      datasets: [{
        // label: player.name,
        data: data,
        hoverOffset: 4,
        backgroundColor: labels.filter(label => COLORS[label] == null).length == 0 ? labels.map(label => COLORS[label]) : null
      }]
    },
    options: {
      plugins: {
        title: {
          display: title!=null,
          text: title
        }
      }
    }
  })
}

export { fillSelect, roundNumber, configTooltips, ErrorToast, Modal, createSearchPlayerDiv, createPlayerSelectionCard, PlayerSelectionCard, createDoughnutChart }