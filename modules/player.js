import { fetchPlayerData } from "./fetch_player_data.js";

class Player {
  static cache = new Map();

  constructor(playerId, playerName, birthdate, sex, teamId, clubName) {
    this.id = playerId;
    this.name = playerName;
    this.birthdate = new Date(birthdate);
    this.sex = sex;
    this.teamId = teamId;
    this.clubName = clubName;
  }

  getAge() {
    const currentDate = new Date(Date.now())
    return currentDate.getFullYear() - this.birthdate.getFullYear() + (new Date(1970, currentDate.getMonth(), currentDate.getDay()) < new Date(1970, this.birthdate.getMonth(), this.birthdate.getDay()) ? -1 : 0)
  }

  getNameFormatted() {
    if (this.name === "Y. H.") {
      return "Helenus\nYanis";
    }
    if (this.name === "L. G.") {
      return "Gignez\nLoic";
    }
    return this.name;
  }

  static registerPlayer(playerData) {
    const playerId = playerData.id;
    if (!this.cache.has(playerId))
      this.cache.set(
        playerId,
        new Player(
          playerId,
          playerData["name"],
          playerData["birthdate"],
          playerData["sex"],
          playerData["team_id"],
          playerData["clubname"]
        )
      );
    return this.cache.get(playerId);
  }

  static async getPlayerById(playerId) {
    if (!this.cache.has(playerId)) {
      const [, playerData] = await fetchPlayerData(playerId, "get");
      this.registerPlayer(playerData);
    }
    return this.cache.get(playerId);
  }
}

export { Player };
