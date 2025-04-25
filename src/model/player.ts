import { fetchPlayerData } from "./fetch_player_data.js"


class Player {
  private static cache: Map<number, Player> = new Map();

  readonly birthdate: Date;

  constructor(readonly id: number, readonly name: string, birthdate: Date, public sex: string, public currentClubName: string) {
    this.birthdate = new Date(birthdate);
    this.currentClubName = currentClubName == "NO" ? "No club currently" : currentClubName
  }

  getAge() {
    const currentDate = new Date(Date.now())
    let result = currentDate.getFullYear() - this.birthdate.getFullYear()
    if (currentDate.getMonth() < this.birthdate.getMonth() || (currentDate.getMonth() == this.birthdate.getMonth() && currentDate.getDate() < this.birthdate.getDate())) 
      result -= 1
    return result
  }

  getNameFormatted() {
    return this.name;
  }

  static registerPlayer(playerData: any): Player {
    const playerId = playerData.id;
    if (!this.cache.has(playerId))
      this.cache.set(
        playerId,
        new Player(
          playerId,
          playerData["name"],
          playerData["birthdate"],
          playerData["sex"],
          playerData["clubname"]
        )
      );
    return this.cache.get(playerId);
  }

  static async getPlayerById(playerId: number) {
    if (!this.cache.has(playerId)) {
      const [, playerData] = await fetchPlayerData(playerId, "get");
      this.registerPlayer(playerData);
    }
    return this.cache.get(playerId);
  }
}

export { Player };
