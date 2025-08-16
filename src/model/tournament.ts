import { Config } from "../view/config.js";
import { getOrFetchData } from "./cache.js";
import { Season } from "./season.js";


class Tournament {
  static emptyTournament = new Tournament(-1, "Empty tournament", new Season(-1, "No season"), 0)
  private static cache: Map<string, Tournament> = new Map([
    ["-1", this.emptyTournament],
    ["null", this.emptyTournament]
  ]);

  constructor(readonly id: number, readonly name: string, readonly season: Season, readonly division: number) { }

  getNameFormatted() {
    return [this.season.getNameFormatted(), this.name.replace(/\[.*\]/, '').trim()]
  }

  getDivision(): number {
    // division attribute is not reliable for the belgium backend, so the division is extracted from tournament name
    const re = new RegExp("D(ivision)?(\\d)");
    return parseInt(this.name.match(re)[2])
  }

  static async getTournamentById(tournamentId: number): Promise<Tournament> {
    return await getOrFetchData<Tournament>(this.cache, fetchTournament, ""+tournamentId)
  }
}

async function fetchTournament(tournamentId: number): Promise<[number, Tournament]> {
  const url = Config.getInstance().baseUrl + "public_tournament_get.php";
  const payload = { id: tournamentId, command: "get" };
  try {
    const response = await fetch (url, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error(`Response status: ${response.status} for tournamentId= ${tournamentId}`);
    }
    const data = await response.json();
    const season = await Season.getSeasonById(data["season_id"]);
    return [response.status, new Tournament(tournamentId, data["name"], season, data["division"])];
  } catch (error) {
    console.error(`Error fetching tournament data: ${error.message}`);
    return [500, null];
  }
}

export { Tournament };