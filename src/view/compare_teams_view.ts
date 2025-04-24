import { Chart } from "chart.js";
import { getTeamPlayers } from "../model/fetch_player_data";
import { Player } from "../model/player";
import { Season } from "../model/season";
import { fillSelect } from "./utils";
import { Team } from "../model/team";
import { GameCollection, Stats } from "../model/game";


function createContainer() {
  const container = document.createElement("div")
  container.classList.add("main-div","container-fluid","gap-3","m-3")
  return container
}

class CompareTeamsView {
  static container = createContainer();

  static teams: Array<Team> = []

  static async init() {
    this.container.insertAdjacentHTML(
      "beforeend",
      `
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

    const clubSelect = this.container.querySelector(
      "#club-select-view1"
    ) as HTMLSelectElement;
    const teamSelect = this.container.querySelector(
      "#team-select-view1"
    ) as HTMLSelectElement;
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

    addTeamBtn.addEventListener("click", async () => {
      this.teams.push(Team.getTeamById(parseInt(teamSelect.value)))
      await this.drawChart(this.teams)
    });
  }

  static async drawChart(teams: Array<Team>) {
    const div = document.createElement("div");
    div.classList.add("chart-container")
    this.container.appendChild(div);
    const canvas = document.createElement("canvas");
    canvas.classList.add("m-3")
    div.appendChild(canvas)
    const data = await Promise.all(teams.map(async team => await getTeamData(team)))
    const chart = new Chart(canvas, {
      type: "bubble",
      data: {
        datasets: data
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
          }
        }
      }
    } );

    return canvas;
  }
}

/**
 * @returns Number of days between the two given dates
 */
function datediff(first: Date, second: Date): number {        
  return Math.round((second.getTime() - first.getTime()) / (1000 * 60 * 60 * 24));
}


async function getTeamData(team: Team) {
  const data = await getTeamPlayers(team.id)
  const players = await Promise.all(data.map((e: unknown) => Player.registerPlayer(e)))
  const map: Map<Player, Stats> = new Map()
  for (const p of players) {
    const collection = await GameCollection.loadPlayerGameCollection(p)
    map.set(p, collection.computeStats())
  }
  return {
    label: team.getNameFormatted(),
    data: players.map(p => { 
      return {
        x: datediff(p.birthdate, new Date(Date.now())) / 365.25,
        y: map.get(p).gamesPlayed,
        r: 7,
        name: p.getNameFormatted()
      }
    })
  }
}


export { CompareTeamsView };
