declare var bootstrap: any;

function fillSelect(select: HTMLSelectElement, values: Array<any>) {
  select.querySelectorAll("option").forEach((e) => e.remove());
  for (const elt of values) {
    const opt = document.createElement("option");
    opt.value = elt["id"];
    opt.textContent = elt["name"];
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

export { fillSelect, roundNumber, configTooltips, ErrorToast, Modal, Spinner }