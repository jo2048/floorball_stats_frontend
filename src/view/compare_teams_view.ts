import { Chart } from "chart.js/auto";
import { getTeamPlayers } from "../model/fetch_player_data";
import { Player } from "../model/player";
import { Season } from "../model/season";
import { fillSelect, roundNumber, Spinner } from "./utils";
import { Team } from "../model/team";
import { GameCollection, Stats } from "../model/game";


interface TeamSpan extends HTMLSpanElement {
  color: string
  team: Team
}

function generateRandomColor() {
  const randomBetween = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));
  const r = randomBetween(0, 255);
  const g = randomBetween(0, 255);
  const b = randomBetween(0, 255);
  return `rgba(${r},${g},${b}, 70)`
}

function createContainer() {
  const container = document.createElement("div")
  container.classList.add("main-div","container-fluid","gap-3","m-3")
  return container
}

class CompareTeamsView {
  static instance = new CompareTeamsView()
  readonly container: HTMLDivElement
  readonly selectedTeamsDiv: HTMLDivElement
  readonly teamSpans: Map<number, TeamSpan>
  readonly canvas: HTMLCanvasElement
  readonly spinner: Spinner
  chart: Chart

  private constructor() {
    this.container = createContainer();
    this.teamSpans = new Map()

    this.container.insertAdjacentHTML("beforeend",`
      <h5>Search by team</h5>
      <div class="container row gap-2">
        <span class="col-xl-3 row">
          <label for="club-select-view1">Club</label>
          <select class="form-select" name="clubs" id="club-select-view1"></select>
        </span>
        <span class="col-xl-4 row">
          <label for="team-select-view1">Team</label>
          <select class="form-select" name="teams" id="team-select-view1"></select>
        </span>
        <span class="col-xl-3 row align-self-end">
          <button id="add-team-view1" type="submit" class="btn btn-success">Add team</button>
        </span>
      </div>`
    );

    this.selectedTeamsDiv = document.createElement("div");
    this.selectedTeamsDiv.classList.add("container-fluid","d-flex","gap-2","m-3","justify-content-center")
    this.container.appendChild(this.selectedTeamsDiv);

    this.spinner = new Spinner()
    this.spinner.hide()
    this.spinner.container.classList.add("my-3")
    this.container.appendChild(this.spinner.container)

    // selectedTeamsDiv.appendChild()

    const div = document.createElement("div");
    div.classList.add("chart-container")
    this.container.appendChild(div);
    this.canvas = document.createElement("canvas");
    this.canvas.classList.add("m-3")
    div.appendChild(this.canvas)
  }

  createSelectedTeamBadge(team: Team) {
    const color = "#" + ((1 << 24) * Math.random() | 0).toString(16).padStart(6, "0")

    const template = document.createElement("template")
    template.insertAdjacentHTML("beforeend", `
      <span class="badge d-flex align-items-center p-1 pe-2 text-success-emphasis bg-success-subtle border border-success-subtle rounded-pill">
        <input type="color" value="${color}" style="width: 28px; height: 28px;" class="ms-2 p-1 form-control form-control-color">
        <span class="my-2 ms-2">
          ${team.getNameFormatted()}
        </span>  
        <span class="vr mx-2"></span>
        <a href="#" class="link-dark delete-link me-1" aria-label="Delete success"><i class="bi bi-x-circle-fill h5"></i></a>
      </span>`
    )
    const span = template.firstElementChild as TeamSpan
    this.teamSpans.set(team.id, span)
    span.color = color
    span.team = team

    const colorInput = span.querySelector(".form-control-color") as HTMLInputElement
    colorInput.addEventListener("change", () => {
      span.color = colorInput.value
      this.updateChart()
    })
    span.querySelector(".delete-link").addEventListener("click", () => {
      span.remove()
      this.teamSpans.delete(team.id)
      this.updateChart()
    })

    return span
  }

