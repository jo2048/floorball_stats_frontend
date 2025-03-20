  

class Season {
  static _instances = null;

  constructor(seasonId, seasonName) {
    this.id = seasonId;
    this.name = seasonName;
    this.startDate = new Date(parseInt(this.name.split(" ")[1].slice(0, 4)), 7, 1);
    this.endDate = new Date(parseInt(this.name.slice(-4)), 6, 31);
  }

  getFormattedName() {
    return this.name.slice(-9);
  }

  containsGame(game) {
    return game.tournament.season.id === this.id
  }

  static async getSeasonById(seasonId) {
    if (this._instances === null) {
      await this.fetchAllSeasons();
    }
    return this._instances[seasonId];
  }

  static async fetchAllSeasons() {
    const url = "https://www.floorballbelgium.be/api/public_season_getall.php";
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

  static async fillHtmlSelect(select) {
    if (!this._instances) {
      await this.fetchAllSeasons();
    }
    const seasons = Array.from(this._instances.values()).sort((s1, s2) => s2.startDate - s1.startDate)
    for (const season of seasons) {
      const opt = document.createElement("option");
      opt.value = season.id;
      opt.textContent = season.name;
      select.appendChild(opt);
    }
  }
}

export { Season };