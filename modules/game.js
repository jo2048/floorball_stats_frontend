import { fetchPlayerData } from "./fetch_player_data.js";
import { Tournament } from "./tournament.js";

class Game {
  constructor(data, tournament) {
    this.id = data["id"];
    this.tournament = tournament;
    this.roundId = data["round_id"];
    this.isPlayed = data["is_played"];
    this.teamAwayId = data["team_away_id"];
    this.teamHomeId = data["team_home_id"];
    this.scoreHome = data["score_home"];
    this.scoreAway = data["score_away"];
    this.sporthallId = data["sporthall_id"];
    this.date = new Date(data["date"]);
    this.time = data["time"];
  }

  getSeason() {
    if (this.tournament.id && this.tournament.id >= 0)
      return this.tournament.season
    else
      return Season.findSeasonByDate(this.date)
  }
}

class PlayerGame extends Game {
  constructor(data, tournament) {
    super(data, tournament);
    this.playerId = data["player"]["id"];
    this.playerTeamId = data["player"]["teamid"];
    this.playerGoals = data["player"]["goal"];
    this.playerAssists = data["player"]["assist"];
    this.playerFaults = data["player"]["fault"];
    this.playerMvp = data["player"]["mvp"];
    this.playerNumber = data["player"]["number"];
  }

  isWon() {
    if (this.scoreHome === this.scoreAway) return "TIE";

    const isHome = this.playerTeamId === this.teamHomeId;
    const homeWon = this.scoreHome > this.scoreAway;

    return (homeWon && isHome) || (!homeWon && !isHome) ? "WON" : "LOST";
  }

  static async createFromData(data) {
    const tournament = await Tournament.getTournamentById(data["competition_id"])
    return new PlayerGame(data, tournament)
  }
}

function uniqBy(a, key) {
  return [
      ...new Map(
          a.map(x => [key(x), x])
      ).values()
  ]
}

class GameCollection {
  static gamesByPlayerCache = new Map() 

  constructor(player, games) {
    if (!player || !games)
      throw new Error("Invalid argument exception when trying to create GameCollection")
    this.player = player
    this.games = games
  }

  getStatsGroupedBy(competitionLevel) {
    if (!["SEASON", "TOURNAMENT"].includes(competitionLevel))
      throw new Error("Invalid argument exception")
    const groups = this.groupGamesBy(competitionLevel)
    console.log(groups)
    return Array.from(groups.entries().map(([k, v]) => [k, new GameCollection(this.player, v).computeStats()]))
  }

  computeStats() {
    const gamesPlayedCount = this.getGamesPlayedCount()
    const goalsCount = this.getGoalsCount()
    const assistsCount = this.getAssistsCount()
    const faultsCount = this.getFaultsCount()
    const wonTieLostCount = this.getWonTieLostCount()
    return {
      games_played: gamesPlayedCount,
      goals: goalsCount,
      assists: assistsCount,
      faults: faultsCount,
      won: wonTieLostCount.get("WON"),
      tie: wonTieLostCount.get("TIE"),
      lost: wonTieLostCount.get("LOST")
    }
  }

  groupGamesBy(competitionLevel) {
    const groupingFunction = competitionLevel == "SEASON" ? (game) => game.getSeason() : (game) => game.tournament
    const groups = new Map()
    for (const game of this.games) {
      const groupingKey = groupingFunction(game)
      if (!groups.has(groupingKey))
        groups.set(groupingKey, [])
      groups.get(groupingKey).push(game)
    }
    return groups
  }

  getGoalsCount() {
    return this.games.reduce((sum, g) => sum + g.playerGoals, 0);
  }

  getAssistsCount() {
    return this.games.reduce((sum, g) => sum + g.playerAssists, 0);
  }

  getGamesPlayedCount() {
    return this.games.filter((g) => g.isPlayed == 1).length;
  }

  getFaultsCount() {
    return this.games.reduce((sum, g) => sum + g.playerFaults, 0);
  }

  getWonTieLostCount() {
    const count = new Map([
      ["WON", 0],
      ["TIE", 0],
      ["LOST", 0],
    ]);
    this.games.forEach((g) => count.set(g.isWon(), count.get(g.isWon()) + 1));
    return count;
  }

  static async loadPlayerGameCollection(player) {
    if (!this.gamesByPlayerCache.has(player.id)) {
      const [, matches] = await fetchPlayerData(player.id, "match")
      const games = await Promise.all(matches.list_match.map(async data => await PlayerGame.createFromData(data)))
      this.gamesByPlayerCache.set(player.id, uniqBy(games, (g) => g.id))
    }
    return new GameCollection(player, this.gamesByPlayerCache.get(player.id)) 
  }
}

export { PlayerGame, GameCollection };
