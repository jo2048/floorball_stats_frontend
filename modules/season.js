import { Config } from "./config.js";

class Season {
  static _instances = null;

  constructor(seasonId, seasonName) {
    this.id = seasonId;
    this.name = seasonName;
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

  containsGame(game) {
    return game.tournament.season.id === this.id
  }

  static getSeasonByDate(date) {
    if (!this._instances)
      throw new Error("This method cannot be called before initializing list of seasons")
    return this._instances.values().find(s => s.startDate >= date && s.endDate < date)
  }

  static async getSeasonById(seasonId) {
    if (this._instances === null) {
      await this.fetchAllSeasons();
    }
    return this._instances.get(parseInt(seasonId));
  }

  static async fetchAllSeasons() {
    const url = Config.getBaseUrl() + "public_season_getall.php";
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
      const json = await response.json();
      this._instances = new Map(json.map((seasonData) => [seasonData.id, new Season(seasonData.id, seasonData.name)]))
    } catch (error) {
      console.error(error.message);
    }
  }

  static async getSeasonsSorted() {
    if (!this._instances) {
      await this.fetchAllSeasons();
    }
    return Array.from(this._instances.values()).sort((s1, s2) => s2.startDate - s1.startDate)
  }

  async fetchClubs() {
    if (this.clubs == null) {
      const url = Config.getBaseUrl() + "public_clubs_getall.php";
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
        delete json.list_logo;
        delete json.clublogo;
        delete json.logo
        delete json.photo;
        this.clubs = json
      } catch (error) {
        console.error(`Error: ${error.message}`);
        return [500, null];
      }
    }
    return this.clubs
  }

  static async fetchSeasonClubs(seasonId) {
    if (!seasonId)
      throw new Error("Invalid argument to fetch clubs")
    const season = await this.getSeasonById(seasonId)
    return season.fetchClubs()
  }

  static async fetchTeamsBySeasonAndClub(seasonId, clubId) {
    const url = Config.getBaseUrl() + "public_teams_byclubbyseason.php"
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
      return [response.status, json];
    } catch (error) {
      console.error(`Error: ${error.message}`);
      return [500, null];
    }
  }
}

export { Season };