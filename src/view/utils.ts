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

export { fillSelect, roundNumber }