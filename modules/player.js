import { fetchPlayerData } from "./fetch_player_data.js";

class Player {
  static cache = new Map();

  constructor(playerId, playerName, birthdate, sex, teamId) {
    this.id = playerId;
    this.name = playerName;
    this.birthdate = birthdate;
    this.sex = sex;
    this.teamId = teamId;
  }

  getNameFormatted() {
    if (this.name === "Y. H.") {
      return "Helenus\nYanis";
    }
    if (this.name === "L. G.") {
      return "Gignez\nLoic";
    }
    return this.name.replace(/\s\s/g, " ").split(" ").reverse().join("\n");
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
          playerData["team_id"]
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
