import { Config } from "../view/config.js";
import { getOrFetchData } from "./cache.js";
import { ClubRegistry } from "./club.js";
import { Team } from "./team.js";


class Season {
  private static seasonsCache: Map<number, Season> = null;
  private static clubCache: Map<string, Array<Club>> = new Map();
  private static teamCache: Map<string, Array<Team>> = new Map();

  readonly startDate: Date
  readonly endDate: Date
  clubs: Array<Club>

  constructor(readonly id: number, readonly name: string) {
    const pattern1 = new RegExp("^\\d{4}-\\d{2}$");
    const pattern2 = new RegExp("^\\d{4}-\\d{4}$")
    if (pattern1.test(this.name)) {
      this.startDate = new Date(parseInt(this.name.slice(0, 4)), 9, 1);
      this.endDate = new Date(parseInt("20" + this.name.slice(-2)), 8, 31);
    }
    else if (pattern2.test(this.name)) {
      this.startDate = new Date(parseInt(this.name.slice(0, 4)), 9, 1);
      this.endDate = new Date(parseInt(this.name.slice(-4)), 8, 31);
    }
    else {
      this.startDate = new Date(parseInt(this.name.split(" ")[1].slice(0, 4)), 9, 1);
      this.endDate = new Date(parseInt(this.name.slice(-4)), 8, 31);
    }
    this.clubs = null
  }

  getNameFormatted() {
    return this.name.slice(-9);
  }

  static findSeasonByDate(date: Date) {
    if (!this.seasonsCache) throw new Error("Seasons not initiazed")
    return Array.from(this.seasonsCache.values()).find(s => s.startDate <= date && s.endDate > date)
  }

  static getSeasonById(seasonId: number) {
    if (!this.seasonsCache) throw new Error("Seasons not initiazed")
    return this.seasonsCache.get(seasonId);
  }

  static async init() {
    const url = Config.getInstance().baseUrl + "public_season_getall.php";
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
      const json = await response.json();
      this.seasonsCache = new Map(json.map((seasonData: any) => [seasonData.id, new Season(seasonData.id, seasonData.name)]))
    } catch (error: any) {
      console.error(error.message);
    }
    // await Promise.all(Array.from(this._instances.values()).map(season => season.fetchClubs()))
  }

  static sortSeasons(seasons: Array<Season>): Array<Season> {
    return seasons.toSorted((s1, s2) => s2.startDate.getTime() - s1.startDate.getTime())
  }

  static getSeasonsSorted(): Array<Season> {
    if (!this.seasonsCache) throw new Error("Seasons not initiazed")
    return this.sortSeasons(Array.from(this.seasonsCache.values()))
  }

  static getCurrentSeason(): Season {
    if (!this.seasonsCache) throw new Error("Seasons not initiazed")
    const currentDate = new Date(Date.now())
    return Array.from(this.seasonsCache.values()).filter(s => s.startDate <= currentDate && s.endDate > currentDate)[0]
  }

  static async #fetchClubs(seasonId: number): Promise<[number, Array<Club>]> {
    const url = Config.getInstance().baseUrl + "public_clubs_getall.php";
    const payload = { seasonid: seasonId };
    try {
      const response = await fetch (url, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
          throw new Error(`Response status: ${response.status} for clubs for season= ${seasonId}`);
      }
      const json = await response.json();
      return [200, json.map((e: any) => ClubRegistry.getOrRegisterClub(e))]
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
      return [500, null];
    }
  }

  static async getClubsBySeason(seasonId: number): Promise<Array<Club>> {
    if (!this.seasonsCache) throw new Error("Seasons not initiazed");
    return await getOrFetchData(Season.clubCache, this.#fetchClubs, ""+seasonId)
  }

  static async getTeamsBySeasonAndClub(seasonId: number, clubId: number): Promise<Array<Team>> {
    return await getOrFetchData(this.teamCache, this.#fetchTeamsBySeasonAndClub, ""+seasonId, ""+clubId)
  }

  static async #fetchTeamsBySeasonAndClub(seasonId: number, clubId: number): Promise<[number, Array<Team>]> {
    const url = Config.getInstance().baseUrl + "public_teams_byclubbyseason.php"
    const payload = { seasonid: seasonId, clubid: clubId };
    try {
      const response = await fetch (url, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
      }
      const json = await response.json();
      return [response.status, json.map((e: any) => new Team(e.id, e.category, e.clubid, e.name))];
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
      return [500, null];
    }
  }
}

export { Season };