  async init() {
    const clubSelect = this.container.querySelector("#club-select-view1") as HTMLSelectElement;
    const teamSelect = this.container.querySelector("#team-select-view1") as HTMLSelectElement;
    const addTeamBtn = this.container.querySelector("#add-team-view1");

    const seasons = await Season.getSeasonsSorted();
    const clubs = await Season.fetchSeasonClubs(seasons[0].id);
    fillSelect(clubSelect, clubs);

    clubSelect.addEventListener("change", async () => {
      const [_, teams] = await Season.fetchTeamsBySeasonAndClub(
        seasons[0].id,
        parseInt(clubSelect.value)
      );
      fillSelect(teamSelect, teams);
    });
    clubSelect.dispatchEvent(new Event("change"));

    teamSelect.addEventListener("change", async () => {
      const teamId = parseInt(teamSelect.value)
      teamSelect.disabled = this.teamSpans.has(teamId)
    });

    addTeamBtn.addEventListener("click", async () => {
      const teamId = parseInt(teamSelect.value)
      if (!this.teamSpans.has(teamId)) {
        this.selectedTeamsDiv.appendChild(this.createSelectedTeamBadge(Team.getTeamById(teamId)))
        await this.updateChart()
      }
    });

    this.chart = new Chart(this.canvas, {
      type: "bubble",
      data: {
        datasets: []
      },
      options: {
        scales: {
          x: {
            title: {
              display: true,
              text: "Age"
            }
          },
          y: {
            title: {
              display: true,
              text: "Number of games played"
            }
          }
        },
        plugins:{
          datalabels: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (tooltipItem: any) => {
                return `${tooltipItem.raw.name} (${roundNumber(tooltipItem.raw.x)};${roundNumber(tooltipItem.raw.y)})`
              }
            }
          }
        }
      }
    } );
  }

  async updateChart() {
    this.spinner.show()
    const data = await Promise.all(Array.from(this.teamSpans.values()).map(async span => await getTeamData(span.team, span.color)))
    this.chart.data.datasets = data 
    this.chart.update()
    this.spinner.hide()
  }
}

/**
 * @returns Number of days between the two given dates
 */
function datediff(first: Date, second: Date): number {        
  return Math.round((second.getTime() - first.getTime()) / (1000 * 60 * 60 * 24));
}


async function getTeamData(team: Team, color: string) {
  const playersData = await getTeamPlayers(team.id)
  const players = await Promise.all(playersData.map((e: unknown) => Player.registerPlayer(e)))
  const map: Map<Player, Stats> = new Map()
  for (const p of players) {
    const collection = await GameCollection.loadPlayerGameCollection(p)
    map.set(p, collection.computeStats())
  }
  const statsData = players
    .filter(p => p.getAge() <= 100)
    .map(p => { 
      return {
        x: datediff(p.birthdate, new Date(Date.now())) / 365.25,
        y: map.get(p).gamesPlayed,
        r: 5,
        name: p.getNameFormatted()
      }
    })

  const avg = {
    x: findAverage(statsData.map(s => s.x)),
    y: findAverage(statsData.map(s => s.y)),
    r: 10,
    name: `Average ${team.getNameFormatted()}`
  }

  // const median = {
  //   x: findMedian(statsData.map(s => s.x)),
  //   y: findMedian(statsData.map(s => s.y)),
  //   r: 10,
  //   name: `median ${team.getNameFormatted()}`
  // }

  statsData.push(avg)
  // statsData.push(median)
  return {
    label: team.getNameFormatted(),
    // pointStyle: (ctx: any) => {
    //   if (ctx.raw.name.includes("average"))
    //     return "star"
    //   return ctx.raw.name.includes("median") ? "cross" : "circle"
    // },
    data: statsData,
    backgroundColor: color + "BB" // +"AA" for opacity
  }
}

function findMedian(arr: Array<number>) {
  arr.sort((a, b) => a - b);
  const middleIndex = Math.floor(arr.length / 2);

  if (arr.length % 2 === 0) {
    return (arr[middleIndex - 1] + arr[middleIndex]) / 2;
  } else {
    return arr[middleIndex];
  }
}

function findAverage(arr: Array<number>) {
  return arr.reduce((a, b) => a + b) / arr.length;
}



export { CompareTeamsView };
