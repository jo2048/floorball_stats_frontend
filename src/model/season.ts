import { Config } from "../view/config.js";
import { Team } from "./team.js";

interface Club {
  readonly city: string,
  readonly coloraway1: string,
  readonly coloraway2: string,
  readonly colorhome1: string,
  readonly colorhome2: string,
  readonly email: string,
  readonly halls: Array<any>,
  readonly id: number,
  readonly isactive: number,
  readonly matriculation: number,
  readonly name: string,
  readonly phone: string,
  readonly website: string,
  getNameFormatted: () => string;
}

class ClubFactory {
  static createClub(clubData: Club): Club {
    clubData.getNameFormatted = () => { return clubData.name }
    return clubData
  }
}

class Season {
  static _instances: Map<number, Season> = null;

  readonly startDate: Date
  readonly endDate: Date
  clubs?: Array<any>

  constructor(readonly id: number, readonly name: string) {
    const re = new RegExp("^\\d{4}-\\d{2}$");
    if (!re.test(this.name)) {
      this.startDate = new Date(parseInt(this.name.split(" ")[1].slice(0, 4)), 7, 1);
      this.endDate = new Date(parseInt(this.name.slice(-4)), 6, 31);
    }
    else {
      this.startDate = new Date(parseInt(this.name.slice(0, 4)), 7, 1);
      this.endDate = new Date(parseInt("20" + this.name.slice(-2)), 6, 31);
    }
    this.clubs = null
  }

  getNameFormatted() {
    return this.name.slice(-9);
  }

  static findSeasonByDate(date: Date) {
    if (!this._instances)
      throw new Error("This method cannot be called before initializing list of seasons")
    return Array.from(this._instances.values()).find(s => s.startDate <= date && s.endDate > date)
  }

  static async getSeasonById(seasonId: number) {
    if (this._instances === null) {
      await this.fetchAllSeasons();
    }
    return this._instances.get(seasonId);
  }

  static async fetchAllSeasons() {
    const url = Config.getInstance().baseUrl + "public_season_getall.php";
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
      const json = await response.json();
      this._instances = new Map(json.map((seasonData: any) => [seasonData.id, new Season(seasonData.id, seasonData.name)]))
    } catch (error: any) {
      console.error(error.message);
    }
  }

  
  static compare(s1: Season, s2: Season): number {
    return s2.startDate.getTime() - s1.startDate.getTime()
  }

  static async getSeasonsSorted(): Promise<Array<Season>> {
    if (!this._instances) {
      await this.fetchAllSeasons();
    }
    return Array.from(this._instances.values()).toSorted(this.compare)
  }

  async fetchClubs(): Promise<Array<any>> {
    if (this.clubs == null) {
      const url = Config.getInstance().baseUrl + "public_clubs_getall.php";
      const payload = { seasonid: this.id };
      try {
        const response = await fetch (url, {
          method: "POST",
          body: JSON.stringify(payload)
        });
        if (!response.ok) {
            throw new Error(`Response status: ${response.status} for clubs for season= ${this.id}`);
        }
        const json = await response.json();
        delete json.logo
        this.clubs = json.map((e: any) => ClubFactory.createClub(e))
      } catch (error: any) {
        console.error(`Error: ${error.message}`);
        return [500];
      }
    }
    return this.clubs
  }

  static async fetchSeasonClubs(seasonId: number): Promise<Array<any>> {
    if (!seasonId)
      throw new Error("Invalid argument to fetch clubs")
    const season = await this.getSeasonById(seasonId)
    return season.fetchClubs()
  }

  static async fetchTeamsBySeasonAndClub(seasonId: number, clubId: number): Promise<[number, Array<Team>]> {
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