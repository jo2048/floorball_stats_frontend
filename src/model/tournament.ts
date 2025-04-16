import { Config } from "../view/config.js";
import { Season } from "./season.js";


class Tournament {
  static emptyTournament = new Tournament(-1, "Empty tournament", new Season(-1, "Empty season"), "Empty division")
  private static cache: Map<number | string, Tournament> = new Map([
    [-1, this.emptyTournament],
    [null, this.emptyTournament]
  ]);

  constructor(readonly id: number, readonly name: string, readonly season: Season, readonly division: string) { }

  getNameFormatted() {
    return [this.season.getNameFormatted(), this.name.replace(/\[.*\]/, '').trim()]
  }

  static async #delay(milliseconds: number){
    return new Promise(resolve => {
      setTimeout(resolve, milliseconds);
    });
  }

  static async getTournamentById(tournamentId: number) {
    if (tournamentId === undefined)
      throw new Error("Invalid argument to get tournament : tournamentId=" + tournamentId)
    while (this.cache.has("wait-for-"+tournamentId))
      await this.#delay(250)
    if (!this.cache.has(tournamentId)) {
      this.cache.set("wait-for-"+tournamentId, null)
      const [_, tournamentData] = await fetchTournament(tournamentId);
      const season = await Season.getSeasonById(tournamentData["season_id"]);
      this.cache.delete("wait-for-"+tournamentId)
      this.cache.set(tournamentId, new Tournament(tournamentId, tournamentData["name"], season, tournamentData["division"]));
    }
    return this.cache.get(tournamentId);
  }
}

async function fetchTournament(tournamentId: number): Promise<[number, any]> {
  const url = Config.getBaseUrl() + "public_tournament_get.php";
  const payload = { id: tournamentId, command: "get" };
  try {
    const response = await fetch (url, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error(`Response status: ${response.status} for tournamentId= ${tournamentId}`);
    }
    const json = await response.json();
    return [response.status, json];
  } catch (error) {
    console.error(`Error fetching tournament data: ${error.message}`);
    return [500, null];
  }
}

export { Tournament };