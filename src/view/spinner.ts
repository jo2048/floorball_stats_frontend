class Spinner {
  readonly container: HTMLDivElement
  constructor() {
    this.container = document.createElement("div")
    this.container.classList.add("d-flex","justify-content-center")
    const spinner = document.createElement("div")
    spinner.classList.add("spinner-border","loading-spinner")
    spinner.setAttribute("role", "status")
    this.container.appendChild(spinner)

    const span = document.createElement("span")
    span.classList.add("visually-hidden")
    span.textContent = "Loading..."
    spinner.appendChild(span)
  }

  show() {
    this.container.classList.remove("d-none")
  }

  hide() {
    this.container.classList.add("d-none")
  }
}

export {Spinner}